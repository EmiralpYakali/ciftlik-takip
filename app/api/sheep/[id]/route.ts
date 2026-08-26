import { NextRequest, NextResponse } from 'next/server';
import { ensureDatabase, SheepRecord } from '@/db/sheep';

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const db = await ensureDatabase();
  const { id } = await context.params;
  const body = await request.json() as Record<string, unknown>;
  const tag = String(body.tag_number ?? '').trim().toUpperCase();
  if (!/^T\d{4,}$/.test(tag) || !Number(body.age) || !Number(body.weight)) {
    return NextResponse.json({ error: 'Lütfen zorunlu alanları geçerli biçimde doldurun.' }, { status: 400 });
  }
  try {
    await db.prepare(`UPDATE sheep SET tag_number = ?, age = ?, weight = ?, breed = ?, gender = ?, status = ?, medications = ?, notes = ?, updated_at = datetime('now') WHERE id = ?`)
      .bind(tag, Number(body.age), Number(body.weight), String(body.breed || 'Akkaraman'), String(body.gender || 'Dişi'), String(body.status || 'Sağlıklı'), String(body.medications || ''), String(body.notes || ''), Number(id)).run();
    const record = await db.prepare('SELECT * FROM sheep WHERE id = ?').bind(Number(id)).first<SheepRecord>();
    if (!record) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 });
    return NextResponse.json({ record });
  } catch {
    return NextResponse.json({ error: 'Bu küpe numarası başka bir kayıtta kullanılıyor.' }, { status: 409 });
  }
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const db = await ensureDatabase();
  const { id } = await context.params;
  const result = await db.prepare('DELETE FROM sheep WHERE id = ?').bind(Number(id)).run();
  if (!result.meta.changes) return NextResponse.json({ error: 'Kayıt bulunamadı.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}

