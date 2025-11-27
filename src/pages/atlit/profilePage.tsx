// src/pages/Profile.tsx
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Phone,
  User,
  CalendarFold,
  IdCard,
  MapPinned,
  Scale,
  Ruler,
  ArrowLeft,
} from "lucide-react";
import TextInput from "../../components/textInput";
import Select from "react-select";
import { GeneralButton } from "../dashboard/dataDojang";
import { useAtletContext } from "../../context/AtlitContext";
import type { Atlet } from "../../context/AtlitContext";
import { beltOptions } from "../../context/AtlitContext";
import { genderOptions } from "../../context/AtlitContext";
import { calculateAge } from "../../context/AtlitContext";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";
import { AtletDocumentUploader } from "../../components/atletUploads";
import { IDCardGenerator } from "../../components/IDCardGenerator";
import { CertificateGenerator } from "../../components/CertificateGenerator";

// Extend Atlet type untuk include file fields
interface AtletWithFiles
  extends Omit<
    Atlet,
    "akte_kelahiran" | "pas_foto" | "sertifikat_belt" | "ktp"
  > {
  akte_kelahiran?: File | null;
  pas_foto?: File | null;
  sertifikat_belt?: File | null;
  ktp?: File | null;

  akte_kelahiran_path?: string;
  pas_foto_path?: string;
  sertifikat_belt_path?: string;
  ktp_path?: string;

  kota?: string;
  dojang_name?: string;
  kelas_berat?: string;
  peserta_kompetisi?: {
    kelas_kejuaraan: {
      kompetisi: {
        id_kompetisi: number;
      };
    };
  }[];
}

const provinsiKotaData: Record<string, string[]> = {
  Aceh: [
    "Simeulue",
    "Aceh Singkil",
    "Aceh Selatan",
    "Aceh Tenggara",
    "Aceh Timur",
    "Aceh Tengah",
    "Aceh Barat",
    "Aceh Besar",
    "Pidie",
    "Bireuen",
    "Aceh Utara",
    "Aceh Barat Daya",
    "Gayo Lues",
    "Aceh Tamiang",
    "Nagan Raya",
    "Aceh Jaya",
    "Bener Meriah",
    "Pidie Jaya",
    "Banda Aceh",
    "Sabang",
    "Langsa",
    "Lhokseumawe",
    "Subulussalam",
  ],
  "Sumatera Utara": [
    "Asahan",
    "Batubara",
    "Dairi",
    "Deli Serdang",
    "Humbang Hasundutan",
    "Karo",
    "Labuhanbatu",
    "Labuhanbatu Selatan",
    "Labuhanbatu Utara",
    "Langkat",
    "Mandailing Natal",
    "Nias",
    "Nias Barat",
    "Nias Selatan",
    "Nias Utara",
    "Padang Lawas",
    "Padang Lawas Utara",
    "Pakpak Bharat",
    "Samosir",
    "Serdang Bedagai",
    "Simalungun",
    "Tapanuli Selatan",
    "Tapanuli Tengah",
    "Tapanuli Utara",
    "Toba",
    "Binjai",
    "Gunungsitoli",
    "Medan",
    "Padang Sidempuan",
    "Pematangsiantar",
    "Sibolga",
    "Tanjungbalai",
    "Tebing Tinggi",
  ],
  "Sumatera Barat": [
    "Agam",
    "Dharmasraya",
    "Kepulauan Mentawai",
    "Lima Puluh Kota",
    "Padang Pariaman",
    "Pasaman",
    "Pasaman Barat",
    "Pesisir Selatan",
    "Sijunjung",
    "Solok",
    "Solok Selatan",
    "Tanah Datar",
    "Bukittinggi",
    "Padang",
    "Padang Panjang",
    "Pariaman",
    "Payakumbuh",
    "Sawahlunto",
    "Solok (Kota)",
  ],
  Riau: [
    "Bengkalis",
    "Indragiri Hilir",
    "Indragiri Hulu",
    "Kampar",
    "Kepulauan Meranti",
    "Kuantan Singingi",
    "Pelalawan",
    "Rokan Hilir",
    "Rokan Hulu",
    "Siak",
    "Pekanbaru",
    "Dumai",
  ],
  "Kepulauan Riau": [
    "Bintan",
    "Karimun",
    "Kepulauan Anambas",
    "Lingga",
    "Natuna",
    "Batam",
    "Tanjung Pinang",
  ],
  Jambi: [
    "Batanghari",
    "Bungo",
    "Kerinci",
    "Merangin",
    "Muaro Jambi",
    "Sarolangun",
    "Tanjung Jabung Barat",
    "Tanjung Jabung Timur",
    "Tebo",
    "Jambi",
    "Sungai Penuh",
  ],
  "Sumatera Selatan": [
    "Banyuasin",
    "Empat Lawang",
    "Lahat",
    "Muara Enim",
    "Musi Banyuasin",
    "Musi Rawas",
    "Musi Rawas Utara",
    "Ogan Ilir",
    "Ogan Komering Ilir",
    "Ogan Komering Ulu",
    "Ogan Komering Ulu Selatan",
    "Ogan Komering Ulu Timur",
    "Penukal Abab Lematang Ilir",
    "Palembang",
    "Prabumulih",
    "Pagar Alam",
    "Lubuklinggau",
    "Martapura",
  ],
  "Bangka Belitung": [
    "Bangka",
    "Bangka Barat",
    "Bangka Selatan",
    "Bangka Tengah",
    "Belitung",
    "Belitung Timur",
    "Pangkal Pinang",
  ],
  Bengkulu: [
    "Bengkulu Selatan",
    "Bengkulu Tengah",
    "Bengkulu Utara",
    "Kaur",
    "Kepahiang",
    "Lebong",
    "Mukomuko",
    "Rejang Lebong",
    "Seluma",
    "Bengkulu",
  ],
  Lampung: [
    "Lampung Barat",
    "Tanggamus",
    "Lampung Selatan",
    "Lampung Timur",
    "Lampung Tengah",
    "Lampung Utara",
    "Way Kanan",
    "Pesawaran",
    "Pringsewu",
    "Mesuji",
    "Tulang Bawang",
    "Tulang Bawang Barat",
    "Pesisir Barat",
    "Bandar Lampung",
    "Metro",
  ],
  "DKI Jakarta": [
    "Jakarta Pusat",
    "Jakarta Utara",
    "Jakarta Barat",
    "Jakarta Selatan",
    "Jakarta Timur",
    "Kepulauan Seribu",
  ],
  "Jawa Barat": [
    "Bandung",
    "Bandung Barat",
    "Bekasi",
    "Bogor",
    "Ciamis",
    "Cianjur",
    "Cirebon",
    "Garut",
    "Indramayu",
    "Karawang",
    "Kuningan",
    "Majalengka",
    "Pangandaran",
    "Purwakarta",
    "Subang",
    "Sukabumi",
    "Sumedang",
    "Tasikmalaya",
    "Banjar",
    "Cimahi",
    "Depok",
  ],
  Banten: [
    "Lebak",
    "Pandeglang",
    "Serang",
    "Tangerang",
    "Tangerang Selatan",
    "Cilegon",
  ],
  "Jawa Tengah": [
    "Banjarnegara",
    "Banyumas",
    "Batang",
    "Blora",
    "Boyolali",
    "Brebes",
    "Cilacap",
    "Demak",
    "Grobogan",
    "Jepara",
    "Karanganyar",
    "Kebumen",
    "Kendal",
    "Klaten",
    "Kudus",
    "Magelang",
    "Pati",
    "Pekalongan",
    "Pemalang",
    "Purbalingga",
    "Purworejo",
    "Rembang",
    "Semarang",
    "Sragen",
    "Sukoharjo",
    "Tegal",
    "Temanggung",
    "Wonogiri",
    "Wonosobo",
    "Magelang (Kota)",
    "Pekalongan (Kota)",
    "Salatiga",
    "Semarang (Kota)",
    "Surakarta",
    "Tegal (Kota)",
  ],
  Yogyakarta: ["Bantul", "Gunungkidul", "Kulon Progo", "Sleman", "Yogyakarta"],
  "Jawa Timur": [
    "Bangkalan",
    "Banyuwangi",
    "Blitar",
    "Bojonegoro",
    "Bondowoso",
    "Gresik",
    "Jember",
    "Jombang",
    "Kediri",
    "Lamongan",
    "Lumajang",
    "Madiun",
    "Magetan",
    "Malang",
    "Mojokerto",
    "Nganjuk",
    "Ngawi",
    "Pacitan",
    "Pamekasan",
    "Pasuruan",
    "Ponorogo",
    "Probolinggo",
    "Sampang",
    "Sidoarjo",
    "Situbondo",
    "Sumenep",
    "Trenggalek",
    "Tuban",
    "Tulungagung",
    "Batu",
    "Kediri (Kota)",
    "Madiun (Kota)",
    "Malang (Kota)",
    "Mojokerto (Kota)",
    "Pasuruan (Kota)",
    "Probolinggo (Kota)",
    "Surabaya",
  ],
  Bali: [
    "Badung",
    "Bangli",
    "Buleleng",
    "Gianyar",
    "Jembrana",
    "Karangasem",
    "Klungkung",
    "Tabanan",
    "Denpasar",
  ],
  "Nusa Tenggara Barat": [
    "Bima",
    "Dompu",
    "Lombok Barat",
    "Lombok Tengah",
    "Lombok Timur",
    "Lombok Utara",
    "Sumbawa",
    "Sumbawa Barat",
    "Mataram",
    "Bima (Kota)",
  ],
  "Nusa Tenggara Timur": [
    "Alor",
    "Belu",
    "Ende",
    "Flores Timur",
    "Kupang",
    "Lembata",
    "Malaka",
    "Manggarai",
    "Manggarai Barat",
    "Manggarai Timur",
    "Ngada",
    "Nagekeo",
    "Rote Ndao",
    "Sabu Raijua",
    "Sikka",
    "Sumba Barat",
    "Sumba Barat Daya",
    "Sumba Tengah",
    "Sumba Timur",
    "Timor Tengah Selatan",
    "Timor Tengah Utara",
    "Kupang (Kota)",
  ],
  "Kalimantan Barat": [
    "Bengkayang",
    "Kapuas Hulu",
    "Kayong Utara",
    "Ketapang",
    "Kubu Raya",
    "Landak",
    "Melawi",
    "Mempawah",
    "Sambas",
    "Sanggau",
    "Sekadau",
    "Sintang",
    "Pontianak",
    "Singkawang",
  ],
  "Kalimantan Tengah": [
    "Barito Selatan",
    "Barito Timur",
    "Barito Utara",
    "Gunung Mas",
    "Kapuas",
    "Katingan",
    "Kotawaringin Barat",
    "Kotawaringin Timur",
    "Lamandau",
    "Murung Raya",
    "Pulang Pisau",
    "Seruyan",
    "Sukamara",
    "Palangka Raya",
  ],
  "Kalimantan Selatan": [
    "Balangan",
    "Banjar",
    "Barito Kuala",
    "Hulu Sungai Selatan",
    "Hulu Sungai Tengah",
    "Hulu Sungai Utara",
    "Kotabaru",
    "Tabalong",
    "Tanah Bumbu",
    "Tanah Laut",
    "Tapin",
    "Banjarbaru",
    "Banjarmasin",
    "Martapura",
  ],
  "Kalimantan Timur": [
    "Berau",
    "Kutai Barat",
    "Kutai Kartanegara",
    "Kutai Timur",
    "Mahakam Ulu",
    "Paser",
    "Penajam Paser Utara",
    "Samarinda",
    "Balikpapan",
    "Bontang",
  ],
  "Kalimantan Utara": [
    "Bulungan",
    "Malinau",
    "Nunukan",
    "Tana Tidung",
    "Tarakan",
  ],
  "Sulawesi Utara": [
    "Bolaang Mongondow",
    "Bolaang Mongondow Selatan",
    "Bolaang Mongondow Timur",
    "Bolaang Mongondow Utara",
    "Kepulauan Sangihe",
    "Kepulauan Siau Tagulandang Biaro",
    "Kepulauan Talaud",
    "Minahasa",
    "Minahasa Selatan",
    "Minahasa Tenggara",
    "Minahasa Utara",
    "Bitung",
    "Kotamobagu",
    "Manado",
    "Tomohon",
  ],
  "Sulawesi Tengah": [
    "Banggai",
    "Banggai Kepulauan",
    "Banggai Laut",
    "Buol",
    "Donggala",
    "Morowali",
    "Morowali Utara",
    "Parigi Moutong",
    "Poso",
    "Sigi",
    "Tojo Una-Una",
    "Toli-Toli",
    "Palu",
  ],
  "Sulawesi Selatan": [
    "Bantaeng",
    "Barru",
    "Bone",
    "Bulukumba",
    "Enrekang",
    "Gowa",
    "Jeneponto",
    "Kepulauan Selayar",
    "Luwu",
    "Luwu Timur",
    "Luwu Utara",
    "Maros",
    "Pangkajene Kepulauan",
    "Pinrang",
    "Sidenreng Rappang",
    "Sinjai",
    "Soppeng",
    "Takalar",
    "Tana Toraja",
    "Toraja Utara",
    "Wajo",
    "Makassar",
    "Palopo",
    "Parepare",
  ],
  "Sulawesi Tenggara": [
    "Bombana",
    "Buton",
    "Buton Selatan",
    "Buton Tengah",
    "Buton Utara",
    "Kolaka",
    "Kolaka Timur",
    "Kolaka Utara",
    "Konawe",
    "Konawe Kepulauan",
    "Konawe Selatan",
    "Konawe Utara",
    "Muna",
    "Muna Barat",
    "Wakatobi",
    "Kendari",
    "Bau-Bau",
  ],
  Gorontalo: [
    "Boalemo",
    "Bone Bolango",
    "Gorontalo",
    "Gorontalo Utara",
    "Pohuwato",
    "Gorontalo (Kota)",
  ],
  "Sulawesi Barat": [
    "Majene",
    "Mamasa",
    "Mamuju",
    "Mamuju Tengah",
    "Pasangkayu",
    "Polewali Mandar",
  ],
  Maluku: [
    "Buru",
    "Buru Selatan",
    "Kepulauan Aru",
    "Maluku Barat Daya",
    "Maluku Tengah",
    "Maluku Tenggara",
    "Maluku Tenggara Barat",
    "Seram Bagian Barat",
    "Seram Bagian Timur",
    "Tual",
    "Ambon",
  ],
  "Maluku Utara": [
    "Halmahera Barat",
    "Halmahera Tengah",
    "Halmahera Timur",
    "Halmahera Selatan",
    "Halmahera Utara",
    "Kepulauan Sula",
    "Pulau Morotai",
    "Pulau Taliabu",
    "Tidore Kepulauan",
    "Ternate",
  ],
  Papua: [
    "Biak Numfor",
    "Jayapura",
    "Jayawijaya",
    "Keerom",
    "Kepulauan Yapen",
    "Mamberamo Raya",
    "Mamberamo Tengah",
    "Sarmi",
    "Supiori",
    "Waropen",
    "Yalimo",
    "Jayapura (Kota)",
  ],
  "Papua Tengah": [
    "Deiyai",
    "Dogiyai",
    "Intan Jaya",
    "Mimika",
    "Nabire",
    "Paniai",
  ],
  "Papua Pegunungan": [
    "Jayawijaya",
    "Lanny Jaya",
    "Mamberamo Tengah",
    "Mappi",
    "Nduga",
    "Pegunungan Bintang",
    "Tolikara",
    "Yahukimo",
    "Yalimo",
  ],
  "Papua Selatan": ["Asmat", "Boven Digoel", "Mappi", "Merauke"],
  "Papua Barat": [
    "Fakfak",
    "Kaimana",
    "Manokwari",
    "Manokwari Selatan",
    "Pegunungan Arfak",
    "Teluk Bintuni",
    "Teluk Wondama",
  ],
  "Papua Barat Daya": [
    "Maybrat",
    "Raja Ampat",
    "Sorong",
    "Sorong Selatan",
    "Tambrauw",
  ],
  Others: ["Others"],
};

const provinsiOptions = Object.keys(provinsiKotaData).map((provinsi) => ({
  value: provinsi,
  label: provinsi,
}));

const getPhotoUrl = (filename: string): string | null => {
  if (!filename) return null;
  return `${
    process.env.REACT_APP_API_BASE_URL || "http://cjvmanagementevent.com"
  }/uploads/atlet/pas_foto/${filename}`;
};

function toInputDateFormat(dateStr: string): string {
  if (!dateStr) return "";
  return dateStr.slice(0, 10);
}

const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [originalData, setOriginalData] = useState<AtletWithFiles | null>(null);
  const [formData, setFormData] = useState<AtletWithFiles | null>();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [isNameDisabled, setIsNameDisabled] = useState(false);

  const { fetchAtletById, updateAtlet } = useAtletContext();

  useEffect(() => {
    setIsNameDisabled(false);
    if (id) {
      const atletId = Number(id);
      fetchAtletById(atletId).then((data) => {
        if (data) {
          console.log("📋 RAW ATLET DATA:", data);

          const dataWithFiles: AtletWithFiles = {
            ...data,
            akte_kelahiran_path: data.akte_kelahiran || undefined,
            pas_foto_path: data.pas_foto || undefined,
            sertifikat_belt_path: data.sertifikat_belt || undefined,
            ktp_path: data.ktp || undefined,
            akte_kelahiran: null,
            pas_foto: null,
            sertifikat_belt: null,
            ktp: null,
          };
          setFormData(dataWithFiles);
          setOriginalData(dataWithFiles);

          if (data.peserta_kompetisi && Array.isArray(data.peserta_kompetisi)) {
            const isRegisteredInComp1 = data.peserta_kompetisi.some(
              (p: any) => p.kelas_kejuaraan?.kompetisi?.id_kompetisi === 1
            );
            setIsNameDisabled(isRegisteredInComp1);
          }
        }
      });
    }
  }, [id, fetchAtletById]);

  const handleCancel = () => {
    if (originalData) {
      setFormData({
        ...originalData,
        akte_kelahiran: null,
        pas_foto: null,
        sertifikat_belt: null,
        ktp: null,
      });
    }
    setIsEditing(false);
  };

  const handleUpdate = async () => {
    if (!formData || isSubmitting) return;

    console.log(
      `🔍 Current formData.nama_atlet before FormData:`,
      formData.nama_atlet
    );

    setIsSubmitting(true);

    try {
      const formDataSend = new FormData();

      formDataSend.append("nama_atlet", formData.nama_atlet);
      formDataSend.append("jenis_kelamin", formData.jenis_kelamin);
      formDataSend.append("tanggal_lahir", formData.tanggal_lahir);

      if (formData.nik?.trim()) formDataSend.append("nik", formData.nik.trim());
      if (formData.no_telp?.trim())
        formDataSend.append("no_telp", formData.no_telp.trim());
      if (formData.alamat?.trim())
        formDataSend.append("alamat", formData.alamat.trim());
      if (formData.provinsi?.trim())
        formDataSend.append("provinsi", formData.provinsi.trim());
      if (formData.kota?.trim())
        formDataSend.append("kota", formData.kota.trim());
      if (formData.belt?.trim())
        formDataSend.append("belt", formData.belt.trim());

      if (formData.tinggi_badan) {
        const height = parseFloat(String(formData.tinggi_badan));
        if (!isNaN(height) && height > 0) {
          formDataSend.append("tinggi_badan", String(height));
        }
      }

      if (formData.berat_badan) {
        const weight = parseFloat(String(formData.berat_badan));
        if (!isNaN(weight) && weight > 0) {
          formDataSend.append("berat_badan", String(weight));
        }
      }

      if (formData.akte_kelahiran)
        formDataSend.append("akte_kelahiran", formData.akte_kelahiran);
      if (formData.pas_foto) formDataSend.append("pas_foto", formData.pas_foto);
      if (formData.sertifikat_belt)
        formDataSend.append("sertifikat_belt", formData.sertifikat_belt);
      if (formData.ktp) formDataSend.append("ktp", formData.ktp);

      console.log("📋 All FormData contents:");
      for (let [key, value] of formDataSend.entries()) {
        console.log(`  ${key}: ${value}`);
      }

      const result = await updateAtlet(Number(id), formDataSend);

      console.log("📋 Update result:", result);
      console.log("📋 Update result type:", typeof result);
      console.log("📋 Update result keys:", Object.keys(result || {}));

      if (result) {
        const updatedAtlet = result;

        const updatedData: AtletWithFiles = {
          ...updatedAtlet,
          akte_kelahiran_path: updatedAtlet.akte_kelahiran || undefined,
          pas_foto_path: updatedAtlet.pas_foto || undefined,
          sertifikat_belt_path: updatedAtlet.sertifikat_belt || undefined,
          ktp_path: updatedAtlet.ktp || undefined,
          akte_kelahiran: null,
          pas_foto: null,
          sertifikat_belt: null,
          ktp: null,
        };

        setFormData(updatedData);
        setOriginalData(updatedData);
        setIsEditing(false);
        toast.success("Data atlet berhasil diperbarui ✅");
      }
    } catch (err: any) {
      console.error("❌ Gagal update atlet:", err);

      if (err.message.includes("File size")) {
        toast.error("File terlalu besar. Maksimal 5MB per file.");
      } else if (err.message.includes("Invalid file")) {
        toast.error("Format file tidak didukung. Gunakan JPG, PNG, atau PDF.");
      } else if (err.message.includes("wajib diisi")) {
        toast.error("Ada field wajib yang belum diisi: " + err.message);
      } else {
        toast.error(err.message || "Gagal memperbarui data atlet");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof AtletWithFiles, value: any) => {
    if (!formData) return;
    let updatedData = { ...formData, [field]: value };

    if (field === "tanggal_lahir" && typeof value === "string") {
      updatedData.tanggal_lahir = value;
      updatedData.umur = calculateAge(updatedData.tanggal_lahir);
    }

    setFormData(updatedData);
  };

  const handleProvinsiChange = (
    selectedOption: { value: string; label: string } | null
  ) => {
    const newProvinsi = selectedOption?.value || "";
    handleInputChange("provinsi", newProvinsi);
    if (formData && newProvinsi !== formData.provinsi) {
      handleInputChange("kota", "");
    }
  };

  const handleFileChange = (field: keyof AtletWithFiles, file: File | null) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: file });
  };

  const handleFileRemove = (field: keyof AtletWithFiles) => {
    if (!formData) return;

    const pathField = `${String(field)}_path` as keyof AtletWithFiles;

    setFormData({
      ...formData,
      [field]: null,
      [pathField]: undefined,
    });
  };

  if (!formData) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10 flex items-center justify-center p-4">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-xl border border-white/50">
          <p className="text-red font-plex text-base lg:text-lg">
            Data Atlit tidak ditemukan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      <div className="overflow-y-auto bg-white/40 backdrop-blur-md border-white/30 w-full h-screen flex flex-col gap-6 lg:gap-8 pt-6 lg:pt-8 pb-12 px-4 lg:px-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6">
          <div className="space-y-2 flex-1">
            <h1 className="font-bebas text-3xl sm:text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
              PROFIL ATLET
            </h1>
            <p className="font-plex text-black/60 text-base lg:text-lg">
              Detail informasi {formData.nama_atlet}
            </p>
          </div>

          {/* Tombol Kembali */}
          <button
            onClick={() => navigate(-1)}
            className="text-red bg-white hover:bg-red/5 border-2 border-red/30 hover:border-red/50 shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-plex font-medium transition-all duration-300"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6 mb-6 lg:mb-8 pb-6 lg:pb-0 border-b border-white/30">
            <div className="flex items-center gap-4 lg:gap-6 flex-1">
              <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-br from-red to-red/80 flex items-center justify-center text-white font-bebas text-2xl lg:text-3xl shadow-lg flex-shrink-0">
                {formData.pas_foto_path ? (
                  <img
                    src={getPhotoUrl(formData.pas_foto_path)}
                    alt={`Foto ${formData.nama_atlet}`}
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const sibling = target.nextElementSibling as HTMLElement;
                      if (sibling) sibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <span
                  className={`w-full h-full flex items-center justify-center ${
                    formData.pas_foto_path ? "hidden" : ""
                  }`}
                  style={{
                    display: formData.pas_foto_path ? "hidden" : "flex",
                  }}
                >
                  {formData.nama_atlet.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-bebas text-2xl lg:text-3xl text-black/80 tracking-wide truncate">
                  {formData.nama_atlet}
                </h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className={`px-2 lg:px-3 py-1 rounded-full text-xs font-plex font-medium ${
                      formData.jenis_kelamin === "LAKI_LAKI"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-pink-100 text-pink-600"
                    }`}
                  >
                    {formData.jenis_kelamin === "LAKI_LAKI"
                      ? "Laki-laki"
                      : "Perempuan"}
                  </span>
                  <span className="px-2 lg:px-3 py-1 rounded-full text-xs font-plex font-medium bg-yellow/20 text-yellow/80">
                    Sabuk {formData.belt || "Tidak Ada"}
                  </span>
                  <span className="px-2 lg:px-3 py-1 rounded-full text-xs font-plex font-medium bg-green-100 text-green-600">
                    {calculateAge(formData.tanggal_lahir)} tahun
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 lg:gap-3 w-full sm:w-auto">
              {user?.role === "ADMIN" || user?.role === "ADMIN_KOMPETISI" ? (
                <></>
              ) : !isEditing ? (
                <GeneralButton
                  label="Ubah Data Atlit"
                  className="text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2 w-full sm:w-auto text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3"
                  onClick={() => setIsEditing(true)}
                />
              ) : (
                <div className="flex gap-2 lg:gap-3 w-full sm:w-auto">
                  <GeneralButton
                    label="Batal"
                    className="text-red bg-white hover:bg-red/5 border-2 border-red/30 hover:border-red/50 flex-1 sm:flex-none text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  />
                  <GeneralButton
                    label={isSubmitting ? "Menyimpan..." : "Simpan"}
                    className="text-white bg-gradient-to-r from-red to-red/80 hover:from-red/90 hover:to-red/70 border-0 shadow-lg flex items-center gap-2 flex-1 sm:flex-none text-sm lg:text-base px-4 lg:px-6 py-2.5 lg:py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Nama */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                Nama Lengkap
              </label>
              <div className="relative">
                <TextInput
                  className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                  onChange={(e) =>
                    handleInputChange("nama_atlet", e.target.value)
                  }
                  disabled={!isEditing || isNameDisabled}
                  value={formData?.nama_atlet}
                  placeholder="Nama"
                  icon={<User className="text-red" size={18} />}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />
                )}
              </div>
            </div>

            {/* No HP */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                No. Telepon
              </label>
              <div className="relative">
                <TextInput
                  className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                  onChange={(e) => handleInputChange("no_telp", e.target.value)}
                  disabled={!isEditing}
                  value={formData.no_telp || ""}
                  placeholder="No HP"
                  icon={<Phone className="text-red" size={18} />}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />
                )}
              </div>
            </div>

            {/* Alamat */}
            <div className="space-y-2 lg:col-span-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                Alamat
              </label>
              <div className="relative">
                <TextInput
                  className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                  onChange={(e) => handleInputChange("alamat", e.target.value)}
                  disabled={!isEditing}
                  value={formData.alamat || ""}
                  placeholder="Alamat"
                  icon={<MapPinned className="text-red" size={18} />}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />
                )}
              </div>
            </div>

            {/* Provinsi */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                Provinsi
              </label>
              <div className="relative">
                <Select
                  unstyled
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 10 }),
                  }}
                  isDisabled={!isEditing}
                  value={
                    Object.keys(provinsiKotaData)
                      .map((provinsi) => ({
                        value: provinsi,
                        label: provinsi,
                      }))
                      .find((opt) => opt.value === formData?.provinsi) || null
                  }
                  onChange={(selected) =>
                    setFormData({
                      ...formData,
                      provinsi: selected?.value || "",
                    })
                  }
                  options={provinsiOptions}
                  placeholder="Pilih provinsi"
                  classNames={{
                    control: () =>
                      "z-10 border-2 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl h-10 lg:h-12 px-3 lg:px-4 font-plex hover:border-red/40 focus-within:border-red transition-all duration-300 text-sm lg:text-base",
                    valueContainer: () => "px-1 lg:px-2",
                    placeholder: () =>
                      "text-red/50 font-plex text-sm lg:text-base",
                    menu: () =>
                      "max-h-64 border border-red bg-white rounded-lg shadow-lg mt-1 overflow-hidden z-10",
                    menuList: () => "z-10 max-h-40 overflow-y-auto bg-white",
                    option: ({ isFocused, isSelected }) =>
                      [
                        "px-3 lg:px-4 py-2 lg:py-3 cursor-pointer font-plex transition-all duration-200 text-sm lg:text-base",
                        isFocused ? "bg-red/10 text-black" : "text-black",
                        isSelected ? "bg-red text-black" : "text-black",
                      ].join(" "),
                  }}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl z-50" />
                )}
              </div>
            </div>

            {/* Kota */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                Kota
              </label>
              <div className="relative">
                <Select
                  unstyled
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 10 }),
                  }}
                  isDisabled={!isEditing || !formData?.provinsi}
                  value={
                    formData?.provinsi && formData?.kota
                      ? provinsiKotaData[formData.provinsi]
                          ?.map((kota: string) => ({
                            value: kota,
                            label: kota,
                          }))
                          .find(
                            (opt: { value: string; label: string }) =>
                              opt.value === formData.kota
                          ) || null
                      : null
                  }
                  onChange={(
                    selected: { value: string; label: string } | null
                  ) => handleInputChange("kota", selected?.value || "")}
                  options={
                    formData?.provinsi
                      ? provinsiKotaData[formData.provinsi]?.map(
                          (kota: string) => ({
                            value: kota,
                            label: kota,
                          })
                        ) || []
                      : []
                  }
                  placeholder={
                    formData?.provinsi ? "Pilih kota" : "Pilih provinsi dulu"
                  }
                  classNames={{
                    control: () =>
                      "z-10 border-2 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl h-10 lg:h-12 px-3 lg:px-4 font-plex hover:border-red/40 focus-within:border-red transition-all duration-300 text-sm lg:text-base",
                    valueContainer: () => "px-1 lg:px-2",
                    placeholder: () =>
                      "text-red/50 font-plex text-sm lg:text-base",
                    menu: () =>
                      "max-h-64 border border-red bg-white rounded-lg shadow-lg mt-1 overflow-hidden z-10",
                    menuList: () => "z-10 max-h-40 overflow-y-auto bg-white",
                    option: ({ isFocused, isSelected }) =>
                      [
                        "px-3 lg:px-4 py-2 lg:py-3 cursor-pointer font-plex transition-all duration-200 text-sm lg:text-base",
                        isFocused ? "bg-red/10 text-black" : "text-black",
                        isSelected ? "bg-red text-black" : "text-black",
                      ].join(" "),
                  }}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl z-50" />
                )}
              </div>
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                Gender
              </label>
              <div className="relative">
                <Select
                  unstyled
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 10 }),
                  }}
                  isDisabled={!isEditing}
                  value={genderOptions.find(
                    (opt) => opt.value === formData?.jenis_kelamin
                  )}
                  onChange={(selected) =>
                    handleInputChange(
                      "jenis_kelamin",
                      selected?.value as "LAKI_LAKI" | "PEREMPUAN"
                    )
                  }
                  options={genderOptions}
                  classNames={{
                    control: () =>
                      "z-10 border-2 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl h-10 lg:h-12 px-3 lg:px-4 font-plex hover:border-red/40 focus-within:border-red transition-all duration-300 text-sm lg:text-base",
                    valueContainer: () => "px-1 lg:px-2",
                    placeholder: () =>
                      "text-red/50 font-plex text-sm lg:text-base",
                    menu: () =>
                      "max-h-64 border border-red bg-white rounded-lg shadow-lg mt-1 overflow-hidden z-10",
                    menuList: () => "z-10 max-h-40 overflow-y-auto bg-white",
                    option: ({ isFocused, isSelected }) =>
                      [
                        "px-3 lg:px-4 py-2 lg:py-3 cursor-pointer font-plex transition-all duration-200 text-sm lg:text-base",
                        isFocused ? "bg-red/10 text-black" : "text-black",
                        isSelected ? "bg-red text-black" : "text-black",
                      ].join(" "),
                  }}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl z-50" />
                )}
              </div>
            </div>

            {/* Sabuk */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                Sabuk
              </label>
              <div className="relative">
                <Select
                  unstyled
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 10 }),
                  }}
                  isDisabled={!isEditing}
                  value={
                    beltOptions.find((opt) => opt.value === formData.belt) ||
                    null
                  }
                  onChange={(selected) =>
                    handleInputChange("belt", selected?.value || "")
                  }
                  options={beltOptions}
                  classNames={{
                    control: () =>
                      "z-50 border-2 border-red/20 hover:border-red/40 bg-white/50 rounded-xl h-10 lg:h-12 px-3 lg:px-4 font-plex hover:border-red/40 focus-within:border-red transition-all duration-300 text-sm lg:text-base",
                    valueContainer: () => "px-1 lg:px-2",
                    placeholder: () =>
                      "text-red/50 font-plex text-sm lg:text-base",
                    menu: () =>
                      "max-h-64 border border-red bg-white rounded-lg shadow-lg mt-1 overflow-hidden z-20",
                    menuList: () => "z-20 max-h-40 overflow-y-auto",
                    option: ({ isFocused, isSelected }) =>
                      [
                        "px-3 lg:px-4 py-2 lg:py-3 cursor-pointer font-plex transition-all duration-200 text-sm lg:text-base",
                        isFocused ? "bg-red/10 text-black" : "text-black",
                        isSelected ? "bg-red text-black" : "",
                      ].join(" "),
                  }}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl z-50" />
                )}
              </div>
            </div>

            {/* Tanggal Lahir */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                Tanggal Lahir
              </label>
              <div className="relative">
                <TextInput
                  type="date"
                  className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                  onChange={(e) =>
                    handleInputChange("tanggal_lahir", e.target.value)
                  }
                  disabled={!isEditing}
                  value={toInputDateFormat(formData.tanggal_lahir) || ""}
                  placeholder="Tanggal Lahir"
                  icon={<CalendarFold className="text-red" size={18} />}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />
                )}
              </div>
              {formData.tanggal_lahir && (
                <p className="text-green-600 text-xs lg:text-sm font-plex">
                  Umur: {calculateAge(formData.tanggal_lahir)} tahun
                </p>
              )}
            </div>

            {/* Berat Badan */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                Berat Badan (kg)
              </label>
              <div className="relative">
                <TextInput
                  type="number"
                  className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                  onChange={(e) =>
                    handleInputChange("berat_badan", Number(e.target.value))
                  }
                  disabled={!isEditing}
                  value={formData.berat_badan?.toString() || ""}
                  placeholder="Berat Badan"
                  icon={<Scale className="text-red" size={18} />}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />
                )}
              </div>
            </div>

            {/* Tinggi Badan */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                Tinggi Badan (cm)
              </label>
              <div className="relative">
                <TextInput
                  type="number"
                  className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                  onChange={(e) =>
                    handleInputChange("tinggi_badan", Number(e.target.value))
                  }
                  disabled={!isEditing}
                  value={formData.tinggi_badan?.toString() || ""}
                  placeholder="Tinggi Badan"
                  icon={<Ruler className="text-red" size={18} />}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />
                )}
              </div>
            </div>

            {/* NIK */}
            <div className="space-y-2">
              <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
                NIK
              </label>
              <div className="relative">
                <TextInput
                  className="h-10 lg:h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 text-sm lg:text-base"
                  onChange={(e) => handleInputChange("nik", e.target.value)}
                  disabled={!isEditing}
                  value={formData.nik || ""}
                  placeholder="NIK"
                  icon={<IdCard className="text-red" size={18} />}
                />
                {!isEditing && (
                  <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ID Card Generator */}
        <IDCardGenerator atlet={formData} isEditing={isEditing} />

        {/* Certificate Generator */}
        <CertificateGenerator atlet={formData} isEditing={isEditing} />

        {/* Document Uploader */}
        <AtletDocumentUploader
          formData={formData}
          isEditing={isEditing}
          onFileChange={handleFileChange}
          onFileRemove={handleFileRemove}
        />
      </div>
    </div>
  );
};

export default Profile;