import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const sheep = sqliteTable('sheep', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tagNumber: text('tag_number').notNull(),
  businessTagNumber: text('business_tag_number').notNull().default(''),
  birthDate: text('birth_date').notNull().default(''),
  motherTagNumber: text('mother_tag_number').notNull().default(''),
  age: integer('age').notNull(),
  weight: integer('weight').notNull(),
  breed: text('breed').notNull(),
  gender: text('gender').notNull().default('Dişi'),
  status: text('status').notNull().default('Sağlıklı'),
  activityStatus: text('activity_status').notNull().default('Aktif'),
  passiveReason: text('passive_reason').notNull().default(''),
  medications: text('medications').notNull().default(''),
  notes: text('notes').notNull().default(''),
  updatedAt: text('updated_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (table) => [uniqueIndex('idx_sheep_tag_number').on(table.tagNumber)]);

export const treatments = sqliteTable('treatments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sheepId: integer('sheep_id').notNull(),
  description: text('description').notNull(),
  treatmentDate: text('treatment_date').notNull(),
  createdAt: text('created_at').notNull(),
});

