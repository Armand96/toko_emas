# QA Report — Semua Page + Flow Frontend (Toko Emas)

## Context
QA review menyeluruh: (1) semua halaman frontend, (2) flow Pembelian → Approval → Inventory, (3) worst-case scenarios. Ditemukan banyak bug. Semua fix hanya di FE (BE dikerjakan Armand).

---

## BAGIAN A — BUGS DI SEMUA PAGE

### CRITICAL — Fitur Tidak Jalan / Data Salah

**C1. `ModalAddBank` — Error key salah, saling overwrite**
File: `resources/js/pages/administrator/Branch/ModalAddBank.jsx:42-43`
- `errors.account_number` dipakai untuk 2 field → error tidak tampil di field yang benar
- Fix: ganti ke `errors.nomor_rekening` dan `errors.nama_pemilik`

**C2. `ModalMasterBank` — disableButton cek `category_name`, padahal field `bank_code`/`bank_name`**
File: `resources/js/pages/administrator/MasterBank/Modal.jsx:32`
- Tombol submit selalu disabled
- Fix: `if (!formData?.bank_code || !formData?.bank_name) return true;`

**C3. `ModalBranch` — disableButton cek `open_date`, field-nya `branch_open_date`**
File: `resources/js/pages/administrator/Branch/Modal.jsx:119`
- Tombol submit selalu disabled
- Fix: `!formData?.branch_open_date`

**C4. `ModalStoreSettings` — disableButton cek `nama_toko`, field-nya `shop_name`**
File: `resources/js/pages/administrator/Store/Modal.jsx:47`
- Tombol submit selalu disabled
- Fix: `!formData?.shop_name`

**C5. `Inventory/Page.jsx` — `no_seri` mapping ke `note` bukan `serial_number`**
File: `resources/js/pages/Inventory/Inventory/Page.jsx:253,266`
- Saat edit, field No.Seri menampilkan note bukan serial number
- Fix: `detail.serial_number ?? row.serial_number ?? ""`

### HIGH — Pagination Rusak / Data Hilang

**H1. `&limit=` tidak dikenali backend — harusnya `&per_page=`**
Backend semua controller pakai `$request->input('per_page', 10)`. Tapi 9 halaman FE kirim `&limit=`:
- `Inventory/MasterProduk/Page.jsx:58`
- `Inventory/Inventory/Page.jsx:162`
- `Inventory/MasterKategori/Page.jsx:42`
- `Inventory/Pembelian/Main.jsx:50`
- `Approval/ApprovalPembelian/Page.jsx:46`
- `administrator/user/Page.jsx:46`
- `administrator/Branch/Page.jsx:51`
- `administrator/MasterBank/Page.jsx:33`
- `administrator/Supplier/Page.jsx:36`

Fix: Ganti semua `&limit=` → `&per_page=` di query string

**H2. Admin pages — `paramFetch` initial state pakai `page`/`pageSize`, API return `current_page`/`per_page`**
Setelah first API call, `paramFetch.pageSize` → undefined → pagination reset ke default.

Pages affected (pattern `{ data: [], page: 1, total: 0, pageSize: 10 }`):
- `administrator/user/Page.jsx:21`
- `administrator/Customer/Page.jsx:18`
- `administrator/Supplier/Page.jsx:19`
- `administrator/MasterBank/Page.jsx:17`
- `administrator/MasterCategoryFinance/Page.jsx:16`

Fix: Ganti initial state ke `{ data: [], current_page: 1, total: 0, per_page: 10 }`, semua `paramFetch.pageSize` → `paramFetch.per_page`

**H3. `MasterProduk/Page.jsx` — Table props salah**
File: `resources/js/pages/Inventory/MasterProduk/Page.jsx:69,112,271-272`
- `currentPage={paramFetch.page}` — Table expects `page`, dan `paramFetch.page` undefined (state punya `current_page`)
- `paramFetch.pageSize` undefined setelah API call
- Fix: `page={paramFetch.current_page}`, `pageSize={paramFetch.per_page}`, semua `paramFetch.pageSize` → `paramFetch.per_page`

**H4. Input berat/karat izinkan multiple dots → NaN**
Files: `Inventory/Inventory/Page.jsx:293` + `Inventory/Pembelian/FormAdd.jsx:153`
- `"1.2.3"` lolos → `Number("1.2.3")` = NaN
- Fix: Tambah `.replace(/\.(?=.*\.)/g, "")`

### MEDIUM

**M1. `MasterKategori/Modal.jsx` — Field "Deskripsi" duplikat (text + textArea)**
File: `resources/js/pages/Inventory/MasterKategori/Modal.jsx:31-46`
- Fix: Hapus yang `type: "text"` (line 31-38)

**M2. Console.log tersisa (hapus semua):**
| File | Line |
|------|------|
| `administrator/user/Page.jsx` | 71 |
| `administrator/Branch/Modal.jsx` | 129 |
| `administrator/Store/Page.jsx` | 28 |
| `Inventory/MasterProduk/Page.jsx` | 92, 147 |
| `Penjualan/PrintKwitansi.jsx` | 48 |

**M3. `Report/Finance/Page.jsx` — Export button tanpa onClick**
File: line 357-362. Fix: Tambah `disabled` + `opacity-50 cursor-not-allowed`

---

## BAGIAN B — BUGS DI FLOW PEMBELIAN → APPROVAL → INVENTORY

### CRITICAL

**F1. Pembelian FormAdd — `no_seri` TIDAK dikirim ke API**
File: `resources/js/pages/Inventory/Pembelian/FormAdd.jsx:228-243`
- User mengisi No.Seri di form, tapi field ini tidak ada di payload yang dikirim
- Data serial number hilang sepenuhnya
- Fix: Tambah `note: b.no_seri || null` di payload map

### NOTED (Backend — untuk Armand)

**F2. Penjualan FormAdd vs ModalView — field name mismatch**
- FormAdd kirim `sender_bank_name` (line 262)
- ModalView baca `data.sender_name` (line 153)
- Perlu cek apakah BE menyimpan/return dengan nama yang sama

**F3. `&limit=` di Pembelian/Main.jsx dan ApprovalPembelian/Page.jsx**
- Sudah termasuk di H1 di atas — backend ignore `limit`, selalu return 10 per page

---

## BAGIAN C — WORST-CASE SCENARIOS

### CRITICAL — Bisa Sebabkan Kerugian Finansial / Data Korup

**W1. Print Kwitansi — Quantity hardcode "1" untuk semua item**
File: `resources/js/pages/Penjualan/PrintKwitansi.jsx:143`
- Kolom "BANYAKNYA" di faktur cetak selalu menampilkan `1`, bukan jumlah sebenarnya
- Secara bisnis, setiap row memang 1 item unik (emas per potong), jadi ini mungkin benar
- **Tapi jika ada case jual 2 item identik**, faktur tampil seolah cuma 1
- **Status: VERIFY** — cek apakah bisnis logic memang 1 item = 1 row. Jika ya, tidak perlu fix.

**W2. Remove Item — `branch_id` dan `user_id` default ke `1` jika user null**
File: `resources/js/pages/Inventory/Remove/FormAdd.jsx:104-105`
```javascript
branch_id: user?.branch_id || 1,  // fallback ke branch 1!
user_id: user?.id || 1,           // fallback ke user 1!
```
- Jika `user` state kosong (race condition saat load), item di-remove dari Branch 1 dan diattribusi ke User 1
- Audit trail korup — item hilang dari cabang yang salah
- Fix: Tambah guard `if (!user?.branch_id || !user?.id) return showAlert error`

**W3. Remove Item — Scan barcode tidak filter branch (Kasir bisa remove item cabang lain)**
File: `resources/js/pages/Inventory/Remove/FormAdd.jsx:73`
```javascript
const res = await InventoryApis.GetInventory(`?inventory_code=${scannedCode}`);
// TIDAK ADA &branch_id= filter!
```
- Dropdown inventory sudah di-filter branch (line 28-29), tapi **scan barcode bypass filter**
- Kasir di Branch A bisa scan kode item Branch B → item Branch B ter-remove
- Fix: Tambah `&branch_id=${user?.branch_id}` di scan query (kalau isKasir)

**W4. Print routes TIDAK dilindungi ProtectedRoute**
File: `resources/js/router/index.jsx:34-36`
```javascript
// PUBLIC (print)
{ path: "/inventory/print-barcode", element: <PrintBarcode /> },
{ path: "/penjualan/print-kwitansi", element: <PrintKwitansi /> },
```
- Siapa saja bisa akses `/penjualan/print-kwitansi` tanpa login
- Data diambil dari sessionStorage, jadi impact terbatas — tapi seharusnya tetap dilindungi
- Fix: Pindahkan ke dalam `ProtectedRoute` children

### HIGH — Double Submit / Race Condition

**W5. Approval Pembelian — Tombol approve/reject tidak disabled saat loading**
File: `resources/js/pages/Approval/ApprovalPembelian/Page.jsx:134-164`
- `confirmApprove()` / `confirmReject()` via showAlert → `.then()` → `updateStatus()`
- Selama `updateStatus` berjalan, user bisa buka modal lagi dan klik approve lagi
- `setLoading(true)` hanya disable UI global, tapi showAlert masih bisa muncul
- Fix: Tambah flag `isProcessing` dan disable action buttons saat proses berjalan

**W6. Finance Page — `handleSubmit` success inside setTimeout, error handling inconsisten**
File: `resources/js/pages/Finance/Page.jsx:128-156`
```javascript
// Success path: di dalam setTimeout (line 145-150)
setTimeout(() => {
    handleCloseModal();
    fetchData(...);
    showAlert({...success...});
    setLoading(false)    // ← setLoading di setTimeout
}, 300)
// Error path: langsung (line 152-155)
} catch (error) {
    showAlert({...error...});
    setLoading(false)    // ← tapi TIDAK ada finally!
}
```
- Jika error terjadi SETELAH API call tapi SEBELUM setTimeout → loading stuck forever
- `finally` block tidak ada → edge case loading tidak pernah di-reset

### MEDIUM — Data Integrity

**W7. Transfer — Tidak ada validasi cabang_tujuan ≠ cabang asal di FE**
File: `resources/js/pages/Inventory/transfer/FormAdd.jsx:107-113`
- Dropdown sudah di-filter (line 32-34) jadi cabang asal tidak muncul di pilihan
- Tapi jika user manipulasi DOM/devtools, bisa set `cabang_tujuan` = `branch_source_id`
- Backend seharusnya handle ini, tapi defense-in-depth bagus
- **Status: LOW PRIORITY** — dropdown filter sudah cukup untuk normal use

**W8. Penjualan FormAdd — Submit sudah ada `disabled={!isFormValid || submitting}` ✓**
File: `resources/js/pages/Penjualan/FormAdd.jsx:599`
- Button disable + `submitting` flag sudah ada → double-submit sudah ditangani
- **Status: OK — TIDAK perlu fix**

### NOTED (Backend / Desain — untuk Armand)

**W9. Approval stale data** — Jika 2 approver buka halaman sama, User A approve, User B masih lihat status lama di cache-nya. Backend harus handle status check.

**W10. InRepair return tanpa verifikasi repair selesai** — `handleReturn()` langsung update status RETURN tanpa bukti repair selesai. Ini keputusan bisnis/backend.

**W11. StockOpname extra item** — Item "EXTRA" (tidak ada di sistem) hanya bisa di-scan 1x per kode. Jika ada multiple extra items dengan kode sama, hanya 1 yang tercatat. Ini desain decision.

---

## EXECUTION PLAN (FE Only)

### Step 1 — Fix Critical Modal Validation (C1-C4)
Files:
- `resources/js/pages/administrator/Branch/ModalAddBank.jsx`
- `resources/js/pages/administrator/MasterBank/Modal.jsx`
- `resources/js/pages/administrator/Branch/Modal.jsx`
- `resources/js/pages/administrator/Store/Modal.jsx`

### Step 2 — Fix Inventory no_seri Mapping (C5)
Files:
- `resources/js/pages/Inventory/Inventory/Page.jsx`

### Step 3 — Fix Pembelian no_seri Payload (F1)
Files:
- `resources/js/pages/Inventory/Pembelian/FormAdd.jsx`

### Step 4 — Fix `limit` → `per_page` (H1)
Files:
- `resources/js/pages/Inventory/MasterProduk/Page.jsx`
- `resources/js/pages/Inventory/Inventory/Page.jsx`
- `resources/js/pages/Inventory/MasterKategori/Page.jsx`
- `resources/js/pages/Inventory/Pembelian/Main.jsx`
- `resources/js/pages/Approval/ApprovalPembelian/Page.jsx`
- `resources/js/pages/administrator/user/Page.jsx`
- `resources/js/pages/administrator/Branch/Page.jsx`
- `resources/js/pages/administrator/MasterBank/Page.jsx`
- `resources/js/pages/administrator/Supplier/Page.jsx`

### Step 5 — Fix Pagination State Mismatch (H2, H3)
Files:
- `resources/js/pages/administrator/user/Page.jsx`
- `resources/js/pages/administrator/Customer/Page.jsx`
- `resources/js/pages/administrator/Supplier/Page.jsx`
- `resources/js/pages/administrator/MasterBank/Page.jsx`
- `resources/js/pages/administrator/MasterCategoryFinance/Page.jsx`
- `resources/js/pages/Inventory/MasterProduk/Page.jsx`

### Step 6 — Fix Multiple Dots Input (H4)
Files:
- `resources/js/pages/Inventory/Inventory/Page.jsx`
- `resources/js/pages/Inventory/Pembelian/FormAdd.jsx`

### Step 7 — Fix Medium Issues (M1-M3)
Files:
- `resources/js/pages/Inventory/MasterKategori/Modal.jsx`
- `resources/js/pages/administrator/user/Page.jsx`
- `resources/js/pages/administrator/Branch/Modal.jsx`
- `resources/js/pages/administrator/Store/Page.jsx`
- `resources/js/pages/Inventory/MasterProduk/Page.jsx`
- `resources/js/pages/Penjualan/PrintKwitansi.jsx`
- `resources/js/pages/Report/Finance/Page.jsx`

### Step 8 — Fix Remove Item Safety (W2, W3)
Files:
- `resources/js/pages/Inventory/Remove/FormAdd.jsx`

### Step 9 — Protect Print Routes (W4)
Files:
- `resources/js/router/index.jsx`

### Step 10 — Fix Approval Double-Action (W5)
Files:
- `resources/js/pages/Approval/ApprovalPembelian/Page.jsx`

---

## FILE SUMMARY (22 file unik)

| # | File | Bug IDs |
|---|------|---------|
| 1 | `administrator/Branch/ModalAddBank.jsx` | C1 |
| 2 | `administrator/MasterBank/Modal.jsx` | C2 |
| 3 | `administrator/Branch/Modal.jsx` | C3, M2 |
| 4 | `administrator/Store/Modal.jsx` | C4 |
| 5 | `Inventory/Inventory/Page.jsx` | C5, H1, H4 |
| 6 | `Inventory/Pembelian/FormAdd.jsx` | F1, H4 |
| 7 | `Inventory/MasterProduk/Page.jsx` | H1, H3, M2 |
| 8 | `Inventory/MasterKategori/Page.jsx` | H1 |
| 9 | `Inventory/Pembelian/Main.jsx` | H1 |
| 10 | `Approval/ApprovalPembelian/Page.jsx` | H1, W5 |
| 11 | `administrator/user/Page.jsx` | H1, H2, M2 |
| 12 | `administrator/Branch/Page.jsx` | H1 |
| 13 | `administrator/MasterBank/Page.jsx` | H1, H2 |
| 14 | `administrator/Supplier/Page.jsx` | H1, H2 |
| 15 | `administrator/Customer/Page.jsx` | H2 |
| 16 | `administrator/MasterCategoryFinance/Page.jsx` | H2 |
| 17 | `Inventory/MasterKategori/Modal.jsx` | M1 |
| 18 | `administrator/Store/Page.jsx` | M2 |
| 19 | `Penjualan/PrintKwitansi.jsx` | M2 |
| 20 | `Report/Finance/Page.jsx` | M3 |
| 21 | `Inventory/Remove/FormAdd.jsx` | W2, W3 |
| 22 | `router/index.jsx` | W4 |

---

## Verification Checklist

1. **Pembelian → Approval → Inventory flow**: Buat pembelian dengan No.Seri "TEST-123" → approve → cek di Inventory apakah serial number muncul
2. **Modal forms**: Buka setiap modal (Add Bank, Master Bank, Branch, Store) → isi semua field → tombol submit harus enabled
3. **Pagination**: Di semua halaman, ubah page size ke 25 → pindah halaman → page size harus tetap 25
4. **Input berat**: Ketik "1.2.3" → harus jadi "1.23"
5. **Console**: DevTools → tidak ada console.log saat navigasi
6. **Remove Item**: Kasir login → scan barcode item cabang lain → harus tidak ditemukan
7. **Remove Item**: Jika user state null → submit harus gagal dengan pesan error, BUKAN default ke branch 1
8. **Print**: Akses `/penjualan/print-kwitansi` tanpa login → harus redirect ke login
9. **Approval**: Klik "Setujui" → selama loading, tombol approve/reject harus disabled
