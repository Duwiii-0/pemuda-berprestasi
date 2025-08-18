export interface DummyDojang {
  id?: number;
  name: string;       // nama dojang
  email: string;      // email dojang
  phone: string;      // nomor telpon
  negara: string;
  provinsi: string;
  kota: string;       // kabupaten/kota
  kecamatan: string;
  kelurahan: string;
  alamat: string;
}


export const dummyDojangs: DummyDojang[] = [
  {
    id: 1,
    name: "Dojang Garuda Muda",
    email: "garudamuda@dojang.id",
    phone: "081234567890",
    negara: "Indonesia",
    provinsi: "Jawa Barat",
    kota: "Bandung",
    kecamatan: "Coblong",
    kelurahan: "Dago",
    alamat: "Jl. Ir. H. Djuanda No. 45"
  },
  {
    id: 2,
    name: "Dojang Cendrawasih",
    email: "cendrawasih@dojang.id",
    phone: "081298765432",
    negara: "Indonesia",
    provinsi: "DKI Jakarta",
    kota: "Jakarta Selatan",
    kecamatan: "Kebayoran Baru",
    kelurahan: "Senayan",
    alamat: "Jl. Asia Afrika No. 88"
  },
  {
    id: 3,
    name: "Dojang Harimau Putih",
    email: "harimaupunih@dojang.id",
    phone: "081312345678",
    negara: "Indonesia",
    provinsi: "Jawa Timur",
    kota: "Surabaya",
    kecamatan: "Wonokromo",
    kelurahan: "Darmo",
    alamat: "Jl. Raya Darmo No. 120"
  }
];
