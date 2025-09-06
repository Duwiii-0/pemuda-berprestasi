// src/db/schema/match.ts
import { 
  int, 
  varchar, 
  mysqlTable, 
  datetime,
  json,
  index
} from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Bagan table
export const tbBagan = mysqlTable('tb_bagan', {
  idBagan: int('id_bagan').primaryKey().autoincrement(),
  idKompetisi: int('id_kompetisi').notNull(),
  idKelasKejuaraan: int('id_kelas_kejuaraan').notNull(),
}, (table) => ({
  idKompetisiIdx: index('tb_bagan_id_kompetisi_fkey').on(table.idKompetisi),
  idKelasKejuaraanIdx: index('tb_bagan_id_kelas_kejuaraan_fkey').on(table.idKelasKejuaraan),
}));

// Drawing Seed table
export const tbDrawingSeed = mysqlTable('tb_drawing_seed', {
  idSeed: int('id_seed').primaryKey().autoincrement(),
  idBagan: int('id_bagan').notNull(),
  idPesertaKompetisi: int('id_peserta_kompetisi').notNull(),
  seedNum: int('seed_num').notNull(),
}, (table) => ({
  idBaganIdx: index('tb_drawing_seed_id_bagan_fkey').on(table.idBagan),
  idPesertaKompetisiIdx: index('tb_drawing_seed_id_peserta_kompetisi_fkey').on(table.idPesertaKompetisi),
}));

// Match table
export const tbMatch = mysqlTable('tb_match', {
  idMatch: int('id_match').primaryKey().autoincrement(),
  idBagan: int('id_bagan').notNull(),
  ronde: int('ronde').notNull(),
  idPesertaA: int('id_peserta_a'),
  idPesertaB: int('id_peserta_b'),
  skorA: int('skor_a').notNull().default(0),
  skorB: int('skor_b').notNull().default(0),
  idVenue: int('id_venue'),
}, (table) => ({
  idBaganIdx: index('tb_match_id_bagan_fkey').on(table.idBagan),
  idPesertaAIdx: index('tb_match_id_peserta_a_fkey').on(table.idPesertaA),
  idPesertaBIdx: index('tb_match_id_peserta_b_fkey').on(table.idPesertaB),
  idVenueIdx: index('tb_match_id_venue_fkey').on(table.idVenue),
}));

// Match Audit table
export const tbMatchAudit = mysqlTable('tb_match_audit', {
  idAudit: int('id_audit').primaryKey().autoincrement(),
  idMatch: int('id_match').notNull(),
  idUser: int('id_user').notNull(),
  aksi: varchar('aksi', { length: 100 }).notNull(),
  payload: json('payload'),
  createdAt: datetime('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  idMatchIdx: index('tb_match_audit_id_match_fkey').on(table.idMatch),
}));

// Relations
export const tbBaganRelations = relations(tbBagan, ({ one, many }) => ({
  kompetisi: one(tbKompetisi, {
    fields: [tbBagan.idKompetisi],
    references: [tbKompetisi.idKompetisi],
  }),
  kelasKejuaraan: one(tbKelasKejuaraan, {
    fields: [tbBagan.idKelasKejuaraan],
    references: [tbKelasKejuaraan.idKelasKejuaraan],
  }),
  drawingSeed: many(tbDrawingSeed),
  match: many(tbMatch),
}));

export const tbDrawingSeedRelations = relations(tbDrawingSeed, ({ one }) => ({
  bagan: one(tbBagan, {
    fields: [tbDrawingSeed.idBagan],
    references: [tbBagan.idBagan],
  }),
  pesertaKompetisi: one(tbPesertaKompetisi, {
    fields: [tbDrawingSeed.idPesertaKompetisi],
    references: [tbPesertaKompetisi.idPesertaKompetisi],
  }),
}));

export const tbMatchRelations = relations(tbMatch, ({ one, many }) => ({
  bagan: one(tbBagan, {
    fields: [tbMatch.idBagan],
    references: [tbBagan.idBagan],
  }),
  pesertaA: one(tbPesertaKompetisi, {
    fields: [tbMatch.idPesertaA],
    references: [tbPesertaKompetisi.idPesertaKompetisi],
    relationName: "PesertaA"
  }),
  pesertaB: one(tbPesertaKompetisi, {
    fields: [tbMatch.idPesertaB],
    references: [tbPesertaKompetisi.idPesertaKompetisi],
    relationName: "PesertaB"
  }),
  venue: one(tbVenue, {
    fields: [tbMatch.idVenue],
    references: [tbVenue.idVenue],
  }),
  matchAudit: many(tbMatchAudit),
}));

export const tbMatchAuditRelations = relations(tbMatchAudit, ({ one }) => ({
  match: one(tbMatch, {
    fields: [tbMatchAudit.idMatch],
    references: [tbMatch.idMatch],
  }),
}));

// Forward declare types to avoid circular imports
// Relations will be defined in index.ts