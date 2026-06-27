# Toko Emas — Gold Shop Management System

## Stack

- **Backend:** Laravel 13 (PHP), MySQL, Sanctum auth
- **Frontend:** React 19 + Vite 8 + Tailwind CSS 4 + Zustand
- **Package manager:** Bun (preferred), npm sebagai fallback
- **OS dev:** Windows 11

## Menjalankan Aplikasi

```bash
# Terminal 1 — Laravel
php artisan serve

# Terminal 2 — Vite
bun run dev
```

Akses di `http://localhost:8000`. Login: `tokoemas` / `tokoemas` (Super Admin, branch Jakarta).

## Struktur Direktori Penting

```
app/
  Http/Controllers/          # Semua controller (PembelianController, TSalesController, dll)
  Http/Requests/             # Form request validation
  Helpers/                   # Enum: InventoryStatus, PembelianStatus, SalesStatus, FinancePaymentMethod, dll
  Models/                    # Eloquent models

resources/js/
  pages/                     # Halaman React per modul
    Inventory/               # Pembelian, StockOpname, Remove, InRepair, Transfer, MasterKategori, MasterProduk
    Approval/                # ApprovalPembelian, ApprovalPenjualan, ApprovalRemoveItem, ApprovalTransfer
    Penjualan/               # Input penjualan + kwitansi
    Finance/                 # Transaksi finance (CASH IN / CASH OUT)
    Report/                  # Report: Finance, Pembelian, Penjualan, Inventory, Customer
    administrator/           # User, Cabang, Setting, MasterBank, Supplier, Customer, MasterCategoryFinance
    Dashboard/
  components/                # Reusable: Table, Badge, SectionCard, ApprovalStatusCard, ActionButton, dll
  Services/                  # API wrappers (Inventory.apis.js, Finance.apis.js, Report.apis.js, dll)
  Store/                     # Zustand stores: AuthStore, PermissionStore, OptionsStore, LoadingStore
  utils/                     # HelperFunctions, Apis.js (axios instance), barcode, showAlert
  router/                    # React Router config (inventory.jsx, approval.jsx, report.jsx)

routes/api.php               # Semua API routes
database/migrations/          # Schema definitions
database/seeders/             # DatabaseSeeder.php — seed master data
```

## Konvensi & Aturan

### Backend (BE)

- Semua response API wrapped dalam `ApiResponse::success()` / `ApiResponse::error()`
- Enum values di DB harus EXACT MATCH dengan PHP enum dan FE constants:
  - Finance `payment_method`: ENUM `('TUNAI', 'TRANSFER')` — **BUKAN** `CASH`
  - Sales `payment_type`: `TUNAI` | `TRANSFER`
  - Inventory `status`: `AVAILABLE` | `TRANSIT` | `SOLD` | `REPAIR` | `LOST`
  - Pembelian `status`: `APPROVAL` | `DISETUJUI` | `DITOLAK` | `DIBATALKAN`
  - Remove Item `status`: `APPROVAL` | `DISETUJUI` | `DITOLAK` | `DIBATALKAN` | `RETURN`
  - Transfer Item `status`: `APPROVAL` | `DISETUJUI` | `DITOLAK` | `DIBATALKAN`
  - Sales `approval_status`: `APPROVAL` | `DISETUJUI` | `CETAK KWITANSI` | `DITOLAK` | `DIBATALKAN` | `SELESAI`
- Jangan tambah field baru di tabel kecuali benar-benar diperlukan
- Eager load relasi nested saat detail endpoint (contoh: `details.inventory.category.parent`, `details.inventory.subCategory`)
- Pembelian model: relasi `bankCabang()` → `BankCabang` (bukan `MBank`), FK = `bank_cabang_id`
- Produk: `category_id` = parent category, `subcategory_id` = sub category (jangan keduanya sama)

### Frontend (FE)

- FE mengikuti konvensi enum BE — kalau BE pakai `TUNAI`, FE juga `TUNAI`
- Section title di modal/card: konsisten `text-sm font-semibold text-neutral-900` + indicator bar `w-1 h-4 rounded-full`
  - Komponen: `SectionCard`, `SectionTitle`, `ApprovalStatusCard` sudah di-standardize
  - Jangan pakai `font-bold` atau `text-lg` untuk section title
- Status badge:
  - `Approval` → tone `warning` (kuning)
  - `Disetujui` → tone `success` (hijau)
  - `Ditolak` / `Dibatalkan` → tone `danger` (merah)
  - `Return` → tone `info` (biru)
- Approval card di detail modal: PIC selalu hardcode `'Owner'` kecuali `DIBATALKAN` (tampilkan user yang membatalkan)
- Penjualan approval: cukup sampai "Disetujui" saja di section Approval, tidak perlu "siap cetak kwitansi"
- Customer badge: gunakan `customer.sales_count` dari API (via `withCount('sales')`)
  - `sales_count > 1` → "Member Terdaftar"
  - `sales_count <= 1` → "Customer Baru"
- Auto refresh setelah form submit: gunakan `key` prop + `refreshKey` state di Page component
- Bank info display path: `data?.bank_cabang?.bank?.bank_name` + `bank_cabang?.nomor_rekening`

## Roles & Permissions

| Role | ID | Akses |
|---|---|---|
| Super Admin | 1 | Semua fitur |
| Owner | 2 | Approval, report, master data, finance |
| PIC | 3 | Inventory CRUD, stock opname, approval terbatas |
| Kasir | 4 | Pembelian, penjualan, terbatas ke cabang sendiri |

Kasir otomatis filter by `user.branch_id`. Permission check via `PermissionStore.can(action, permissionKey)`.

## Flow Bisnis Utama

### Pembelian → Inventory
1. Kasir input pembelian (batch items) → status `APPROVAL`
2. Owner approve → status `DISETUJUI` → otomatis create `Inventory` (AVAILABLE) + `Finance` (CASH OUT)
3. Inventory code format: `{product_barcode}-{sequence 4 digit}`

### Penjualan
1. Kasir input penjualan (pilih inventory items + customer) → status `APPROVAL`
2. Owner approve → `DISETUJUI`
3. Cetak kwitansi → `CETAK KWITANSI` → inventory jadi `SOLD` + Finance `CASH IN`

### Transfer Item
1. Input transfer (branch source → branch dest, pilih items) → inventory jadi `TRANSIT`
2. Approve → inventory pindah branch (`branch_id` updated, status `AVAILABLE`)
3. Tolak/Batalkan → inventory kembali `AVAILABLE` di branch asal

### Remove Item (Hilang / Repair)
1. Input remove (jenis: `HILANG` atau `REPAIR`) → status `APPROVAL`
2. Approve:
   - `HILANG` → inventory `LOST`
   - `REPAIR` → inventory `REPAIR`
3. `RETURN` → inventory kembali `AVAILABLE`
4. Tolak → inventory tetap `AVAILABLE`

### Stock Opname
1. Scan/input kode inventory per cabang
2. Kode ditemukan di cabang → `INSTOCK`
3. Kode dari cabang lain → `EXTRA` (wajib isi catatan)
4. Kode tidak di-scan → `MISSING` (otomatis saat finalisasi)
5. Status header: `SESUAI` jika in_stock == total_item, else `SELISIH`

### Finance
- Modal awal: manual input via Finance (CASH IN, kategori "Uang Awal")
- Pembelian approve: otomatis CASH OUT
- Penjualan cetak kwitansi: otomatis CASH IN
- Metode: `TUNAI` (kas laci) atau `TRANSFER` (bank cabang)

## Bug yang Sudah Di-fix (Referensi)

- `Pembelian.php` fillable typo `bank_cabank_id` → `bank_cabang_id`
- `Pembelian.php` relasi `bankCabang()` → `BankCabang` (bukan `MBank`)
- `PembelianController` search: `whereHas('product.product_name')` → `whereHas('product')`
- `FinanceReportController` SQL hardcode `'CASH'` → `'TUNAI'`
- `FinanceReportController` opening balance: operator `=<` → `<`, + saldo awal = 0 saat semua periode
- `TSalesController` cetak kwitansi: `$data->branch->bankcabang->id` crash → `$data->receiver_bank_id`
- Migration `remove_items` status enum typo `DITOALK` → `DITOLAK`
- Migration `finances` payment_method harus `['TUNAI', 'TRANSFER']` bukan `['CASH', 'TRANSFER']`

## Script Test

Semua script test ada di `docs/testing/` (dijalankan dari root project). Lihat `docs/testing/README.md` untuk detail.

- `docs/testing/run-full-scenario.mjs` — Skenario lengkap: modal awal, pembelian, approval, customer baru, penjualan, stock opname
- `docs/testing/run-inventory-scenario.mjs` — Skenario inventory: transfer, remove (hilang/repair), return, stock opname
- `docs/testing/generate-test-report.mjs` — Generate Excel report QA (`QA_TEST_REPORT.xlsx`)
- `docs/testing/_backtest.mjs` — Backtest flow + rekonsiliasi uang & stok (60 assertion)

Jalankan dengan `bun run docs/testing/<script>.mjs`. Token auth mungkin perlu di-refresh (login ulang via API).
