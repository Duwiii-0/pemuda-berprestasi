// src/pages/atlit/TambahAtlit.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  MapPinned,
  CalendarFold,
  Scale,
  Ruler,
  IdCard,
  Save,
  Menu,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import Select from "react-select";
import TextInput from "../../components/textInput";
import FileInput from "../../components/fileInput";
import NavbarDashboard from "../../components/navbar/navbarDashboard";
import {
  useAtletContext,
  calculateAge,
  genderOptions,
  beltOptions,
} from "../../context/AtlitContext";
import toast from "react-hot-toast";
import { useAuth } from "../../context/authContext";

// Type untuk form
interface AtletForm {
  name: string;
  phone: string;
  nik: string;
  tanggal_lahir: string;
  alamat: string;
  provinsi: string;
  kota: string; // Changed from 'provinsi' to 'kota' for city
  bb: number | string;
  tb: number | string;
  gender: string;
  belt: string;
  akte_kelahiran?: File | null;
  pas_foto?: File | null;
  sertifikat_belt?: File | null;
  ktp?: File | null;
}

// Data provinsi dan kota - integrated from RegisterDojang
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

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

const compressImage = (file: File, maxSizeKB: number = 500): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;
      const maxWidth = 1200;
      const maxHeight = 1200;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx!.drawImage(img, 0, 0, width, height);

      let quality = 0.8;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });

            if (compressedFile.size > maxSizeKB * 1024 && quality > 0.1) {
              quality -= 0.1;
              tryCompress();
            } else {
              resolve(compressedFile);
            }
          },
          file.type,
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
};

// Fungsi validasi file
const validateFile = (file: File, allowPDF: boolean = false) => {
  if (!file) return { isValid: false, error: "File tidak ditemukan" };

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: `File terlalu besar. Maksimal 2MB` };
  }

  const allowedTypes = allowPDF
    ? [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES]
    : ALLOWED_IMAGE_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: `Format tidak didukung` };
  }

  return { isValid: true };
};

// Fungsi format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const TambahAtlit = () => {
  const navigate = useNavigate();
  const { createAtlet } = useAtletContext();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<AtletForm>({
    name: "",
    phone: "",
    nik: "",
    tanggal_lahir: "",
    alamat: "",
    provinsi: "",
    kota: "",
    bb: "",
    tb: "",
    gender: "",
    belt: "",
    akte_kelahiran: null,
    pas_foto: null,
    sertifikat_belt: null,
    ktp: null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get city options based on selected province
  const kotaOptions = formData.provinsi
    ? provinsiKotaData[formData.provinsi]?.map((kota: string) => ({
        value: kota,
        label: kota,
      })) || []
    : [];

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleBack = () => navigate("/dashboard/atlit");

  const handleInputChange = (field: keyof AtletForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleProvinsiChange = (selectedOption: any) => {
    const newProvinsi = selectedOption?.value || "";
    setFormData((prev) => ({
      ...prev,
      provinsi: newProvinsi,
      kota: "", // Reset city when province changes
    }));
    // Clear errors
    if (errors.provinsi) {
      setErrors((prev) => ({ ...prev, provinsi: "" }));
    }
    if (errors.kota) {
      setErrors((prev) => ({ ...prev, kota: "" }));
    }
  };

  const handleKotaChange = (selectedOption: any) => {
    handleInputChange("kota", selectedOption?.value || "");
  };

  const [fileProcessing, setFileProcessing] = useState<Record<string, boolean>>(
    {
      akte_kelahiran: false,
      pas_foto: false,
      sertifikat_belt: false,
      ktp: false,
    }
  );

  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  const handleFileChange = async (
    field: keyof AtletForm,
    file: File | null
  ) => {
    if (!file) {
      setFormData((prev) => ({ ...prev, [field]: file }));
      setFileErrors((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    setFileProcessing((prev) => ({ ...prev, [field]: true }));
    setFileErrors((prev) => ({ ...prev, [field]: "" }));

    try {
      const allowPDF = field === "sertifikat_belt";
      const validation = validateFile(file, allowPDF);

      if (!validation.isValid) {
        setFileErrors((prev) => ({
          ...prev,
          [field]: validation.error || "File tidak valid",
        }));
        setFileProcessing((prev) => ({ ...prev, [field]: false }));
        return;
      }

      let processedFile = file;

      // Compress jika image
      if (file.type.startsWith("image/")) {
        try {
          const maxSizeKB = field === "pas_foto" ? 300 : 500;
          processedFile = await compressImage(file, maxSizeKB);
          toast.success(
            `File dikompres: ${formatFileSize(file.size)} → ${formatFileSize(
              processedFile.size
            )}`
          );
        } catch (error) {
          console.warn("Compression failed, using original");
          processedFile = file;
        }
      }

      setFormData((prev) => ({ ...prev, [field]: processedFile }));
    } catch (error) {
      setFileErrors((prev) => ({ ...prev, [field]: "Gagal memproses file" }));
      toast.error(`Gagal memproses ${field}`);
    } finally {
      setFileProcessing((prev) => ({ ...prev, [field]: false }));
    }
  };

  // Updated validation function to match backend requirements
  // Updated validation - hanya file upload yang opsional
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // SEMUA FIELD WAJIB KECUALI FILE UPLOAD
    if (!formData.name.trim()) {
      newErrors.name = "Nama wajib diisi";
    }

    if (!formData.tanggal_lahir) {
      newErrors.tanggal_lahir = "Tanggal lahir wajib diisi";
    }

    if (!formData.alamat) {
      newErrors.alamat = "Alamat wajib diisi";
    }

    if (!formData.provinsi) {
      newErrors.provinsi = "Provinsi wajib dipilih";
    }

    if (!formData.kota) {
      newErrors.kota = "Kota wajib dipilih";
    }

    if (!formData.gender) {
      newErrors.gender = "Gender wajib dipilih";
    }

    if (!formData.nik?.trim()) {
      newErrors.nik = "NIK wajib diisi";
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "Nomor telepon wajib diisi";
    }

    if (!formData.alamat?.trim()) {
      newErrors.alamat = "Alamat wajib diisi";
    }

    if (!formData.provinsi) {
      newErrors.provinsi = "Provinsi wajib dipilih";
    }

    if (!formData.kota) {
      newErrors.kota = "Kota wajib dipilih";
    }

    if (!formData.belt) {
      newErrors.belt = "Tingkat sabuk wajib dipilih";
    }

    if (!formData.bb) {
      newErrors.bb = "Berat badan wajib diisi";
    }

    if (!formData.tb) {
      newErrors.tb = "Tinggi badan wajib diisi";
    }

    // VALIDATION FORMAT
    if (
      formData.phone &&
      !/^(\+62|62|0)[0-9]{9,13}$/.test(formData.phone.trim())
    ) {
      newErrors.phone =
        "Format nomor telepon tidak valid (contoh: 08123456789)";
    }

    if (formData.nik) {
      const nikClean = formData.nik.trim();
      if (nikClean.length !== 16 || !/^\d{16}$/.test(nikClean)) {
        newErrors.nik = "NIK harus 16 digit angka";
      }
    }

    // Validasi tanggal lahir
    if (formData.tanggal_lahir) {
      const today = new Date();
      const birthDate = new Date(formData.tanggal_lahir);
      if (birthDate > today) {
        newErrors.tanggal_lahir = "Tanggal lahir tidak boleh di masa depan";
      }

      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 3) {
        newErrors.tanggal_lahir = "Umur minimal 3 tahun";
      }
    }

    // Validasi angka
    if (formData.bb) {
      const weight = parseFloat(formData.bb as string);
      if (isNaN(weight) || weight <= 0 || weight > 500) {
        newErrors.bb = "Berat badan harus antara 1-500 kg";
      }
    }

    if (formData.tb) {
      const height = parseFloat(formData.tb as string);
      if (isNaN(height) || height <= 0 || height > 300) {
        newErrors.tb = "Tinggi badan harus antara 1-300 cm";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    // Validasi file size sebelum submit
    const fileFields = [
      "akte_kelahiran",
      "pas_foto",
      "sertifikat_belt",
      "ktp",
    ] as const;
    const maxFileSize = 2 * 1024 * 1024; // 2MB

    for (const field of fileFields) {
      const file = formData[field] as File | null;
      if (file && file.size > maxFileSize) {
        toast.error(
          `${field} terlalu besar (${formatFileSize(file.size)}). Maksimal 2MB`
        );
        return;
      }
    }

    // Hitung total size
    let totalSize = 0;
    fileFields.forEach((field) => {
      const file = formData[field] as File | null;
      if (file) totalSize += file.size;
    });

    if (totalSize > 8 * 1024 * 1024) {
      // 8MB total limit
      toast.error(
        `Total file terlalu besar (${formatFileSize(totalSize)}). Maksimal 8MB`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataSend = new FormData();

      // SEMUA FIELD DATA WAJIB DIKIRIM
      formDataSend.append("nama_atlet", formData.name.trim());
      formDataSend.append("jenis_kelamin", formData.gender);
      formDataSend.append("tanggal_lahir", formData.tanggal_lahir);
      formDataSend.append("nik", formData.nik.trim());
      formDataSend.append("no_telp", formData.phone.trim());
      formDataSend.append("alamat", formData.alamat.trim());
      formDataSend.append("provinsi", formData.provinsi);
      formDataSend.append("kota", formData.kota);
      formDataSend.append("belt", formData.belt);
      formDataSend.append("id_dojang", String(user?.pelatih?.id_dojang ?? ""));
      formDataSend.append(
        "id_pelatih_pembuat",
        String(user?.pelatih?.id_pelatih ?? "")
      );

      // NUMERIC FIELDS
      const weight = parseFloat(formData.bb as string);
      const height = parseFloat(formData.tb as string);
      formDataSend.append("berat_badan", String(weight));
      formDataSend.append("tinggi_badan", String(height));

      // FILE UPLOADS - HANYA INI YANG OPSIONAL
      if (formData.akte_kelahiran)
        formDataSend.append("akte_kelahiran", formData.akte_kelahiran);
      if (formData.pas_foto) formDataSend.append("pas_foto", formData.pas_foto);
      if (formData.sertifikat_belt)
        formDataSend.append("sertifikat_belt", formData.sertifikat_belt);
      if (formData.ktp) formDataSend.append("ktp", formData.ktp);

      // DEBUG: Log FormData sebelum kirim
      console.log("📤 DEBUG: Sending FormData contents:");
      for (let [key, value] of formDataSend.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      const result = await createAtlet(formDataSend);

      if (result) {
        setSubmitSuccess(true);
        toast.success("Berhasil menambahkan Atlet!");

        // Reset form
        setFormData({
          name: "",
          phone: "",
          nik: "",
          tanggal_lahir: "",
          alamat: "",
          provinsi: "",
          kota: "",
          bb: "",
          tb: "",
          gender: "",
          belt: "",
          akte_kelahiran: null,
          pas_foto: null,
          sertifikat_belt: null,
          ktp: null,
        });

        setTimeout(
          () => navigate("/dashboard/atlit", { state: { refresh: true } }),
          1000
        );
      }
    } catch (error: any) {
      console.error("❌ Error creating athlete:", error);

      // Improved error handling with better user messages
      let errorMessage = "Terjadi kesalahan saat menyimpan data";

      if (
        error.status === 413 ||
        error.message?.includes("413") ||
        error.message?.includes("Payload Too Large")
      ) {
        errorMessage = "Mohon Lengkapi requirement yang dibutuhkan";
      } else if (
        error.message?.includes("File size") ||
        error.message?.includes("terlalu besar")
      ) {
        errorMessage = "Ukuran file melebihi batas maksimal 2MB per file.";
      } else if (
        error.message?.includes("Invalid file") ||
        error.message?.includes("format")
      ) {
        errorMessage =
          "Format file tidak didukung. Gunakan JPG, PNG, atau PDF.";
      } else if (
        error.message?.includes("Argument") &&
        error.message?.includes("missing")
      ) {
        // Handle Prisma validation errors
        if (error.message.includes("nik")) {
          errorMessage = "Mohon Lengkapi requirement yang dibutuhkan";
        } else {
          errorMessage = "Ada data wajib yang kurang atau tidak valid.";
        }
      } else if (error.message?.includes("wajib diisi")) {
        errorMessage = `Field wajib kurang: ${error.message}`;
      } else if (error.message?.includes("Invalid `prisma")) {
        // Handle database/Prisma errors more gracefully
        errorMessage =
          "Terjadi kesalahan database. Periksa data dan coba lagi.";
      } else if (
        error.message?.includes("Network Error") ||
        error.message?.includes("fetch")
      ) {
        errorMessage = "Koneksi bermasalah. Cek internet dan coba lagi.";
      } else if (error.status === 400) {
        errorMessage = "Data yang dikirim tidak valid. Periksa kembali form.";
      } else if (error.status === 500) {
        errorMessage = "Server mengalami gangguan. Coba lagi nanti.";
      } else if (error.message) {
        // Clean up technical error messages for user
        const cleanMessage = error.message
          .replace(/Invalid `prisma\..*?` invocation.*?\n/gs, "")
          .replace(/Argument `.*?` is missing\./g, "Ada data yang kurang.")
          .replace(/→.*$/gm, "")
          .trim();

        if (
          cleanMessage &&
          cleanMessage.length < 100 &&
          !cleanMessage.includes("prisma")
        ) {
          errorMessage = cleanMessage;
        }
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  // Helper function to get select value for react-select
  const getSelectValue = (options: any[], value: string) => {
    return options.find((option) => option.value === value) || null;
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white via-red/5 to-yellow/10">
      {/* Desktop Navbar */}
      <NavbarDashboard />

      {/* Success Message */}
      {submitSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-xl z-50 animate-pulse">
          Data atlet berhasil disimpan!
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ml-72 min-h-screen">
        <div className="bg-white/40 backdrop-blur-md border-white/30 w-full min-h-screen flex flex-col gap-8 pt-8 pb-12 px-4 lg:px-8">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-3 rounded-xl hover:bg-white/50 transition-all duration-300 border border-red/20"
                aria-label="Open menu"
              >
                <Menu size={24} className="text-red" />
              </button>
            </div>

            {/* Title */}
            <div className="space-y-2 flex-1">
              <button
                onClick={handleBack}
                className="text-red hover:text-red/80 font-plex mb-4 flex items-center gap-2 transition-colors"
                disabled={isSubmitting}
              >
                <ArrowLeft size={20} />
                Kembali ke Data Atlit
              </button>
              <h1 className="font-bebas text-4xl lg:text-6xl xl:text-7xl text-black/80 tracking-wider">
                TAMBAH ATLIT
              </h1>
              <p className="font-plex text-black/60 text-lg">
                Daftarkan atlet baru ke sistem
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Data Pribadi */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red/10 rounded-xl">
                  <User className="text-red" size={20} />
                </div>
                <h3 className="font-bebas text-2xl text-black/80 tracking-wide">
                  DATA PRIBADI
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Nama */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Nama Lengkap <span className="text-red">*</span>
                  </label>
                  <TextInput
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.name ? "border-red-500" : "border-red/20"
                    }`}
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    icon={<User className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm font-plex">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* No HP */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    No. Telepon <span className="text-red">*</span>
                  </label>
                  <TextInput
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.phone ? "border-red-500" : "border-red/20"
                    }`}
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Contoh: 08123456789"
                    icon={<Phone className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-sm font-plex">
                      {errors.phone}
                    </p>
                  )}
                </div>

                {/* Alamat */}
                <div className="space-y-2 lg:col-span-2">
                  <label className="block font-plex font-medium text-black/70">
                    Alamat <span className="text-red">*</span>
                  </label>
                  <TextInput
                    className="h-12 border-red/20 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300"
                    value={formData.alamat}
                    onChange={(e) =>
                      handleInputChange("alamat", e.target.value)
                    }
                    placeholder="Masukkan alamat lengkap"
                    icon={<MapPinned className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Provinsi */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Provinsi <span className="text-red">*</span>
                  </label>
                  <Select
                    unstyled
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 50 }),
                    }}
                    isDisabled={isSubmitting}
                    value={getSelectValue(provinsiOptions, formData.provinsi)}
                    onChange={handleProvinsiChange}
                    options={provinsiOptions}
                    placeholder="Pilih provinsi"
                    classNames={{
                      control: () =>
                        `flex items-center border-2 ${
                          !isSubmitting
                            ? "border-red/20 hover:border-red/40 focus-within:border-red bg-white/80"
                            : "border-gray-200 bg-gray-50"
                        } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                      valueContainer: () => "px-1",
                      placeholder: () => "text-gray-400 font-plex text-sm",
                      menu: () =>
                        "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                      menuList: () => "max-h-32 overflow-y-auto",
                      option: ({ isFocused, isSelected }) =>
                        [
                          "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
                          isFocused ? "bg-red/10 text-red" : "text-black/80",
                          isSelected ? "bg-red text-white" : "",
                        ].join(" "),
                    }}
                  />
                </div>

                {/* Kota */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Kota <span className="text-red">*</span>
                  </label>
                  <Select
                    unstyled
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 50 }),
                    }}
                    isDisabled={isSubmitting || !formData.provinsi}
                    value={getSelectValue(kotaOptions, formData.kota)}
                    onChange={handleKotaChange}
                    options={kotaOptions}
                    placeholder={
                      formData.provinsi ? "Pilih kota" : "Pilih provinsi dulu"
                    }
                    classNames={{
                      control: () =>
                        `flex items-center border-2 ${
                          !isSubmitting && formData.provinsi
                            ? "border-red/20 hover:border-red/40 focus-within:border-red bg-white/80"
                            : "border-gray-200 bg-gray-50"
                        } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                      valueContainer: () => "px-1",
                      placeholder: () => "text-gray-400 font-plex text-sm",
                      menu: () =>
                        "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                      menuList: () => "max-h-32 overflow-y-auto",
                      option: ({ isFocused, isSelected }) =>
                        [
                          "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
                          isFocused ? "bg-red/10 text-red" : "text-black/80",
                          isSelected ? "bg-red text-white" : "",
                        ].join(" "),
                    }}
                  />
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Gender <span className="text-red">*</span>
                  </label>
                  <Select
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 50 }),
                    }}
                    unstyled
                    isDisabled={isSubmitting}
                    value={getSelectValue(genderOptions, formData.gender)}
                    onChange={(selected) =>
                      handleInputChange("gender", selected?.value || "")
                    }
                    options={genderOptions}
                    placeholder="Pilih gender"
                    classNames={{
                      control: () =>
                        `flex items-center border-2 ${
                          errors.gender
                            ? "border-red bg-white/80"
                            : !isSubmitting
                            ? "border-red/20 hover:border-red/40 focus-within:border-red bg-white/80"
                            : "border-gray-200 bg-gray-50"
                        } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                      valueContainer: () => "px-1",
                      placeholder: () => "text-gray-400 font-plex text-sm",
                      menu: () =>
                        "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                      menuList: () => "max-h-32 overflow-y-auto",
                      option: ({ isFocused, isSelected }) =>
                        [
                          "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
                          isFocused ? "bg-red/10 text-red" : "text-black/80",
                          isSelected ? "bg-red text-white" : "text-black/80",
                        ].join(" "),
                    }}
                  />
                  {errors.gender && (
                    <p className="text-red-500 text-sm font-plex">
                      {errors.gender}
                    </p>
                  )}
                </div>

                {/* Tanggal Lahir */}
                <div className="space-y-2 w-full">
                  <label className="block font-plex font-medium text-black/70">
                    Tanggal Lahir <span className="text-red">*</span>
                  </label>
                  <TextInput
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red w-full transition-all duration-300 ${
                      errors.tanggal_lahir ? "border-red-500" : "border-red/20"
                    }`}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        tanggal_lahir: e.target.value,
                      })
                    }
                    value={formData.tanggal_lahir}
                    type="date"
                    placeholder="Pilih tanggal lahir"
                    icon={<CalendarFold className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.tanggal_lahir && (
                    <p className="text-red-500 text-sm font-plex">
                      {errors.tanggal_lahir}
                    </p>
                  )}
                  {formData.tanggal_lahir && !errors.tanggal_lahir && (
                    <p className="text-green-600 text-sm font-plex">
                      Umur: {calculateAge(formData.tanggal_lahir)} tahun
                    </p>
                  )}
                </div>

                {/* Sabuk */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Tingkat Sabuk <span className="text-red">*</span>
                  </label>
                  <Select
                    unstyled
                    menuPortalTarget={document.body}
                    styles={{
                      menuPortal: (base) => ({ ...base, zIndex: 50 }),
                    }}
                    isDisabled={isSubmitting}
                    value={getSelectValue(beltOptions, formData.belt)}
                    onChange={(selected) =>
                      handleInputChange("belt", selected?.value || "")
                    }
                    options={beltOptions}
                    placeholder="Pilih tingkat sabuk"
                    classNames={{
                      control: () =>
                        `flex items-center border-2 ${
                          !isSubmitting
                            ? "border-red/20 hover:border-red/40 focus-within:border-red bg-white/80"
                            : "border-gray-200 bg-gray-50"
                        } rounded-xl px-4 py-3 gap-3 backdrop-blur-sm transition-all duration-300 hover:shadow-lg`,
                      valueContainer: () => "px-1",
                      placeholder: () => "text-gray-400 font-plex text-sm",
                      menu: () =>
                        "border border-red/20 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl mt-2 overflow-hidden z-50",
                      menuList: () => "max-h-32 overflow-y-auto",
                      option: ({ isFocused, isSelected }) =>
                        [
                          "px-4 py-3 cursor-pointer font-plex text-sm transition-colors duration-200 hover:text-red",
                          isFocused ? "bg-red/10 text-red" : "text-black/80",
                          isSelected ? "bg-red text-white" : "",
                        ].join(" "),
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Data Fisik */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <Scale className="text-blue-500" size={20} />
                </div>
                <h3 className="font-bebas text-2xl text-black/80 tracking-wide">
                  DATA FISIK
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Berat Badan */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Berat Badan (kg) <span className="text-red">*</span>
                  </label>
                  <TextInput
                    type="number"
                    min="10"
                    max="300"
                    step="0.1"
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.bb ? "border-red-500" : "border-red/20"
                    }`}
                    value={formData.bb}
                    onChange={(e) => handleInputChange("bb", e.target.value)}
                    placeholder="Contoh: 65.5"
                    icon={<Scale className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.bb && (
                    <p className="text-red-500 text-sm font-plex">
                      {errors.bb}
                    </p>
                  )}
                </div>

                {/* Tinggi Badan */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Tinggi Badan (cm)<span className="text-red">*</span>
                  </label>
                  <TextInput
                    type="number"
                    min="50"
                    max="250"
                    step="1"
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.tb ? "border-red-500" : "border-red/20"
                    }`}
                    value={formData.tb}
                    onChange={(e) => handleInputChange("tb", e.target.value)}
                    placeholder="Contoh: 170"
                    icon={<Ruler className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.tb && (
                    <p className="text-red-500 text-sm font-plex">
                      {errors.tb}
                    </p>
                  )}
                </div>

                {/* NIK */}
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    NIK<span className="text-red">*</span>
                  </label>
                  <TextInput
                    type="text"
                    maxLength={16}
                    className={`h-12 bg-white/50 backdrop-blur-sm rounded-xl focus:border-red transition-all duration-300 ${
                      errors.nik ? "border-red-500" : "border-red/20"
                    }`}
                    value={formData.nik}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      handleInputChange("nik", value);
                    }}
                    placeholder="16 digit NIK"
                    icon={<IdCard className="text-red" size={20} />}
                    disabled={isSubmitting}
                  />
                  {errors.nik && (
                    <p className="text-red-500 text-sm font-plex">
                      {errors.nik}
                    </p>
                  )}
                  {formData.nik &&
                    formData.nik.length > 0 &&
                    formData.nik.length < 16 && (
                      <p className="text-yellow-600 text-sm font-plex">
                        NIK: {formData.nik.length}/16 digit
                      </p>
                    )}
                </div>
              </div>
            </div>

            {/* Dokumen Pendukung */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-xl border border-white/50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-yellow-500/10 rounded-xl">
                  <IdCard className="text-yellow-600" size={20} />
                </div>
                <h3 className="font-bebas text-2xl text-black/80 tracking-wide">
                  DOKUMEN PENDUKUNG (OPSIONAL)
                </h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Akte Kelahiran
                  </label>
                  <div className="relative">
                    <FileInput
                      accept="image/*"
                      file={formData.akte_kelahiran}
                      className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
                      onChange={(e) =>
                        handleFileChange(
                          "akte_kelahiran",
                          e.target.files?.[0] || null
                        )
                      }
                      disabled={isSubmitting || fileProcessing.akte_kelahiran}
                    />

                    {fileProcessing.akte_kelahiran && (
                      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red"></div>
                          <span className="text-sm text-red font-plex">
                            Kompres...
                          </span>
                        </div>
                      </div>
                    )}

                    {fileErrors.akte_kelahiran && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm font-plex flex items-center gap-2">
                          <AlertCircle size={16} />
                          {fileErrors.akte_kelahiran}
                        </p>
                      </div>
                    )}

                    {formData.akte_kelahiran &&
                      !fileErrors.akte_kelahiran &&
                      !fileProcessing.akte_kelahiran && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-600 text-sm font-plex flex items-center gap-2">
                            <CheckCircle size={16} />
                            Siap upload (
                            {formatFileSize(formData.akte_kelahiran.size)})
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Pas Foto 3x4
                  </label>
                  <div className="relative">
                    <FileInput
                      accept="image/*"
                      file={formData.pas_foto}
                      className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
                      onChange={(e) =>
                        handleFileChange(
                          "pas_foto",
                          e.target.files?.[0] || null
                        )
                      }
                      disabled={isSubmitting || fileProcessing.pas_foto}
                    />

                    {fileProcessing.pas_foto && (
                      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red"></div>
                          <span className="text-sm text-red font-plex">
                            Kompres...
                          </span>
                        </div>
                      </div>
                    )}

                    {fileErrors.pas_foto && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm font-plex flex items-center gap-2">
                          <AlertCircle size={16} />
                          {fileErrors.pas_foto}
                        </p>
                      </div>
                    )}

                    {formData.pas_foto &&
                      !fileErrors.pas_foto &&
                      !fileProcessing.pas_foto && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-600 text-sm font-plex flex items-center gap-2">
                            <CheckCircle size={16} />
                            Siap upload (
                            {formatFileSize(formData.pas_foto.size)})
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    Sertifikasi Belt
                  </label>
                  <div className="relative">
                    <FileInput
                      accept="image/*,application/pdf"
                      file={formData.sertifikat_belt}
                      className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
                      onChange={(e) =>
                        handleFileChange(
                          "sertifikat_belt",
                          e.target.files?.[0] || null
                        )
                      }
                      disabled={isSubmitting || fileProcessing.sertifikat_belt}
                    />

                    {fileProcessing.sertifikat_belt && (
                      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red"></div>
                          <span className="text-sm text-red font-plex">
                            Memproses...
                          </span>
                        </div>
                      </div>
                    )}

                    {fileErrors.sertifikat_belt && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm font-plex flex items-center gap-2">
                          <AlertCircle size={16} />
                          {fileErrors.sertifikat_belt}
                        </p>
                      </div>
                    )}

                    {formData.sertifikat_belt &&
                      !fileErrors.sertifikat_belt &&
                      !fileProcessing.sertifikat_belt && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-green-600 text-sm font-plex flex items-center gap-2">
                            <CheckCircle size={16} />
                            Siap upload (
                            {formatFileSize(formData.sertifikat_belt.size)})
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-plex font-medium text-black/70">
                    KTP (Wajib untuk 17+)
                  </label>
                  <div className="relative">
                    <FileInput
                      accept="image/*"
                      file={formData.ktp}
                      className="border-red/20 bg-white/50 backdrop-blur-sm rounded-xl hover:border-red transition-all duration-300"
                      onChange={(e) =>
                        handleFileChange("ktp", e.target.files?.[0] || null)
                      }
                      disabled={isSubmitting || fileProcessing.ktp}
                    />

                    {fileProcessing.ktp && (
                      <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red"></div>
                          <span className="text-sm text-red font-plex">
                            Kompres...
                          </span>
                        </div>
                      </div>
                    )}

                    {fileErrors.ktp && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm font-plex flex items-center gap-2">
                          <AlertCircle size={16} />
                          {fileErrors.ktp}
                        </p>
                      </div>
                    )}

                    {formData.ktp && !fileErrors.ktp && !fileProcessing.ktp && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-600 text-sm font-plex flex items-center gap-2">
                          <CheckCircle size={16} />
                          Siap upload ({formatFileSize(formData.ktp.size)})
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/50">
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <button
                  type="button"
                  onClick={handleBack}
                  className="cursor-pointer px-6 py-3 rounded-xl bg-gray-500 text-white hover:bg-gray-600 transition-all duration-300 shadow-lg font-plex disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="cursor-pointer flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-red text-white hover:bg-red/90 transition-all duration-300 shadow-lg font-plex disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Simpan Data Atlit
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="lg:hidden z-50">
            <NavbarDashboard mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}
    </div>
  );
}; // <- Hapus kurung kurawal extra di sini

export default TambahAtlit;
