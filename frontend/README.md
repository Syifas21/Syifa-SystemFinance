# Frontend Monorepo miniERP

Struktur modular untuk pengembangan microfrontend ERP.

## Struktur

- `apps/` : Folder untuk setiap modul/service frontend
- `shared/` : Library bersama (komponen, hooks, utils, dll)
- `tsconfig.base.json` : Base TypeScript config
- `.eslintrc.json` : Konfigurasi linting
- `.prettierrc` : Konfigurasi formatting

## Cara Kerja Tim & Pengembangan

### 1. Bagi Tugas per Modul
- Setiap anggota tim ambil satu modul di `apps/` (misal: crm-frontend, hr-frontend, dll).
- Kerja di folder modul masing-masing, tidak saling ganggu.

### 2. Instalasi Dependency
- Dari root project, jalankan:
	```
	npm install
	```
	Ini akan menginstal semua dependency di semua modul sekaligus.

### 3. Jalankan Modul
- Masuk ke folder modul yang ingin dikembangkan, misal:
	```
	cd frontend/apps/crm-frontend
	npm run dev
	```
- Akses di browser sesuai port yang diatur di `vite.config.ts` (misal: http://localhost:3010).

### 4. Pengembangan
- Tambahkan komponen, halaman, hooks, dll di folder `src` masing-masing modul.
- Untuk halaman baru, buat file di `src/pages` dan tambahkan routing di `App.tsx`.
- Jika butuh komponen atau utilitas bersama, import dari `shared/`.

### 5. Konsistensi Kode
- Ikuti style guide lint dan prettier yang sudah disiapkan di root.
- Extend `tsconfig.base.json` di setiap modul agar konfigurasi TypeScript konsisten.

### 6. Kolaborasi
- Gunakan git untuk versioning dan kolaborasi.
- Lakukan code review sebelum merge ke branch utama.

---

Struktur ini memudahkan tim untuk scaling, kolaborasi, dan pengembangan frontend ERP secara modular.
