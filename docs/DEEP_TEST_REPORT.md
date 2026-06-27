# Deep Test Report — Toko Emas (Flow & Fitur)

**Tanggal:** 2026-06-27
**Metode:** End-to-end flow test per-role (`_flowtest.mjs`) + edge-case test (`_deeptest.mjs`, `_deeptest2.mjs`) + code review FE/BE.
**Scope:** Fungsional — alur bisnis, state machine, perhitungan finance/inventory, laporan, konsistensi konfigurasi RBAC FE.
**Di luar scope (by design):** Penjagaan RBAC memang hanya di Frontend; "BE tidak cek role/branch" BUKAN bug → tidak dilaporkan.
**Status fixing:** Belum ada perbaikan (laporan temuan saja).

---

## RINGKASAN EKSEKUTIF

**Flow test: 51/52 PASS** (1 sisanya false-alarm, lihat catatan). Seluruh alur bisnis inti **berjalan benar secara fungsional**:

- ✅ Pembelian → Approval → Inventory (AVAILABLE) + Finance (CASH OUT) — nominal & format `{barcode}-NNNN` benar.
- ✅ Item ditolak tidak membuat inventory/finance.
- ✅ Penjualan → Approval → **Cetak Kwitansi** → Inventory SOLD + Finance CASH IN. Timing benar: **inventory baru SOLD saat cetak kwitansi**, bukan saat disetujui (sesuai NOTES.tsv "boleh cancel selama belum cetak").
- ✅ Transfer antar cabang: TRANSIT → pindah cabang & AVAILABLE saat disetujui.
- ✅ Remove HILANG→LOST, REPAIR→REPAIR→RETURN→AVAILABLE, DITOLAK→tetap AVAILABLE.
- ✅ Stock opname: kode sesi, in_stock, status SESUAI benar.
- ✅ Laporan finance balance (closing = opening + cashin − cashout), inventory/sales/pembelian/customer/dashboard semua 200.
- ✅ Master data: customer/supplier/product CRUD, search, filter status, barcode auto, produk multi-cabang = 1 produk (tidak gandakan).

Artinya **happy-path semua fitur sehat.** Temuan yang tersisa adalah **edge-case / robustness** (input tidak wajar) dan **konsistensi konfigurasi RBAC FE**.

---

## A. TEMUAN FUNGSIONAL — EDGE CASE (kandidat untuk Armand / BE)

> Ini bukan soal RBAC. Ini soal data jadi salah/korup kalau aksi dilakukan di urutan/kondisi tertentu. Walau RBAC FE menyembunyikan tombolnya, kondisi ini tetap bisa terjadi dari race/double-click/retry.

| # | Sev | Temuan | Lokasi | Dampak ke user |
|---|---|---|---|---|
| A1 | HIGH | **Re-approve pembelian → inventory & finance DUPLIKAT.** Approve pembelian yg sama 2x menambah row inventory & CASH OUT. | `PembelianController::changeApproval` | Stok & kas menggelembung kalau approve di-double-click / retry. |
| A2 | HIGH | **Cetak kwitansi 2x → CASH IN duplikat.** | `TSalesController::changeApproval` (CETAK KWITANSI) | Pemasukan tercatat ganda. |
| A3 | HIGH | **Bisa jual item yang sudah SOLD / sedang TRANSIT.** Tidak ada cek status inventory saat buat penjualan. | `TSalesController::createTrx` | Barang sama "terjual" dua kali / item transit ikut terjual. |
| A4 | HIGH | **Search `customer_name` di Sales → error 500.** `where('customer.customer_name',…)` (harusnya `whereHas`). | `TSalesController::index:31` | Fitur cari penjualan by nama customer crash. |
| A5 | MED | **Remove yang sudah DITOLAK bisa di-approve ulang → item jadi LOST.** Tidak ada state guard. | `RemoveItemController::changeApproval` | Item AVAILABLE bisa "dihilangkan" lewat removal lama. |
| A6 | MED | **RETURN pada removal HILANG menghidupkan item LOST → AVAILABLE.** | `RemoveItemController::changeApproval` | Item yg dinyatakan hilang bisa muncul lagi tanpa kontrol. |
| A7 | MED | **Penjualan branch mismatch** (header cabang ≠ cabang item) diterima. | `TSalesController::createTrx` | Penjualan tercatat di cabang yang salah → laporan per-cabang melenceng. |
| A8 | MED | **Transfer ke cabang yang sama (source==dest)** diterima, item nyangkut TRANSIT. | `TransferItemRequest` | Item bisa "hilang" di status TRANSIT tanpa tujuan nyata. |
| A9 | MED | **Stock opname percaya `opname_status` dari client.** Kode tidak ada di DB tetap masuk sbg EXTRA. | `StockOpnameHeaderController::createOpname` | NOTES.tsv: "kode ngawur jangan masuk EXTRA" — validasi hanya di FE. |
| A10 | MED | **Approval status invalid → 500** (`Enum::from()` meledak); **approval ID tidak ada → 500** (null pointer pada `$data->update`). | `*Controller::changeApproval` | Error 500 (bukan pesan rapi) kalau payload tak wajar. |
| A11 | MED | **User nonaktif (is_active=0) tetap bisa login.** `Auth::attempt` tidak cek `is_active`. | `UserController::login` | Menonaktifkan user tidak benar-benar memblokir login. |

**Pola:** Kebanyakan A1–A10 = kurang **guard state-machine** (cek status saat ini sebelum aksi) + **idempotensi** di endpoint approval. Semua ada di BE → koordinasikan dgn Armand.

---

## B. TEMUAN KONFIGURASI RBAC — FRONTEND (bisa dikerjakan tanpa Armand)

> Karena penjagaan memang di FE, justru **konsistensi konfigurasi FE ini yang penting.** Berikut celah/inkonsistensi yang nyata mempengaruhi apa yang bisa dilihat/diklik user.

### B1 — 🟠 `/report/inventory` lolos dari semua guard FE
- Rute `/report/inventory` **tidak terdaftar** di `SUBMENU_PERMISSION_MAP` maupun `ROUTE_PERMISSION_MAP` (`resources/js/Store/PermissionStore.js`).
- `canSeeSubMenu()` & `canAccessRoute()` **default `true`** kalau key tidak ada → siapa pun (termasuk Kasir yang seharusnya tak punya akses report apa pun) bisa membuka `/report/inventory` langsung via URL.
- **Saran:** tambah `'/report/inventory': 'report.inventory'` ke kedua map; tambah `report.inventory` ke array `MENU_PERMISSION_MAP.report` agar konsisten dgn submenu sidebar.

### B2 — 🟡 Tombol "Batalkan" Pembelian pakai permission key yang salah
- Halaman Pembelian ada di rute `/transaksi/pembelian` (key `transaksi.pembelian`), tapi di `Inventory/Pembelian/Main.jsx:266` tombol Batalkan di-gate `can('delete', 'inventory.pembelian')` — key berbeda untuk halaman yang sama.
- Saat ini "kebetulan benar" (Owner/PIC tak punya `inventory.pembelian` → tombol tersembunyi sesuai NOTES.tsv), tapi rapuh. **Samakan ke `transaksi.pembelian`.**

### B3 — 🟡 Dead config di PermissionStore
- `'/penjualan' → penjualan` di `ROUTE_PERMISSION_MAP`, tapi rute nyata = `/transaksi/penjualan`. Key `penjualan` cuma dimiliki Super Admin. → tidak terpakai.
- `inventory.pembelian` di `MENU_PERMISSION_MAP.inventory` + `'/inventory/pembelian'` di `SUBMENU_PERMISSION_MAP` menunjuk rute yang tidak ada. → sumber kebingungan B2.

### B4 — ✅ Yang sudah benar (FE)
- Gating tombol Approve/Reject di semua halaman Approval pakai `can('update','approval.X')` — sesuai matrix (PIC=RU, Owner=CRUD).
- Cancel penjualan: `isKasir() && can('delete','transaksi.penjualan')` + hanya status APPROVAL/DISETUJUI → sesuai NOTES.tsv.
- Badge member customer (`sales_count > 1`) di modal Penjualan & Approval Penjualan: data dari payload sales (`withCount('sales')`) → bekerja benar. Report Customer juga (`topCustomer withCount`). **Master Customer tidak menampilkan badge** sehingga tidak butuh `sales_count` di list-nya → tidak ada bug. *(Inilah 1 "FAIL" di flow test yang ternyata false-alarm.)*

---

## C. STATUS ITEM "need test" DARI NOTES.tsv (yang tervalidasi)

| Item NOTES.tsv | Hasil |
|---|---|
| Penjualan: cash in baru terbentuk saat cetak kwitansi, bukan saat disetujui | ✅ BENAR (terverifikasi flow) |
| Kasir bisa cancel penjualan selama belum cetak kwitansi | ✅ BENAR (FE gating + inventory masih AVAILABLE sebelum cetak) |
| Transaksi otomatis (pembelian/penjualan) gabisa diedit/hapus | ✅ BENAR (`is_auto` guard, edit ditolak 422) |
| Pembelian: item ditolak tidak ikut jadi inventory | ✅ BENAR |
| Pembelian: No batch & format kode | ✅ batch konsisten, `inventory_code` `{barcode}-NNNN` |
| Produk: pilih >1 cabang tidak menggandakan produk | ✅ BENAR (1 produk, banyak branch) |
| Owner/PIC di menu pembelian view-only (tombol batalkan hide) | ✅ tersembunyi (tapi via key rapuh — lihat B2) |
| Stock opname: kode ngawur jangan masuk EXTRA | ⚠️ Hanya divalidasi di FE; BE menerima (A9) |
| Finance filter periode 24–24 | tidak diuji ulang (sebelumnya "done, misconfig timezone") |

---

## D. CARA REPRODUKSI

```bash
# dijalankan dari root project
php artisan serve                        # pastikan jalan
node docs/testing/_flowtest.mjs          # flow happy-path + assertion (51/52)
node docs/testing/_deeptest.mjs          # edge-case batch 1
node docs/testing/_deeptest2.mjs         # edge-case batch 2 (remove/transfer/opname/sale)
```
Akun test (password `password`): `owner`, `pic`, `kasirjkt` (Jakarta), `kasirbgr` (Bogor), `kasironaktif` (nonaktif). Super admin: `tokoemas`/`tokoemas`.

---

## E. CATATAN DATA & FILE

- Testing menulis data transaksi ke DB. Pembersih `docs/testing/_cleanup_test_data.php` tersedia (truncate tabel transaksi, pertahankan master + user) — **perlu konfirmasi user** (operasi destruktif).
- File kerja ada di `docs/testing/`: `_flowtest.mjs`, `_deeptest.mjs`, `_deeptest2.mjs`, `_backtest.mjs`, `_inspect.php`, `_seed_test_users.php`, `_cleanup_test_data.php`.
