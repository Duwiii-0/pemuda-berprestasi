
import type { DummyDojang } from "./dummyDojang";

export interface DummyAccount {
  id?: number;
  name: string;
  photo?: string;
  email: string;
  password: string;
  phone: string;
  nik: string;
  tglLahir: string;
  alamat: string;
  kota: string;
  provinsi: string;
  bb: number;
  gender: "Laki-Laki" | "Perempuan";
  umur: number;
  dojangId: DummyDojang["id"]; // ⬅️ lebih ketat: harus sesuai tipe id di DummyDojang
}

export const dummyAccounts: DummyAccount[] = [
  {
    id: 1,
    name: "Muhammad Rafif Dwiarka",
    email: "rafif@gmail.com",
    password: "123",
    phone: "0812345678",
    nik: "3172061807060002",
    tglLahir: "07/18/2006",
    kota: "Depok",
    alamat: "Puri Depok Mas blok L no.15",
    provinsi: "Jawa Barat",
    bb: 52,
    gender: "Laki-Laki",
    umur: 19,
    dojangId: 1 // ⬅️ terhubung ke Dojang Garuda Muda
  },
  {
    id: 2,
    name: "Falih Elmanda",
    email: "falih@gmail.com",
    password: "123",
    phone: "0812345678",
    nik: "3172061807060002",
    tglLahir: "2006-07-17",
    kota: "Depok",
    alamat: "Puri Depok Mas blok L no.15",
    provinsi: "Jawa Barat",
    bb: 52,
    gender: "Laki-Laki",
    umur: 19,
    dojangId: 2
  },
  {
    id: 3,
    name: "Calysta",
    email: "calis@gmail.com",
    password: "123",
    phone: "0812345678",
    nik: "3172061807060002",
    tglLahir: "2006-07-17",
    kota: "Depok",
    alamat: "Puri Depok Mas blok L no.15",
    provinsi: "Jawa Barat",
    bb: 52,
    gender: "Perempuan",
    umur: 19,
    dojangId: 3
  }
];
