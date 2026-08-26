import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabase, SheepRecord } from '@/db/sheep';

function normalizeTag(value: unknown) {
  return String(value ?? '').trim().toUpperCase();
}

export async function GET(request: NextRequest) {
  const db = await ensureDatabase();
  const query = normalizeTag(request.nextUrl.searchParams.get('q'));
  const where = query ? 'WHERE tag_number LIKE ?' : '';
  const bindings = query ? [`%${query}%`] : [];
  const [{ results }, resultTotals, farmTotals, health] = await Promise.all([
    db.prepare(`SELECT * FROM sheep ${where} ORDER BY datetime(updated_at) DESC, id DESC LIMIT 60`).bind(...bindings).all<SheepRecord>(),
    db.prepare(`SELECT COUNT(*) AS total FROM sheep ${where}`).bind(...bindings).first<{ total: number }>(),
    db.prepare('SELECT COUNT(*) AS total FROM sheep').first<{ total: number }>(),
    db.prepare(`SELECT COUNT(*) AS healthy FROM sheep WHERE status = 'Sağlıklı'`).first<{ healthy: number }>(),
  ]);
  return NextResponse.json({ records: results, total: farmTotals?.total ?? 0, resultTotal: resultTotals?.total ?? 0, healthy: health?.healthy ?? 0 });
}

export async function POST(request: NextRequest) {
  const db = await ensureDatabase();
  const body = await request.json() as Record<string, unknown>;
  const tag = normalizeTag(body.tag_number);
  const age = Number(body.age);
  const weight = Number(body.weight);
  if (!/^T\d{4,}$/.test(tag) || !Number.isFinite(age) || !Number.isFinite(weight)) {
    return NextResponse.json({ error: 'Küpe numarası T1111 biçiminde olmalı; yaş ve kilo girilmelidir.' }, { status: 400 });
  }
  try {
    const result = await db.prepare(`INSERT INTO sheep
      (tag_number, age, weight, breed, gender, status, medications, notes, updated_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
      .bind(tag, age, weight, String(body.breed || 'Akkaraman'), String(body.gender || 'Dişi'), String(body.status || 'Sağlıklı'), String(body.medications || ''), String(body.notes || '')).run();
    const record = await db.prepare('SELECT * FROM sheep WHERE id = ?').bind(result.meta.last_row_id).first<SheepRecord>();
    return NextResponse.json({ record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Bu küpe numarasıyla kayıtlı bir koyun zaten var.' }, { status: 409 });
  }
}

