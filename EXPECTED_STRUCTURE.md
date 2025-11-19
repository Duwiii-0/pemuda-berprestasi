# Struktur Direktori Proyek (Setelah Migrasi)

Dokumen ini menggambarkan struktur direktori akhir yang ideal untuk proyek "Pemuda Berprestasi" setelah backend dimigrasikan ke Laravel.

Struktur ini memisahkan secara jelas antara aplikasi frontend (React) dan backend (Laravel) untuk mempermudah pengelolaan, pengembangan, dan deployment.

```
pemuda-berprestasi/
├───frontend/
│   ├───public/
│   ├───src/
│   │   ├───assets/
│   │   ├───components/
│   │   ├───context/
│   │   ├───layouts/
│   │   ├───pages/
│   │   └───// ... file dan folder frontend lainnya
│   ├───package.json
│   ├───vite.config.ts
│   ├───tsconfig.json
│   └───// ... file konfigurasi frontend lainnya
│
└───backend/  (Aplikasi Laravel Baru)
    ├───app/
    │   ├───Http/
    │   │   ├───Controllers/
    │   │   │   ├───AtletController.php
    │   │   │   ├───Auth/
    │   │   │   │   └───LoginController.php
    │   │   │   ├───DojangController.php
    │   │   │   └───// ... Controller lainnya
    │   │   ├───Middleware/
    │   │   │   └───// ... Middleware kustom Anda
    │   │   └───Requests/
    │   │       ├───StoreAtletRequest.php
    │   │       └───UpdateAtletRequest.php
    │   ├───Models/
    │   │   ├───Akun.php
    │   │   ├───Atlet.php
    │   │   ├───Dojang.php
    │   │   ├───Kompetisi.php
    │   │   ├───Pelatih.php
    │   │   └───// ... Semua model Eloquent Anda
    │   ├───Providers/
    │   └───Services/  (Direktori kustom untuk logika bisnis)
    │       ├───AtletService.php
    │       └───KompetisiService.php
    ├───bootstrap/
    ├───config/
    │   ├───app.php
    │   ├───database.php
    │   └───sanctum.php
    ├───database/
    │   ├───migrations/
    │   │   ├───2025_01_01_000001_create_tb_akun_table.php
    │   │   ├───2025_01_01_000002_create_tb_dojang_table.php
    │   │   ├───2025_01_01_000003_create_tb_pelatih_table.php
    │   │   ├───2025_01_01_000004_create_tb_atlet_table.php
    │   │   └───// ... Semua file migrasi dari schema.prisma
    │   └───seeders/
    │       └───DatabaseSeeder.php
    ├───public/
    │   └───index.php
    ├───routes/
    │   ├───api.php  (Semua rute API Anda akan ada di sini)
    │   └───web.php
    ├───storage/
    │   ├───app/
    │   │   └───public/
    │   │       ├───atlet/
    │   │       │   ├───akte_kelahiran/
    │   │       │   └───pas_foto/
    │   │       └───// ... folder untuk file upload
    │   ├───framework/
    │   └───logs/
    │       └───laravel.log
    ├───tests/
    ├───.env          (File konfigurasi utama untuk backend)
    ├───composer.json (Pengganti package.json untuk backend)
    └───artisan       (Command-line tool untuk Laravel)
```

### Penjelasan Struktur Baru:

*   **Pemisahan Total:** `frontend/` dan `backend/` adalah dua aplikasi yang benar-benar terpisah. Anda akan menjalankan `npm run dev` di dalam `frontend/` dan `php artisan serve` di dalam `backend/`.
*   **Frontend Tetap Sama:** Semua kode React Anda hanya dipindahkan ke dalam folder `frontend/` tanpa perubahan logika.
*   **Backend Terstruktur:** Folder `backend/` mengikuti standar struktur direktori Laravel yang sudah terbukti, membuat kode lebih terorganisir dan mudah dipahami oleh developer Laravel lainnya.
