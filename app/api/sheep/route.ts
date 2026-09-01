import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabase, SheepRecord } from '@/db/sheep';

function normalizeTag(value: unknown) {
  return String(value ?? '').trim().toUpperCase();
}

export async function GET(request: NextRequest) {
  const db = await ensureDatabase();
  const query = normalizeTag(request.nextUrl.searchParams.get('q'));
  const activity = request.nextUrl.searchParams.get('activity') === 'Pasif' ? 'Pasif' : 'Aktif';
  const where = query ? 'WHERE activity_status = ? AND (tag_number LIKE ? OR business_tag_number LIKE ?)' : 'WHERE activity_status = ?';
  const bindings = query ? [activity, `%${query}%`, `%${query}%`] : [activity];
  const [{ results }, resultTotals, farmTotals, activeTotals, passiveTotals] = await Promise.all([
    db.prepare(`SELECT sheep.*,
      (SELECT description FROM treatments WHERE sheep_id = sheep.id ORDER BY date(treatment_date) DESC, id DESC LIMIT 1) AS latest_treatment,
      (SELECT treatment_date FROM treatments WHERE sheep_id = sheep.id ORDER BY date(treatment_date) DESC, id DESC LIMIT 1) AS latest_treatment_date
      FROM sheep ${where} ORDER BY datetime(updated_at) DESC, id DESC LIMIT 100`).bind(...bindings).all<SheepRecord>(),
    db.prepare(`SELECT COUNT(*) AS total FROM sheep ${where}`).bind(...bindings).first<{ total: number }>(),
    db.prepare('SELECT COUNT(*) AS total FROM sheep').first<{ total: number }>(),
    db.prepare(`SELECT COUNT(*) AS total FROM sheep WHERE activity_status = 'Aktif'`).first<{ total: number }>(),
    db.prepare(`SELECT COUNT(*) AS total FROM sheep WHERE activity_status = 'Pasif'`).first<{ total: number }>(),
  ]);
  return NextResponse.json({ records: results, total: farmTotals?.total ?? 0, active: activeTotals?.total ?? 0, passive: passiveTotals?.total ?? 0, resultTotal: resultTotals?.total ?? 0 });
}

export async function POST(request: NextRequest) {
  const db = await ensureDatabase();
  const body = await request.json() as Record<string, unknown>;
  const tag = normalizeTag(body.tag_number);
  const birthDate = String(body.birth_date || '');
  if (!/^T\d{4,}$/.test(tag) || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: 'Küpe numarası T1111 biçiminde olmalı ve doğum tarihi girilmelidir.' }, { status: 400 });
  }
  try {
    const result = await db.prepare(`INSERT INTO sheep
      (tag_number, business_tag_number, birth_date, mother_tag_number, age, weight, breed, gender, status, activity_status, passive_reason, medications, notes, updated_at, created_at)
      VALUES (?, ?, ?, ?, 0, 0, ?, ?, 'Sağlıklı', ?, ?, '', ?, datetime('now'), datetime('now'))`)
      .bind(tag, normalizeTag(body.business_tag_number), birthDate, normalizeTag(body.mother_tag_number), String(body.breed || 'Merinos Anaç'), String(body.breed || '').toLocaleLowerCase('tr-TR').includes('erkek') ? 'Koç' : 'Dişi', String(body.activity_status || 'Aktif'), String(body.passive_reason || ''), String(body.notes || '')).run();
    const record = await db.prepare('SELECT * FROM sheep WHERE id = ?').bind(result.meta.last_row_id).first<SheepRecord>();
    const treatment = String(body.treatment_description || '').trim();
    if (treatment && record) await db.prepare(`INSERT INTO treatments (sheep_id, description, treatment_date, created_at) VALUES (?, ?, ?, datetime('now'))`).bind(record.id, treatment, String(body.treatment_date || birthDate)).run();
    return NextResponse.json({ record }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Normal veya işletme küpe numarası başka bir kayıtta kullanılıyor.' }, { status: 409 });
  }
}

