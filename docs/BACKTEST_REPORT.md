# Backtest Report — Toko Emas (Flow & Skenario)

**Tanggal:** 2026-06-27
**Tujuan:** Pastikan FLOW bisnis rapi & konsisten end-to-end. Setiap rupiah & setiap item harus terhitung (rekonsiliasi).
**Metode:** DB direset bersih (`migrate:fresh --seed`), lalu jalankan 3 suite di atas data terkontrol.
**Hasil utama:** ✅ **Backtest 60/60 PASS — semua balance.** Skenario lama (full + inventory) juga sukses & konsisten.

---

## 1. BACKTEST BERSAMA REKONSILIASI — `_backtest.mjs`

DB mulai dari nol (saldo seed Rp 40.000.000 dari 4 entry "Uang Awal"; inventory 0). Skrip melacak *expected* secara independen lalu cocokkan dgn API.

### Hasil per skenario

| Skenario | Cek | Status |
|---|---|---|
| 1. Pembelian (tunai+transfer, approve sebagian) | 12 | ✅ semua |
| 2. Penjualan → approve → cetak kwitansi | 11 | ✅ semua |
| 3. Transfer item antar cabang | 6 | ✅ semua |
| 4. Remove (HILANG/REPAIR/RETURN/TOLAK) | 8 | ✅ semua |
| 5. Stock opname (SESUAI + edge SELISIH/MISSING) | 12 | ✅ semua |
| Rekonsiliasi akhir (uang & stok) | 11 | ✅ semua |
| **TOTAL** | **60** | **✅ 60/60** |

### Rekonsiliasi yang terbukti benar

**Uang:**
- CASH OUT TUNAI = Rp 2.000.000 (modal item tunai disetujui) ✓
- CASH OUT TRANSFER = Rp 6.000.000 (modal item transfer disetujui) ✓
- CASH IN TUNAI = Rp 6.600.000 (total harga jual) ✓
- Saldo total = baseline − total modal + total penjualan = **Rp 36.500.000** ✓
- Finance summary: closing = opening + cash_in − cash_out = **Rp 36.500.000** ✓ (dua sumber cocok)

**Stok (tidak ada item hilang/ganda):**
- Total inventory dibuat = 8 = AVAILABLE 5 + SOLD 2 + LOST 1 + TRANSIT 0 + REPAIR 0 ✓

**State machine (timing benar):**
- Pembelian DISETUJUI → inventory AVAILABLE + finance CASH OUT; DITOLAK → tidak ada inventory ✓
- Penjualan: sebelum cetak kwitansi inventory **masih AVAILABLE** (boleh cancel); **baru SOLD + CASH IN saat cetak kwitansi** ✓
- Transfer: AVAILABLE → TRANSIT (pengajuan) → AVAILABLE di cabang tujuan (disetujui) ✓
- Remove: HILANG→LOST, REPAIR→REPAIR→RETURN→AVAILABLE, DITOLAK→tetap AVAILABLE ✓
- Opname: semua INSTOCK → SESUAI; ada MISSING → SELISIH (missing tercatat) ✓

---

## 2. SKENARIO LAMA — `run-full-scenario.mjs`

Modal 50jt/cabang × 4, 60 pembelian, approve ~50%, 5 customer baru, penjualan + cetak kwitansi, opname.

**Hasil (konsisten):**
- Pembelian: 32 disetujui + 12 ditolak + 16 pending = **60** ✓
- Inventory: AVAILABLE 16 + SOLD 16 = **32** = pembelian disetujui ✓
- Penjualan: 8 transaksi, 8 dicetak ✓
- **Saldo akhir Rp 212.767.921** lewat 2 sumber yang cocok:
  - total-count = Rp 212.767.921
  - finance summary: 0 + 283.509.921 (cash in) − 70.742.000 (cash out) = **Rp 212.767.921** ✓
- Stock opname 4 cabang berjalan.

> Catatan kosmetik: output console script lama tampil mojibake (emoji ter-encode salah di file). Tidak mempengaruhi data — murni tampilan terminal.

---

## 3. SKENARIO LAMA — `run-inventory-scenario.mjs`

Transfer (approve/cancel), remove (hilang/repair/return/tolak), opname pasca perubahan.

**Hasil (konsisten):**
- Transfer: 1 disetujui + 2 dibatalkan = 3; item dibatalkan kembali AVAILABLE (TRANSIT akhir = 0) ✓
- Remove: HILANG→LOST (1), REPAIR→RETURN→AVAILABLE (REPAIR akhir = 0), DITOLAK (item dipertahankan) ✓
- **Total inventory tetap 32** = AVAILABLE 15 + SOLD 16 + LOST 1 (tidak ada yg hilang/ganda) ✓
- 8 sesi opname semua SESUAI ✓

---

## 4. KESIMPULAN

**Flow bisnis inti Toko Emas RAPI & KONSISTEN.** Semua jalur (pembelian, penjualan, transfer, remove, stock opname) menghasilkan perubahan stok & keuangan yang benar dan saling balance dari dua sumber laporan independen. Timing approval penjualan sesuai aturan (cash in & SOLD baru terbentuk saat cetak kwitansi).

Tidak ada bug flow pada happy-path. Catatan robustness edge-case (double-approve, jual item non-AVAILABLE, dll.) ada di [DEEP_TEST_REPORT.md](DEEP_TEST_REPORT.md) bagian A — semuanya di sisi BE (untuk Armand), bukan kerusakan flow normal.

---

## 5. Cara menjalankan ulang

```bash
# dijalankan dari root project
php artisan migrate:fresh --seed --force                  # reset DB bersih
php artisan tinker docs/testing/_seed_test_users.php      # user test (owner/pic/kasirjkt/kasirbgr)
node docs/testing/_backtest.mjs                           # backtest + rekonsiliasi (60/60)
# skenario lama (perlu token fresh — ganti const TOKEN):
node docs/testing/run-full-scenario.mjs
node docs/testing/run-inventory-scenario.mjs
```
Akun: `tokoemas`/`tokoemas` (super), `owner`/`pic`/`kasirjkt`/`kasirbgr` = password `password`.

**State DB saat ini:** berisi data dari run-full-scenario + run-inventory-scenario (total 32 inventory, dst). Jalankan `migrate:fresh --seed` lagi bila ingin bersih.
