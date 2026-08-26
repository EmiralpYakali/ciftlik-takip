import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const sheep = sqliteTable('sheep', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tagNumber: text('tag_number').notNull(),
  age: integer('age').notNull(),
  weight: integer('weight').notNull(),
  breed: text('breed').notNull(),
  gender: text('gender').notNull().default('Dişi'),
  status: text('status').notNull().default('Sağlıklı'),
  medications: text('medications').notNull().default(''),
  notes: text('notes').notNull().default(''),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [uniqueIndex('idx_sheep_tag_number').on(table.tagNumber)]);

