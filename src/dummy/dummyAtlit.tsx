export interface DummyAtlit {
  id?: number;
  name: string;
  photo?: string;
  phone: string;
  nik: string;
  tglLahir: string;
  alamat: string;
  kota: string;
  provinsi: string;
  bb: number;
  tb: number;
  gender: 'Laki-Laki' | 'Perempuan' | '';
  umur: number;
  belt: string;
}

export const dummyAtlits: DummyAtlit[] = [
  {
    id: 1,
    name: "Rizky Purnama",
    phone: "081234567890",
    nik: "3172061507050001",
    tglLahir: "07/15/2005", // mm/dd/yyyy
    alamat: "Jl. Kenanga No. 5",
    kota: "Depok",
    provinsi: "Jawa Barat",
    bb: 60,
    tb: 170,
    gender: "Laki-Laki",
    umur: 20,
    belt: 'putih'
  },
  {
    id: 2,
    name: "Aulia",
    phone: "081298765432",
    nik: "3172072008060002",
    tglLahir: "08/20/2006", // mm/dd/yyyy
    alamat: "Jl. Mawar No. 12",
    kota: "Jakarta",
    provinsi: "DKI Jakarta",
    bb: 55,
    tb: 170,
    gender: "Perempuan",
    umur: 19,
    belt: 'hitam'
  },
  {
    id: 3,
    name: "Andi",
    phone: "081298765432",
    nik: "3172091108050003",
    tglLahir: "08/11/2005", // mm/dd/yyyy
    alamat: "Jl. Melati No. 22",
    kota: "Jakarta",
    provinsi: "DKI Jakarta",
    bb: 65,
    tb: 170,
    gender: "Laki-Laki",
    umur: 20,
    belt: 'putih'
  },
  {
    id: 4,
    name: "Siti",
    phone: "081312345678",
    nik: "3172061406040004",
    tglLahir: "06/14/2004", // mm/dd/yyyy
    alamat: "Jl. Anggrek No. 10",
    kota: "Bandung",
    provinsi: "Jawa Barat",
    bb: 50,
    tb: 170,
    gender: "Perempuan",
    umur: 21,
    belt: 'hitam'
  }
];
