// src/db/schema/index.ts
import { relations } from 'drizzle-orm';

// Import all enums first
export * from './enums';

// Import all table definitions (without relations)
export * from './auth';
export * from './users'; 
export * from './dojang';
export * from './atlet';
export * from './kompetisi';
export * from './match';
export * from './audit';

// Import specific tables for relations
import { tbAkun, tbAdmin, tbAdminKompetisi } from './auth';
import { tbPelatih, tbPenyelenggara } from './users';
import { tbDojang } from './dojang';
import { tbAtlet } from './atlet';
import { 
  tbKompetisi,
  tbKategoriEvent,
  tbKelompokUsia,
  tbKelasBerat,
  tbKelasPoomsae,
  tbKelasKejuaraan,
  tbPesertaKompetisi,
  tbPesertaTim,
  tbVenue
} from './kompetisi';
import { tbBagan, tbDrawingSeed, tbMatch, tbMatchAudit } from './match';
import { tbAuditLog } from './audit';

// Define all relations here to avoid circular imports
export const tbAkunRelations = relations(tbAkun, ({ one }) => ({
  pelatih: one(tbPelatih, {
    fields: [tbAkun.idAkun],
    references: [tbPelatih.idAkun],
  }),
  admin: one(tbAdmin, {
    fields: [tbAkun.idAkun],
    references: [tbAdmin.idAkun],
  }),
  adminKompetisi: one(tbAdminKompetisi, {
    fields: [tbAkun.idAkun],
    references: [tbAdminKompetisi.idAkun],
  }),
}));

export const tbAdminRelations = relations(tbAdmin, ({ one }) => ({
  akun: one(tbAkun, {
    fields: [tbAdmin.idAkun],
    references: [tbAkun.idAkun],
  }),
}));

export const tbAdminKompetisiRelations = relations(tbAdminKompetisi, ({ one }) => ({
  akun: one(tbAkun, {
    fields: [tbAdminKompetisi.idAkun],
    references: [tbAkun.idAkun],
  }),
  kompetisi: one(tbKompetisi, {
    fields: [tbAdminKompetisi.idKompetisi],
    references: [tbKompetisi.idKompetisi],
  }),
}));

export const tbPelatihRelations = relations(tbPelatih, ({ one, many }) => ({
  akun: one(tbAkun, {
    fields: [tbPelatih.idAkun],
    references: [tbAkun.idAkun],
  }),
  dojang: one(tbDojang, {
    fields: [tbPelatih.idDojang],
    references: [tbDojang.idDojang],
  }),
  atletPembuat: many(tbAtlet),
}));

export const tbPenyelenggaraRelations = relations(tbPenyelenggara, ({ many }) => ({
  kompetisi: many(tbKompetisi),
}));

export const tbDojangRelations = relations(tbDojang, ({ many }) => ({
  atlet: many(tbAtlet),
  pelatih: many(tbPelatih),
}));

export const tbAtletRelations = relations(tbAtlet, ({ one, many }) => ({
  dojang: one(tbDojang, {
    fields: [tbAtlet.idDojang],
    references: [tbDojang.idDojang],
  }),
  pelatihPembuat: one(tbPelatih, {
    fields: [tbAtlet.idPelatihPembuat],
    references: [tbPelatih.idPelatih],
  }),
  pesertaKompetisi: many(tbPesertaKompetisi),
  pesertaTim: many(tbPesertaTim),
}));

export const tbKompetisiRelations = relations(tbKompetisi, ({ one, many }) => ({
  admin: many(tbAdminKompetisi),
  penyelenggara: one(tbPenyelenggara, {
    fields: [tbKompetisi.idPenyelenggara],
    references: [tbPenyelenggara.idPenyelenggara],
  }),
  bagan: many(tbBagan),
  kelasKejuaraan: many(tbKelasKejuaraan),
  venue: many(tbVenue),
}));

export const tbKategoriEventRelations = relations(tbKategoriEvent, ({ many }) => ({
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const tbKelompokUsiaRelations = relations(tbKelompokUsia, ({ many }) => ({
  kelasBerat: many(tbKelasBerat),
  kelasPoomsae: many(tbKelasPoomsae),
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const tbKelasBeratRelations = relations(tbKelasBerat, ({ one, many }) => ({
  kelompok: one(tbKelompokUsia, {
    fields: [tbKelasBerat.idKelompok],
    references: [tbKelompokUsia.idKelompok],
  }),
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const tbKelasPoomsaeRelations = relations(tbKelasPoomsae, ({ one, many }) => ({
  kelompok: one(tbKelompokUsia, {
    fields: [tbKelasPoomsae.idKelompok],
    references: [tbKelompokUsia.idKelompok],
  }),
  kelasKejuaraan: many(tbKelasKejuaraan),
}));

export const tbKelasKejuaraanRelations = relations(tbKelasKejuaraan, ({ one, many }) => ({
  kompetisi: one(tbKompetisi, {
    fields: [tbKelasKejuaraan.idKompetisi],
    references: [tbKompetisi.idKompetisi],
  }),
  kategoriEvent: one(tbKategoriEvent, {
    fields: [tbKelasKejuaraan.idKategoriEvent],
    references: [tbKategoriEvent.idKategoriEvent],
  }),
  kelompok: one(tbKelompokUsia, {
    fields: [tbKelasKejuaraan.idKelompok],
    references: [tbKelompokUsia.idKelompok],
  }),
  kelasBerat: one(tbKelasBerat, {
    fields: [tbKelasKejuaraan.idKelasBerat],
    references: [tbKelasBerat.idKelasBerat],
  }),
  poomsae: one(tbKelasPoomsae, {
    fields: [tbKelasKejuaraan.idPoomsae],
    references: [tbKelasPoomsae.idPoomsae],
  }),
  bagan: many(tbBagan),
  pesertaKompetisi: many(tbPesertaKompetisi),
}));

export const tbPesertaKompetisiRelations = relations(tbPesertaKompetisi, ({ one, many }) => ({
  atlet: one(tbAtlet, {
    fields: [tbPesertaKompetisi.idAtlet],
    references: [tbAtlet.idAtlet],
  }),
  kelasKejuaraan: one(tbKelasKejuaraan, {
    fields: [tbPesertaKompetisi.idKelasKejuaraan],
    references: [tbKelasKejuaraan.idKelasKejuaraan],
  }),
  anggotaTim: many(tbPesertaTim),
  drawingSeed: many(tbDrawingSeed),
  matchA: many(tbMatch, { relationName: "PesertaA" }),
  matchB: many(tbMatch, { relationName: "PesertaB" }),
}));

export const tbPesertaTimRelations = relations(tbPesertaTim, ({ one }) => ({
  pesertaKompetisi: one(tbPesertaKompetisi, {
    fields: [tbPesertaTim.idPesertaKompetisi],
    references: [tbPesertaKompetisi.idPesertaKompetisi],
  }),
  atlet: one(tbAtlet, {
    fields: [tbPesertaTim.idAtlet],
    references: [tbAtlet.idAtlet],
  }),
}));

export const tbVenueRelations = relations(tbVenue, ({ one, many }) => ({
  kompetisi: one(tbKompetisi, {
    fields: [tbVenue.idKompetisi],
    references: [tbKompetisi.idKompetisi],
  }),
  match: many(tbMatch),
}));

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

// Export schema object for Drizzle
export const schema = {
  // Auth
  tbAkun,
  tbAdmin,
  tbAdminKompetisi,
  
  // Users
  tbPelatih,
  tbPenyelenggara,
  
  // Dojang
  tbDojang,
  
  // Atlet
  tbAtlet,
  
  // Kompetisi
  tbKompetisi,
  tbKategoriEvent,
  tbKelompokUsia,
  tbKelasBerat,
  tbKelasPoomsae,
  tbKelasKejuaraan,
  tbPesertaKompetisi,
  tbPesertaTim,
  tbVenue,
  
  // Match
  tbBagan,
  tbDrawingSeed,
  tbMatch,
  tbMatchAudit,
  
  // Audit
  tbAuditLog,
};

// Export types
export type Schema = typeof schema;