import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabase, SheepRecord, TreatmentRecord } from '@/db/sheep';

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const db = await ensureDatabase();
  const { id } = await context.params;
  const record = await db.prepare('SELECT * FROM sheep WHERE id = ?').bind(Number(id)).first<SheepRecord>();
  if (!record) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 });
  const [{ results: treatments }, { results: children }, { results: siblings }] = await Promise.all([
    db.prepare('SELECT * FROM treatments WHERE sheep_id = ? ORDER BY date(treatment_date) DESC, id DESC').bind(record.id).all<TreatmentRecord>(),
    db.prepare(`SELECT id, tag_number, business_tag_number FROM sheep WHERE mother_tag_number = ? ORDER BY tag_number`).bind(record.tag_number).all<Pick<SheepRecord, 'id' | 'tag_number' | 'business_tag_number'>>(),
    record.mother_tag_number ? db.prepare(`SELECT id, tag_number, business_tag_number FROM sheep WHERE mother_tag_number = ? AND id <> ? ORDER BY tag_number`).bind(record.mother_tag_number, record.id).all<Pick<SheepRecord, 'id' | 'tag_number' | 'business_tag_number'>>() : Promise.resolve({ results: [] }),
  ]);
  return NextResponse.json({ record, treatments, children, siblings });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const db = await ensureDatabase();
  const { id } = await context.params;
  const body = await request.json() as Record<string, unknown>;
  const tag = String(body.tag_number ?? '').trim().toUpperCase();
  const birthDate = String(body.birth_date || '');
  if (!/^T\d{4,}$/.test(tag) || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return NextResponse.json({ error: 'Lütfen zorunlu alanları geçerli biçimde doldurun.' }, { status: 400 });
  }
  try {
    const previous = await db.prepare('SELECT tag_number FROM sheep WHERE id = ?').bind(Number(id)).first<{ tag_number: string }>();
    await db.prepare(`UPDATE sheep SET tag_number = ?, business_tag_number = ?, birth_date = ?, mother_tag_number = ?, breed = ?, gender = ?, activity_status = ?, passive_reason = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(tag, String(body.business_tag_number || '').trim().toUpperCase(), birthDate, String(body.mother_tag_number || '').trim().toUpperCase(), String(body.breed || 'Merinos Anaç'), String(body.breed || '').toLocaleLowerCase('tr-TR').includes('erkek') ? 'Koç' : 'Dişi', String(body.activity_status || 'Aktif'), String(body.passive_reason || ''), String(body.notes || ''), Number(id)).run();
    if (previous && previous.tag_number !== tag) await db.prepare('UPDATE sheep SET mother_tag_number = ? WHERE mother_tag_number = ?').bind(tag, previous.tag_number).run();
    const treatment = String(body.treatment_description || '').trim();
    if (treatment) await db.prepare(`INSERT INTO treatments (sheep_id, description, treatment_date, created_at) VALUES (?, ?, ?, datetime('now'))`).bind(Number(id), treatment, String(body.treatment_date || birthDate)).run();
    const record = await db.prepare('SELECT * FROM sheep WHERE id = ?').bind(Number(id)).first<SheepRecord>();
    if (!record) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 });
    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ error: 'Normal veya işletme küpe numarası başka bir kayıtta kullanılıyor.' }, { status: 409 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const db = await ensureDatabase();
  const { id } = await context.params;
  const result = await db.prepare('DELETE FROM sheep WHERE id = ?').bind(Number(id)).run();
  if (!result.meta.changes) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

