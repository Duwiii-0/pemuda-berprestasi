# Proyek Pemuda Berprestasi

Selamat datang di Proyek Pemuda Berprestasi! Aplikasi ini adalah platform full-stack yang dirancang untuk mengelola pendaftaran dan pelaksanaan kompetisi Taekwondo.

Aplikasi ini terdiri dari dua bagian utama:
1.  **Frontend (Client-Side):** Dibangun dengan React, Vite, dan TypeScript untuk antarmuka pengguna yang modern dan interaktif.
2.  **Backend (Server-Side):** Sebuah API server yang dibangun dengan Node.js, Express, dan Prisma ORM untuk mengelola data dan logika bisnis.

---

## Analisis & Rekomendasi Kode

Berdasarkan analisis, proyek ini memiliki fondasi yang sangat kuat dengan beberapa area yang dapat ditingkatkan.

### ✅ Kekuatan Utama

*   **Tumpukan Teknologi Modern:** Penggunaan React, Vite, TypeScript, Node.js, dan Prisma adalah pilihan yang sangat baik, memastikan performa, skalabilitas, dan kemudahan pengembangan.
*   **Struktur Proyek yang Baik:** Kode di kedua sisi (frontend dan backend) tertata dengan rapi, memisahkan concerns (UI, logika, layanan, akses data), yang membuatnya lebih mudah dipelihara.
*   **Model Data yang Solid:** Skema database yang didefinisikan dalam `prisma/schema.prisma` sangat komprehensif dan dirancang dengan baik, yang merupakan inti dari keandalan aplikasi.
*   **Keamanan Backend yang Baik:** Implementasi otentikasi berbasis JWT dan otorisasi berbasis peran di backend sudah mengikuti praktik terbaik.

### ❗ Rekomendasi Perbaikan

Berikut adalah beberapa rekomendasi untuk meningkatkan kualitas dan keamanan kode:

1.  **Hapus Dependensi Frontend yang Tidak Perlu (Keamanan & Performa)**
    *   **Masalah:** `package.json` di frontend menyertakan `bcrypt` dan `jsonwebtoken`. Meskipun tidak digunakan, keberadaan dependensi ini bisa menyesatkan dan menambah "bloat" pada proyek. `bcrypt` khususnya tidak boleh dijalankan di sisi klien.
    *   **Solusi:** Hapus kedua dependensi tersebut dari `package.json` frontend.
        ```bash
        npm uninstall bcrypt jsonwebtoken
        ```

2.  **Perbaiki Bug Otorisasi di Backend**
    *   **Masalah:** Terdapat potensi salah ketik pada nama peran di middleware `requireAdminKompetisi` (`pemuda-berprestasi-mvp/src/middleware/auth.ts`). Kode saat ini menggunakan `'ADMINKOMPETISI'`, yang kemungkinan besar seharusnya `'ADMIN_KOMPETISI'` agar konsisten dengan definisi di database dan token.
    *   **Solusi:** Ubah `ADMINKOMPETISI` menjadi `ADMIN_KOMPETISI` di file `pemuda-berprestasi-mvp/src/middleware/auth.ts` pada baris 71.
        ```typescript
        // Before
        if (req.user.role !== 'ADMINKOMPETISI' || !req.user.adminKompetisiId) { ... }

        // After
        if (req.user.role !== 'ADMIN_KOMPETISI' || !req.user.adminKompetisiId) { ... }
        ```

3.  **Tambahkan Pengujian Otomatis (Kualitas Jangka Panjang)**
    *   **Masalah:** Proyek ini belum memiliki kerangka kerja pengujian (seperti Jest, Vitest, atau Cypress). Tanpa pengujian otomatis, sulit untuk memastikan bahwa fitur baru tidak merusak fungsionalitas yang sudah ada.
    *   **Solusi:** Pertimbangkan untuk menambahkan:
        *   **Unit Tests:** Untuk fungsi-fungsi utilitas dan logika bisnis murni.
        *   **Integration Tests:** Untuk menguji alur API di backend.
        *   **End-to-End (E2E) Tests:** Untuk mensimulasikan alur pengguna di frontend.

---

## Panduan Memulai

### Prasyarat

*   Node.js (v18 atau lebih baru direkomendasikan)
*   NPM / PNPM / Yarn
*   Database (misalnya PostgreSQL, MySQL) yang berjalan dan dapat diakses.

### 1. Setup Backend (`pemuda-berprestasi-mvp`)

1.  **Masuk ke direktori backend:**
    ```bash
    cd pemuda-berprestasi-mvp
    ```

2.  **Install dependensi:**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment:**
    *   Salin file `.env.example` menjadi `.env`.
    *   Sesuaikan isinya, terutama `DATABASE_URL` untuk terhubung ke database Anda.
    ```
    # Example for PostgreSQL
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
    ```

4.  **Migrasi Database:** Terapkan skema database menggunakan Prisma.
    ```bash
    npx prisma migrate dev
    ```
    *(Opsional) Jika perlu, jalankan seeder untuk mengisi data awal:*
    ```bash
    npx prisma db seed
    ```

5.  **Jalankan server backend:**
    ```bash
    npm run dev
    ```
    Server akan berjalan di port yang ditentukan di file `.env` Anda (default: 5000).

### 2. Setup Frontend

1.  **Kembali ke direktori root proyek.**

2.  **Install dependensi:**
    ```bash
    npm install
    ```

3.  **Konfigurasi Environment:**
    *   Buat file `.env` di root proyek.
    *   Atur variabel `VITE_API_URL` agar menunjuk ke alamat server backend Anda.
    ```
    VITE_API_URL=http://localhost:5000
    ```

4.  **Jalankan server development frontend:**
    ```bash
    npm run dev
    ```
    Aplikasi frontend akan tersedia di `http://localhost:5173` (atau port lain yang tersedia).

---

## Opsi Migrasi Backend (Untuk Shared Hosting)

Stack saat ini (Node.js + Express + Prisma) sangat modern, namun **Prisma** bisa menjadi terlalu berat untuk lingkungan *shared hosting* karena penggunaan memori dari *query engine*-nya. Jika Anda perlu melakukan deploy ke shared hosting, pertimbangkan alternatif berikut:

### Opsi 1: Tetap di Ekosistem Node.js (Perubahan Minimal)

Jalur ini direkomendasikan jika Anda ingin tetap menggunakan TypeScript dan memanfaatkan kembali sebagian besar logika bisnis yang ada.

*   **Stack Rekomendasi:** **Node.js + Fastify + Kysely**
*   **Alasan:**
    *   **Fastify:** Framework yang lebih cepat dan ringan dari Express.
    *   **Kysely:** Pengganti Prisma yang ideal. Kysely adalah *type-safe query builder* yang sangat ringan karena tidak menjalankan proses terpisah. Ini memberikan keamanan tipe seperti Prisma dengan jejak memori yang jauh lebih kecil.

### Opsi 2: Pindah ke PHP + Laravel (Paling Praktis untuk Shared Hosting)

Ini adalah solusi paling teruji dan stabil untuk lingkungan shared hosting.

*   **Stack Rekomendasi:** **PHP + Laravel**
*   **Alasan:**
    *   **Dioptimalkan untuk Shared Hosting:** PHP adalah bahasa "asli" untuk shared hosting.
    *   **Ekosistem Matang:** Laravel adalah framework "all-in-one" yang sudah mencakup ORM (Eloquent), routing, otentikasi, dan semua yang Anda butuhkan dengan cara yang efisien dan didukung dengan baik.

### Opsi 3: Pindah ke Go / Golang (Performa Maksimal)

Pilih jalur ini jika tujuan utamanya adalah performa terbaik dan penggunaan sumber daya paling minimal.

*   **Stack Rekomendasi:** **Go + Gin + SQLC**
*   **Alasan:**
    *   **Single Binary:** Aplikasi Go dikompilasi menjadi satu file binary kecil tanpa dependensi, membuatnya super cepat dan sangat hemat memori.
    *   **Deployment Mudah:** Cukup unggah dan jalankan satu file.

### Kesimpulan Rekomendasi Migrasi

*   **Paling Praktis:** **PHP + Laravel** adalah pilihan paling aman dan stabil untuk shared hosting.
*   **Perubahan Terkecil:** **Node.js + Fastify + Kysely** adalah pilihan terbaik jika Anda ingin tetap di ekosistem JavaScript/TypeScript.
