# Finance Frontend - Chart of Accounts (COA)

Aplikasi frontend modern untuk mengelola Chart of Accounts (COA) dalam sistem miniERP.

## 🚀 Fitur

### ✨ Fitur Utama
- **CRUD Operations**: Create, Read, Update, Delete akun dengan mudah
- **Search & Filter**: Pencarian real-time dan filter berdasarkan tipe akun
- **Pagination**: Tampilan data dengan pagination yang responsif
- **Export Data**: Export data ke format CSV atau JSON
- **Toast Notifications**: Notifikasi yang informatif untuk setiap aksi
- **Confirmation Dialog**: Konfirmasi sebelum menghapus data
- **Form Validation**: Validasi input form yang komprehensif
- **Responsive Design**: Tampilan optimal di semua ukuran layar

### 🎨 UI/UX Features
- Modern dan clean interface dengan Tailwind CSS
- Smooth animations dan transitions
- Loading states yang informatif
- Empty states yang menarik
- Color-coded account type badges
- Hover effects dan interactive elements

## 📋 Account Types

Aplikasi mendukung 5 tipe akun:
1. **Asset** (Aset) - Biru
2. **Liability** (Kewajiban) - Merah
3. **Equity** (Ekuitas) - Hijau
4. **Revenue** (Pendapatan) - Kuning
5. **Expense** (Beban) - Ungu

## 🛠️ Teknologi

- **React 18** - UI Library
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Heroicons** - Icons
- **React Router** - Routing
- **Vite** - Build Tool

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Environment Variables

Buat file `.env` di root folder:

```env
VITE_API_BASE_URL=http://localhost:3001
```

### API Endpoints

API endpoint default: `http://localhost:3001/api/chart-of-accounts`

Endpoints yang digunakan:
- `GET /` - Get all accounts
- `GET /:id` - Get account by ID
- `POST /` - Create new account
- `PUT /:id` - Update account
- `DELETE /:id` - Delete account

## 📱 Usage

### Menambah Akun Baru
1. Klik tombol **"Tambah Akun"**
2. Isi form:
   - Kode Akun (wajib, min. 3 karakter)
   - Nama Akun (wajib, min. 3 karakter)
   - Tipe Akun (pilih dari dropdown)
   - Deskripsi (opsional)
3. Klik **"Simpan"**

### Mengedit Akun
1. Klik tombol **"Edit"** pada baris akun
2. Ubah data yang diperlukan
3. Klik **"Perbarui"**

### Menghapus Akun
1. Klik tombol **"Hapus"** pada baris akun
2. Konfirmasi penghapusan
3. Data akan terhapus dari database

### Mencari Akun
- Gunakan search box untuk mencari berdasarkan:
  - Kode akun
  - Nama akun
  - Deskripsi

### Filter Akun
- Pilih tipe akun dari dropdown filter
- Combine dengan pencarian untuk hasil lebih spesifik

### Export Data
1. Klik tombol **"Export"**
2. Pilih format:
   - **CSV** - Untuk Excel/Spreadsheet
   - **JSON** - Untuk backup/import

## 🎯 Best Practices

### Kode Akun
- Gunakan sistem penomoran yang konsisten
- Contoh:
  - 1xxx - Aset
  - 2xxx - Kewajiban
  - 3xxx - Ekuitas
  - 4xxx - Pendapatan
  - 5xxx - Beban

### Penamaan
- Gunakan nama yang jelas dan deskriptif
- Hindari singkatan yang tidak umum
- Konsisten dengan standar akuntansi

## 🔐 Integration

### Backend Integration

Aplikasi ini terintegrasi dengan finance-service backend. Pastikan:

1. Finance service sudah running
2. Database sudah ter-setup
3. CORS sudah dikonfigurasi dengan benar

### Authentication

Aplikasi menggunakan token-based authentication:
- Token disimpan di localStorage
- Dikirim via Authorization header
- Format: `Bearer <token>`

## 📊 Data Structure

```typescript
interface ChartOfAccount {
  id: number;
  account_code: string;
  account_name: string;
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  description?: string | null;
  created_at: string;
  updated_at: string;
}
```

## 🐛 Troubleshooting

### API Connection Issues
- Pastikan backend service running
- Check `VITE_API_BASE_URL` di `.env`
- Verify CORS configuration

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Type Errors
```bash
# Run type check
npm run type-check
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

Internal use only - miniERP Project

## 👥 Authors

- Finance Team - miniERP

## 📞 Support

Untuk bantuan, hubungi tim development atau buat issue di repository.
