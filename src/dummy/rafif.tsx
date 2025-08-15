// src/data/dummyAccounts.ts

export interface DummyAccount {
  name: string;
  email: string;
  password: string;
  photo?: string;
  phone: string;
  nik: string;
  tglLahir: string
  alamat: string;
  kota: string;
  provinsi: string;
  bb: number;
  gender: 'Laki-Laki' | 'Perempuan';
  umur: number;
}

export const dummyAccounts: DummyAccount[] = [
  {
    name: "Budi",
    email: "rafif@gmail.com",
    password: '123',
    phone: "0812345678",
    nik: '3172061807060002',
    tglLahir: '17 Juli 2006',
    kota: 'Depok',
    alamat: 'Puri Depok Mas blok L no.15',
    provinsi: 'Jawa Barat',
    bb: 52,         
    gender: 'Laki-Laki',
    umur: 53   
  }
];
