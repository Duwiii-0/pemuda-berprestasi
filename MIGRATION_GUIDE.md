# Panduan Migrasi: Node.js/Express ke PHP/Laravel

Dokumen ini adalah panduan teknis untuk memigrasikan backend proyek "Pemuda Berprestasi" dari stack Node.js/Express/Prisma ke PHP/Laravel. Panduan ini dibuat setelah melakukan analisis mendalam terhadap kode sumber yang ada.

## BAGIAN 1: Bedah Kode & Analisis Backend Saat Ini

Sebelum migrasi, sangat penting untuk memahami arsitektur dan fungsionalitas kunci dari backend yang ada.

### 1. Struktur Proyek

Struktur saat ini sangat baik dan modular, yang memudahkan pemetaan ke Laravel.

| Direktori Node.js | Tujuan | Direktori Laravel |
| :--- | :--- | :--- |
| `src/routes` | Definisi endpoint API | `routes/api.php` |
| `src/controllers` | Menerima request & mengirim response | `app/Http/Controllers` |
| `src/services` | Logika bisnis inti & interaksi database | `app/Services` (dibuat manual) |
| `src/middleware` | Otentikasi, validasi, upload, dll. | `app/Http/Middleware` |
| `src/validations` | Skema validasi (Joi) | `app/Http/Requests` (Form Requests) |
| `prisma/schema.prisma`| Skema database & relasi | `database/migrations` & `app/Models` |
| `utils` | Fungsi helper (response, JWT, dll.) | `app/Helpers` (dibuat manual) |

### 2. Analisis Dependensi

Berikut adalah pemetaan dependensi Node.js saat ini ke padanannya di Laravel/PHP:

#### Dependensi Aplikasi (`dependencies`)

| Dependensi (Node.js) | Fungsi | Padanan (Laravel/PHP) | Keterangan |
| :--- | :--- | :--- | :--- |
| `express` | Kerangka kerja web (Web Framework) | **Laravel Framework** | Laravel adalah pengganti utama untuk Express. |
| `@prisma/client` | ORM (Object-Relational Mapper) | **Eloquent ORM** | Eloquent adalah ORM bawaan Laravel yang sangat powerful. |
| `joi` / `express-validator` | Validasi data (Data Validation) | **Validation Facade** | Laravel memiliki sistem validasi bawaan yang terintegrasi. |
| `jsonwebtoken` | Otentikasi berbasis Token (JWT) | **Laravel Sanctum** | Solusi resmi dan modern dari Laravel untuk otentikasi API. |
| `bcrypt` | Hashing kata sandi | **Hash Facade** | Bawaan Laravel, sudah menggunakan Bcrypt secara default. |
| `multer` | Penanganan unggahan file | **Request File Handling** | Laravel menangani file upload secara native melalui objek `Request`. |
| `cors` | Cross-Origin Resource Sharing | `fruitcake/laravel-cors` | Paket ini biasanya sudah termasuk dalam instalasi Laravel baru. |
| `dotenv` | Variabel lingkungan (.env) | **Bawaan Laravel** | Laravel menggunakan komponen `vlucas/phpdotenv` secara internal. |
| `helmet` | Keamanan HTTP Headers | `bepsvpt/secure-headers` | Paket populer untuk menambahkan lapisan keamanan pada header. |
| `morgan` | Pencatatan log permintaan HTTP | **Logging Bawaan** | Sistem logging Laravel sangat fleksibel dan dapat dikonfigurasi. |
| `pdfkit` | Membuat dokumen PDF | `barryvdh/laravel-dompdf` | Paket yang sangat populer untuk mengubah HTML menjadi PDF. |

#### Dependensi Pengembangan (`devDependencies`)

| Dependensi (Node.js) | Fungsi | Padanan (Laravel/PHP) | Keterangan |
| :--- | :--- | :--- | :--- |
| `prisma` | Alat bantu CLI & Migrasi | **Artisan CLI** (`php artisan`) | `artisan` adalah tool command-line bawaan Laravel untuk migrasi, seeding, dll. |
| `typescript` / `ts-node` | Menjalankan TypeScript | **PHP** | Kode akan ditulis dalam PHP, jadi ini tidak lagi diperlukan. |
| `nodemon` | Auto-restart server | `php-watcher` atau `Vite` | `php-watcher` bisa digunakan untuk development. Untuk proyek modern, Vite (bawaan Laravel) akan me-refresh browser secara otomatis. |
| `@types/*` | Definisi Tipe TypeScript | **Tidak ada** | Tidak diperlukan dalam lingkungan PHP. |

### 3. Analisis Fungsionalitas Kunci


#### a. Database & Model (`prisma/schema.prisma`)
Ini adalah bagian paling KRUSIAL. Skema Prisma Anda adalah cetak biru untuk database.

*   **Tabel:** Semua `model tb_...` akan menjadi *migration file* di Laravel.
*   **Kolom:** Setiap properti di model (`nama_atlet`, `tanggal_lahir`) akan menjadi kolom di *migration*.
*   **Relasi:** Relasi `@relation` (one-to-one, one-to-many, many-to-many) harus didefinisikan ulang sebagai fungsi relasi di dalam **Eloquent Model** Laravel (misal: `hasMany()`, `belongsTo()`, `belongsToMany()`).
*   **Enum:** Semua `enum` di Prisma akan tetap menjadi kolom `ENUM` di database migration Laravel.
*   **Index & Unique:** Perintah `@@index` dan `@unique` harus diterjemahkan menjadi `$table->index()` dan `$table->unique()` di dalam file migration.

**Contoh Penerjemahan: `tb_atlet`**
*   **Prisma:** `model tb_atlet { ... id_dojang Int ... dojang tb_dojang @relation(...) }`
*   **Laravel Migration:** `Schema::create('tb_atlet', function (Blueprint $table) { ... $table->foreignId('id_dojang')->constrained('tb_dojang'); ... });`
*   **Laravel Model (`app/Models/Atlet.php`):** `public function dojang() { return $this->belongsTo(Dojang::class, 'id_dojang'); }`

#### b. Routing (`src/routes/*.ts`)
Rute Anda modular per fitur. Ini adalah pola yang bagus dan mudah ditiru di Laravel.

*   **Node.js/Express:** `router.post('/', authenticate, uploadMiddleware, AtletController.create)`
*   **Laravel (`routes/api.php`):** Rute ini akan dikelompokkan dalam `Route::middleware('auth:sanctum')`.
    ```php
    Route::post('/atlet', [AtletController::class, 'store'])->middleware('auth:sanctum');
    ```

#### c. Controllers (`src/controllers/*.ts`)
Controller Anda saat ini melakukan parsing manual (`parseInt`, `new Date()`). Di Laravel, ini bisa dibuat lebih bersih.

*   **Node.js/Express:** Menerima `(req, res)`. Data diambil dari `req.body`, `req.params`, `req.files`.
*   **Laravel:** Menerima object `Request`.
    ```php
    // Di Laravel, Anda bisa menggunakan Form Request untuk validasi
    // dan autorisasi sebelum controller berjalan.
    public function store(StoreAtletRequest $request) {
        // Data yang sudah divalidasi bisa diakses via $request->validated()
        $validatedData = $request->validated();
        // ... panggil service
    }
    ```

#### d. Services (`src/services/*.ts`)
Ini adalah jantung logika bisnis Anda. **Logikanya akan tetap sama, tetapi sintaksnya berubah.**

*   **Node.js/Prisma:**
    ```typescript
    prisma.tb_atlet.create({
      data: { ... },
      include: { dojang: true }
    });
    ```
*   **Laravel/Eloquent:**
    ```php
    // Anggap 'Atlet' adalah Eloquent Model
    $atlet = Atlet::create([...]);
    $atlet->load('dojang'); // Eager loading
    ```
*   **Poin Penting di Service:**
    *   Logika `calculateAge` bisa dibuat sebagai *mutator/accessor* di Eloquent Model (`getAgeAttribute`).
    *   Semua query kompleks (`where`, `_count`, filter) memiliki padanan di Eloquent.
    *   Logika file (`fs`) akan digantikan oleh Fassad `Storage` Laravel.

#### e. Validasi (`src/validations/*.ts`)
Anda menggunakan `Joi` untuk validasi berbasis skema. Konsep ini persis seperti **Form Requests** di Laravel.

*   **Node.js/Joi:**
    ```javascript
    Joi.object({ nama_atlet: Joi.string().required() });
    ```
*   **Laravel Form Request (`app/Http/Requests/StoreAtletRequest.php`):**
    ```php
    public function rules() {
        return [
            'nama_atlet' => 'required|string|min:2|max:150',
            'tanggal_lahir' => 'required|date|before:now',
            // ... aturan validasi lainnya
        ];
    }
    ```

#### f. File Upload (`src/middleware/upload.ts`) & File Serving
Anda menggunakan `multer` untuk upload dan `fs` untuk menyajikan file.

*   **Upload:** Middleware `uploadMiddleware` digantikan oleh cara Laravel menangani file. Di controller, Anda cukup mengaksesnya via `$request->file('pas_foto')` dan menyimpannya menggunakan Fassad `Storage`.
    ```php
    if ($request->hasFile('pas_foto')) {
        $path = $request->file('pas_foto')->store('public/atlet/pas_foto');
    }
    ```
*   **File Serving:** Rute `GET /files/:folder/:filename` digantikan oleh **Symbolic Link** Laravel. Dengan menjalankan `php artisan storage:link`, semua file di direktori `storage/app/public` akan bisa diakses dari `public/storage`. URL file akan menjadi `http://your.app/storage/atlet/pas_foto/filename.jpg`.

---

## BAGIAN 2: Panduan Migrasi Langkah-demi-Langkah

Berikut adalah checklist praktis untuk proses migrasi.

### Langkah 0: Persiapan
1.  **Install PHP, Composer, dan database** (MySQL/MariaDB direkomendasikan).
2.  Install Laravel installer: `composer global require laravel/installer`.

### Langkah 1: Setup Proyek Laravel & Konfigurasi
1.  Buat proyek Laravel baru: `laravel new pemuda-berprestasi-api`.
2.  Masuk ke direktori `pemuda-berprestasi-api`.
3.  **Konfigurasi Database:** Buka file `.env` dan atur koneksi database (`DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).

### Langkah 2: Migrasi Database (Prisma -> Eloquent)
1.  **Buka `schema.prisma` sebagai referensi utama.**
2.  Untuk setiap `model tb_...` di Prisma, buat file migration dan model di Laravel.
    ```bash
    # Contoh untuk tabel atlet
    php artisan make:model Atlet -m
    ```
    Perintah ini akan membuat file model `app/Models/Atlet.php` dan file migration di `database/migrations/`.
3.  **Isi File Migration:** Buka file migration yang baru dibuat dan definisikan skema tabel sesuai dengan kolom di `schema.prisma`, termasuk tipe data, relasi (foreign key), index, dan unique constraint.
4.  **Isi File Model:** Buka file model (misal `Atlet.php`) dan definisikan relasi Eloquent (`belongsTo`, `hasMany`, dll) yang sesuai.
5.  Ulangi untuk semua tabel. **Ini adalah langkah yang paling memakan waktu namun paling penting.**
6.  Setelah semua migration dibuat, jalankan: `php artisan migrate`.

### Langkah 3: Migrasi Rute dan Controllers
1.  Buka `routes/api.php` di Laravel.
2.  Lihat `src/routes/*.ts` Anda. Untuk setiap endpoint, buat padanannya di Laravel.
    ```php
    // routes/api.php
    use App\Http\Controllers\AtletController;

    Route::apiResource('atlet', AtletController::class)->middleware('auth:sanctum');
    // apiResource sudah otomatis membuat endpoint CRUD (index, show, store, update, destroy)
    ```
3.  Buat controller yang dibutuhkan: `php artisan make:controller AtletController --api`.
4.  Pindahkan logika dari controller Express ke controller Laravel. Ingat, `req, res` digantikan oleh object `Request` dan `response()->json()`.

### Langkah 4: Validasi & Form Requests
1.  Untuk setiap endpoint yang butuh validasi data (khususnya `store` dan `update`), buat **Form Request**.
    ```bash
    php artisan make:request StoreAtletRequest
    ```
2.  Buka file `app/Http/Requests/StoreAtletRequest.php`.
3.  Di dalam metode `rules()`, terjemahkan skema Joi Anda menjadi aturan validasi Laravel.
4.  Gunakan Form Request ini di metode controller Anda untuk validasi otomatis.

### Langkah 5: Adaptasi Logika Service
1.  Buat direktori `app/Services` secara manual.
2.  Pindahkan file-file `*.service.ts` Anda menjadi `*.php` di dalam `app/Services`.
3.  **Refactor total:**
    *   Ubah sintaks dari TypeScript ke PHP.
    *   Ganti semua panggilan `prisma.tb_...` dengan panggilan Eloquent Model (`Atlet::find()`, `Dojang::create()`, dll).
    *   Ganti penggunaan `fs` dengan Fassad `Storage` Laravel.

### Langkah 6: Setup Otentikasi & Upload
1.  **Otentikasi:**
    *   Install Laravel Sanctum: `composer require laravel/sanctum`.
    *   Publikasikan konfigurasinya: `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"`.
    *   Jalankan migrasi Sanctum: `php artisan migrate`.
    *   Tambahkan `Laravel\Sanctum\HasApiTokens` trait ke model `User` Anda (atau `Akun`).
    *   Logika login Anda sekarang akan membuat token menggunakan `$user->createToken('token-name')->plainTextToken`.
    *   Lindungi rute Anda dengan middleware `auth:sanctum`.
2.  **Upload:**
    *   Jalankan `php artisan storage:link` untuk membuat symbolic link.
    *   Pastikan semua logika upload di controller/service menggunakan `$request->file(...)` dan `Storage::disk('public')->put(...)`.

### Langkah 7: Pengujian & Finalisasi
1.  Gunakan Postman atau Insomnia untuk menguji setiap endpoint API Laravel yang baru. Pastikan request dan response-nya **identik** dengan API lama.
2.  Setelah semua API terverifikasi, buka proyek frontend React Anda.
3.  Ubah `VITE_API_URL` di file `.env` agar menunjuk ke URL server Laravel Anda.
4.  Jalankan frontend dan uji coba secara menyeluruh. Jika langkah-langkah di atas diikuti dengan benar, frontend seharusnya berfungsi tanpa masalah.
