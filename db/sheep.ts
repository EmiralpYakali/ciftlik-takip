import { env } from 'cloudflare:workers';

export type SheepRecord = {
  id: number;
  tag_number: string;
  business_tag_number: string;
  birth_date: string;
  mother_tag_number: string;
  age: number;
  weight: number;
  breed: string;
  gender: string;
  status: string;
  activity_status: string;
  passive_reason: string;
  medications: string;
  latest_treatment?: string;
  latest_treatment_date?: string;
  notes: string;
  updated_at: string;
  created_at: string;
};

export type TreatmentRecord = {
  id: number;
  sheep_id: number;
  description: string;
  treatment_date: string;
  created_at: string;
};

export function getDb() {
  return (env as unknown as { DB: D1Database }).DB;
}

export async function ensureDatabase() {
  const db = getDb();
  await db.prepare(`CREATE TABLE IF NOT EXISTS sheep (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tag_number TEXT NOT NULL UNIQUE,
      age INTEGER NOT NULL,
      weight INTEGER NOT NULL,
      breed TEXT NOT NULL,
      gender TEXT NOT NULL DEFAULT 'Dişi',
      status TEXT NOT NULL DEFAULT 'Sağlıklı',
      medications TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    )`).run();

  const columns = await db.prepare('PRAGMA table_info(sheep)').all<{ name: string }>();
  const existing = new Set((columns.results ?? []).map((column) => column.name));
  const additions = [
    ['business_tag_number', `TEXT NOT NULL DEFAULT ''`],
    ['birth_date', `TEXT NOT NULL DEFAULT ''`],
    ['mother_tag_number', `TEXT NOT NULL DEFAULT ''`],
    ['activity_status', `TEXT NOT NULL DEFAULT 'Aktif'`],
    ['passive_reason', `TEXT NOT NULL DEFAULT ''`],
  ] as const;
  for (const [name, definition] of additions) {
    if (!existing.has(name)) await db.prepare(`ALTER TABLE sheep ADD COLUMN ${name} ${definition}`).run();
  }

  await db.batch([
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_sheep_tag_number ON sheep(tag_number)'),
    db.prepare(`CREATE UNIQUE INDEX IF NOT EXISTS idx_sheep_business_tag_number ON sheep(business_tag_number) WHERE business_tag_number <> ''`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_sheep_mother_tag_number ON sheep(mother_tag_number)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS treatments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sheep_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      treatment_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sheep_id) REFERENCES sheep(id) ON DELETE CASCADE
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_treatments_sheep_date ON treatments(sheep_id, treatment_date DESC, id DESC)'),
  ]);

  const row = await db.prepare('SELECT COUNT(*) AS total FROM sheep').first<{ total: number }>();
  if ((row?.total ?? 0) === 0) {
    await db.prepare(`WITH RECURSIVE seq(n) AS (
      VALUES(1) UNION ALL SELECT n + 1 FROM seq WHERE n < 364
    )
    INSERT INTO sheep (tag_number, age, weight, breed, gender, status, medications, notes, updated_at, created_at)
    SELECT
      'T' || printf('%04d', 1000 + n),
      1 + (n % 6),
      48 + (n % 31),
      CASE n % 4 WHEN 0 THEN 'Akkaraman' WHEN 1 THEN 'Kıvırcık' WHEN 2 THEN 'Merinos' ELSE 'Karayaka' END,
      CASE n % 5 WHEN 0 THEN 'Koç' ELSE 'Dişi' END,
      CASE WHEN n % 28 = 0 THEN 'Kontrol' ELSE 'Sağlıklı' END,
      CASE WHEN n % 11 = 0 THEN 'Vitamin B12 · 12.08.2026' WHEN n % 17 = 0 THEN 'İç parazit ilacı · 04.08.2026' ELSE '' END,
      CASE WHEN n % 28 = 0 THEN 'Veteriner kontrolü planlanmalı.' ELSE '' END,
      datetime('now', '-' || n || ' minutes'),
      datetime('now', '-' || (365 - n) || ' days')
    FROM seq`).run();
    await db.prepare(`UPDATE sheep SET age = 3, weight = 67, breed = 'Akkaraman', medications = 'İç parazit ilacı · 18.08.2026', notes = 'Genel durumu iyi.', updated_at = datetime('now') WHERE tag_number = 'T1111'`).run();
  }

  await db.prepare(`UPDATE sheep SET birth_date = date('now', '-' || age || ' years') WHERE birth_date = ''`).run();
  await db.prepare(`INSERT INTO treatments (sheep_id, description, treatment_date, created_at)
    SELECT id, medications, date(updated_at), datetime('now') FROM sheep
    WHERE medications <> '' AND NOT EXISTS (SELECT 1 FROM treatments WHERE treatments.sheep_id = sheep.id)`).run();
  await db.prepare('PRAGMA optimize').run();
  return db;
}

