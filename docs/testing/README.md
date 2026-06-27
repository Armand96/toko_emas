# Testing & QA Scripts

Skrip pengujian flow & QA untuk Toko Emas. **Semua dijalankan dari root project** (bukan dari folder ini), karena `php artisan tinker` butuh konteks aplikasi.

## Prasyarat
- `php artisan serve` jalan (default `http://127.0.0.1:8000`).
- DB bersih disarankan: `php artisan migrate:fresh --seed --force`.
- User test: `php artisan tinker docs/testing/_seed_test_users.php`
  (membuat `owner`, `pic`, `kasirjkt`, `kasirbgr`, `kasironaktif` — password `password`).

## Skrip

| File | Fungsi |
|---|---|
| `_backtest.mjs` | Backtest flow penuh + rekonsiliasi uang & stok (60 assertion). Jalankan: `node docs/testing/_backtest.mjs` |
| `_flowtest.mjs` | End-to-end flow test semua fitur (assertion per langkah). |
| `_deeptest.mjs` | Edge-case batch 1 (validasi, idempotensi, state). |
| `_deeptest2.mjs` | Edge-case batch 2 (remove/transfer/opname/sale). |
| `_inspect.php` | Cetak ringkasan isi DB (user, cabang, stok, finance). `php artisan tinker docs/testing/_inspect.php` |
| `_seed_test_users.php` | Buat/update user test per role. |
| `_cleanup_test_data.php` | Truncate tabel transaksi (pertahankan master + user). **Destruktif** — pakai dgn sadar. |

### Skenario & generator lama (pakai `const TOKEN` hardcode — refresh dulu via login)

| File | Fungsi |
|---|---|
| `run-full-scenario.mjs` | Skenario lengkap: modal, pembelian, approval, customer, penjualan, opname. |
| `run-inventory-scenario.mjs` | Skenario inventory: transfer, remove (hilang/repair/return), opname. |
| `run-test-scenario.mjs` | Skenario test tambahan. |
| `run-dashboard-report-product-test.mjs` | Test dashboard, report, & produk. |
| `run-opname-remaining.mjs` | Lengkapi opname yang tersisa. |
| `generate-test-report.mjs` | Generate Excel QA (`QA_TEST_REPORT.xlsx`). |
| `generate-fe-qa-report.mjs` | Generate report QA Frontend. |
| `generate-be-changes-report.mjs` | Generate report perubahan Backend. |

> Catatan: output file (mis. `*.xlsx`) ditulis relatif ke **cwd**, jadi jalankan dari root agar hasilnya konsisten.

## Laporan
- `../BACKTEST_REPORT.md` — hasil backtest & skenario.
- `../DEEP_TEST_REPORT.md` — temuan deep test (flow + edge case).
