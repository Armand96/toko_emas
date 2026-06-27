<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        // User::factory()->create([
        //     'name' => 'Test User',
        //     'email' => 'test@example.com',
        // ]);
        DB::unprepared("
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (1, 'Cincin Flower', NULL, 4, 6, NULL, NULL, 'CIN-00001', 1, 'Cincin model flower', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (2, 'Kalung Italy Rantai', NULL, 4, 5, NULL, NULL, 'KAL-00001', 1, 'Kalung italy model rantai', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (3, 'Liontin Gold Mutiara', NULL, 4, 7, NULL, NULL, 'LGM-00001', 1, 'Liontin gold dengan mutiara', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (4, 'Anting Mutiara', NULL, 4, 6, NULL, NULL, 'ANT-00001', 1, 'Anting mutiara emas', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (5, 'Cincin Clover', NULL, 4, 6, NULL, NULL, 'SIL-00001', 1, 'Cincin model clover', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (6, 'Gelang Bali Ukir', NULL, 4, 5, NULL, NULL, 'CKM-00001', 1, 'Gelang bali ukir emas', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (7, 'Gelang Bali Ukir', NULL, 4, 5, NULL, NULL, 'BRL-00001', 1, 'Gelang bali ukir emas variasi', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (8, 'ANTAM 10g', NULL, 2, 3, NULL, NULL, 'ATM-00001', 1, 'Emas batangan ANTAM 10 gram', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (9, 'Kalung Tali Emas', NULL, 4, 5, NULL, NULL, 'KTE-00001', 1, 'Kalung tali emas polos', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (10, 'Cincin Solitaire', NULL, 4, 6, NULL, NULL, 'CSO-00001', 1, 'Cincin solitaire emas', '2026-06-15 05:35:31', '2026-06-15 05:35:31');

            INSERT INTO `branch_products` (`id`, `product_id`, `branch_id`, `created_at`, `updated_at`) VALUES (1, 1, 1, '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `branch_products` (`id`, `product_id`, `branch_id`, `created_at`, `updated_at`) VALUES (2, 2, 2, '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `branch_products` (`id`, `product_id`, `branch_id`, `created_at`, `updated_at`) VALUES (3, 3, 3, '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `branch_products` (`id`, `product_id`, `branch_id`, `created_at`, `updated_at`) VALUES (4, 4, 4, '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `branch_products` (`id`, `product_id`, `branch_id`, `created_at`, `updated_at`) VALUES (5, 5, 1, '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `branch_products` (`id`, `product_id`, `branch_id`, `created_at`, `updated_at`) VALUES (6, 6, 2, '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `branch_products` (`id`, `product_id`, `branch_id`, `created_at`, `updated_at`) VALUES (7, 7, 3, '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `branch_products` (`id`, `product_id`, `branch_id`, `created_at`, `updated_at`) VALUES (8, 8, 4, '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `branch_products` (`id`, `product_id`, `branch_id`, `created_at`, `updated_at`) VALUES (9, 9, 1, '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `branch_products` (`id`, `product_id`, `branch_id`, `created_at`, `updated_at`) VALUES (10, 10, 2, '2026-06-15 05:35:31', '2026-06-15 05:35:31');

            INSERT INTO `m_suppliers` (`id`, `supplier_name`, `phone_number`, `address`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'PT ABC Jaya', '0089829823', 'Jl Permata Hijau', 0, '2026-06-15 05:38:15', '2026-06-23 08:14:43');
            INSERT INTO `m_suppliers` (`id`, `supplier_name`, `phone_number`, `address`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'Suppliedi', '081242454243411', 'Jl. Simpang Siedi', 1, '2026-06-23 06:19:02', '2026-06-23 06:19:35');

            INSERT INTO `m_banks` (`id`, `bank_name`, `bank_code`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Bank Central Asia', 'BCA', 0, '2026-06-15 05:36:08', '2026-06-23 08:14:53');
            INSERT INTO `m_banks` (`id`, `bank_name`, `bank_code`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'Bank Negara Indonesia', 'BNI', 1, '2026-06-23 06:22:17', '2026-06-23 06:39:37');

            INSERT INTO `m_branches` (`id`, `branch_name`, `branch_code`, `address`, `lokasi_cabang`, `pic`, `branch_open_date`, `phone_numbers`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Jakarta', 'DKIJKT', 'Blok M Square Pintu Berlian 2 Lt. UG A 118', 'Jakarta', 1, '2026-11-01', '0813 1829 0055', 1, '2026-06-15 05:36:44', '2026-06-25 20:26:56');
            INSERT INTO `m_branches` (`id`, `branch_name`, `branch_code`, `address`, `lokasi_cabang`, `pic`, `branch_open_date`, `phone_numbers`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'bogor', 'BGR-1', 'BOGOR', 'Bogor', 1, '2026-06-19', NULL, 1, '2026-06-19 15:22:54', '2026-06-19 15:22:54');
            INSERT INTO `m_branches` (`id`, `branch_name`, `branch_code`, `address`, `lokasi_cabang`, `pic`, `branch_open_date`, `phone_numbers`, `is_active`, `created_at`, `updated_at`) VALUES (3, 'KEBAYORAN LAMA', 'KLA', 'Jl. Simpang Siur', 'lokasi', 8, '2000-09-09', NULL, 0, '2026-06-23 06:29:15', '2026-06-23 17:53:58');
            INSERT INTO `m_branches` (`id`, `branch_name`, `branch_code`, `address`, `lokasi_cabang`, `pic`, `branch_open_date`, `phone_numbers`, `is_active`, `created_at`, `updated_at`) VALUES (4, 'Cibitung', 'CBT', 'cibitung', 'cibitung', 8, '2026-06-10', NULL, 1, '2026-06-23 17:56:55', '2026-06-23 17:56:55');

            INSERT INTO `m_categories` (`id`, `category_name`, `description`, `category_code`, `parent_id`, `image_path`, `thumb_path`, `created_at`, `updated_at`) VALUES (1, 'Cincin', 'Kategori Cincin', 'CIN', NULL, NULL, NULL, '2026-06-15 05:35:21', '2026-06-15 05:35:21');
            INSERT INTO `m_categories` (`id`, `category_name`, `description`, `category_code`, `parent_id`, `image_path`, `thumb_path`, `created_at`, `updated_at`) VALUES (2, 'Emas', 'Emas', 'EMS', NULL, NULL, NULL, '2026-06-22 15:10:59', '2026-06-22 15:10:59');
            INSERT INTO `m_categories` (`id`, `category_name`, `description`, `category_code`, `parent_id`, `image_path`, `thumb_path`, `created_at`, `updated_at`) VALUES (3, 'Emas Putih', 'test', 'EMS-PTH', 2, NULL, NULL, '2026-06-22 15:11:19', '2026-06-22 15:11:19');
            INSERT INTO `m_categories` (`id`, `category_name`, `description`, `category_code`, `parent_id`, `image_path`, `thumb_path`, `created_at`, `updated_at`) VALUES (4, 'Perhiasan', 'Perhiasan Emas', 'PRH', NULL, NULL, NULL, '2026-06-23 07:11:50', '2026-06-23 07:12:20');
            INSERT INTO `m_categories` (`id`, `category_name`, `description`, `category_code`, `parent_id`, `image_path`, `thumb_path`, `created_at`, `updated_at`) VALUES (5, 'Kalung', 'Kalung emas', 'KLG', 4, NULL, NULL, '2026-06-23 07:12:46', '2026-06-23 07:12:46');
            INSERT INTO `m_categories` (`id`, `category_name`, `description`, `category_code`, `parent_id`, `image_path`, `thumb_path`, `created_at`, `updated_at`) VALUES (6, 'Cincin', 'CINCIN', 'CI', 4, NULL, NULL, '2026-06-23 07:35:04', '2026-06-23 07:35:04');
            INSERT INTO `m_categories` (`id`, `category_name`, `description`, `category_code`, `parent_id`, `image_path`, `thumb_path`, `created_at`, `updated_at`) VALUES (7, 'Liontin', 'LIONTIN', 'LIN', 4, NULL, NULL, '2026-06-23 07:46:14', '2026-06-23 07:46:14');

            INSERT INTO `m_customers` (`id`, `customer_name`, `address`, `phone_number`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Aldi Sujono', 'Jl. Kemayoran', '08827372616', 0, '2026-06-15 06:21:26', '2026-06-23 08:14:20');
            INSERT INTO `m_customers` (`id`, `customer_name`, `address`, `phone_number`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'Widodo Wowo', 'Kec. Pulogadung (Pulo Gadung), Kel. Rawamangun, Jakarta Timur, DKI Jakarta, 13220', '08574221804567', 1, '2026-06-23 05:54:30', '2026-06-23 06:17:21');
            INSERT INTO `m_customers` (`id`, `customer_name`, `address`, `phone_number`, `is_active`, `created_at`, `updated_at`) VALUES (3, 'Faldi', 'Jl Wanawini', '081232135451', 1, '2026-06-25 18:37:08', '2026-06-25 18:37:08');

            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Operasional', 'CASH OUT', 1, '2026-06-15 06:46:19', '2026-06-15 06:46:38');
            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'Pembelian', 'CASH OUT', 1, NULL, NULL);
            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (3, 'Penjualan', 'CASH IN', 1, NULL, NULL);
            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (4, 'Uang Awal', 'CASH IN', 1, NULL, NULL);

            INSERT INTO `finances` (`id`, `branch_id`, `category_finance_id`, `bank_cabang_id`, `type`, `payment_method`, `nominal`, `note`, `attachment`, `is_auto`, `created_at`, `updated_at`) VALUES (1, 1, 4, 1, 'CASH IN', 'TUNAI', 10000000, 'Uang Awal', NULL, 1, '2026-06-15 06:46:19', '2026-06-15 06:46:38');
            INSERT INTO `finances` (`id`, `branch_id`, `category_finance_id`, `bank_cabang_id`, `type`, `payment_method`, `nominal`, `note`, `attachment`, `is_auto`, `created_at`, `updated_at`) VALUES (2, 1, 4, 1, 'CASH IN', 'TRANSFER', 10000000, 'Uang Awal', NULL, 1, '2026-06-15 06:46:19', '2026-06-15 06:46:38');

            INSERT INTO `finances` (`id`, `branch_id`, `category_finance_id`, `bank_cabang_id`, `type`, `payment_method`, `nominal`, `note`, `attachment`, `is_auto`, `created_at`, `updated_at`) VALUES (3, 2, 4, 1, 'CASH IN', 'TUNAI', 10000000, 'Uang Awal', NULL, 1, '2026-06-15 06:46:19', '2026-06-15 06:46:38');
            INSERT INTO `finances` (`id`, `branch_id`, `category_finance_id`, `bank_cabang_id`, `type`, `payment_method`, `nominal`, `note`, `attachment`, `is_auto`, `created_at`, `updated_at`) VALUES (4, 2, 4, 1, 'CASH IN', 'TRANSFER', 10000000, 'Uang Awal', NULL, 1, '2026-06-15 06:46:19', '2026-06-15 06:46:38');

            INSERT INTO `bank_cabangs` (`id`, `branch_id`, `bank_id`, `nomor_rekening`, `nama_pemilik`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 1, '00338227', 'Jono', 1, '2026-06-15 06:24:12', '2026-06-15 06:24:12');
            INSERT INTO `bank_cabangs` (`id`, `branch_id`, `bank_id`, `nomor_rekening`, `nama_pemilik`, `is_active`, `created_at`, `updated_at`) VALUES (3, 3, 1, '0032153415668', 'ARRAZQ STORE', 1, '2026-06-23 06:44:01', '2026-06-23 06:44:01');
            INSERT INTO `bank_cabangs` (`id`, `branch_id`, `bank_id`, `nomor_rekening`, `nama_pemilik`, `is_active`, `created_at`, `updated_at`) VALUES (4, 2, 2, '1234', 'ucok', 1, '2026-06-23 08:33:57', '2026-06-23 08:33:57');
            INSERT INTO `bank_cabangs` (`id`, `branch_id`, `bank_id`, `nomor_rekening`, `nama_pemilik`, `is_active`, `created_at`, `updated_at`) VALUES (5, 4, 2, '0032153415668', 'ARRAZQ STORE', 1, '2026-06-23 18:03:28', '2026-06-23 18:04:55');

            INSERT INTO `roles` (`id`, `role_name`, `created_at`, `updated_at`) VALUES (1, 'Super Admin', NULL, NULL);
            INSERT INTO `roles` (`id`, `role_name`, `created_at`, `updated_at`) VALUES (2, 'Owner', NULL, NULL);
            INSERT INTO `roles` (`id`, `role_name`, `created_at`, `updated_at`) VALUES (3, 'PIC', NULL, NULL);
            INSERT INTO `roles` (`id`, `role_name`, `created_at`, `updated_at`) VALUES (4, 'Kasir', NULL, NULL);
        ");

        User::create([
            'username' => 'tokoemas',
            'name' => 'tokoemas',
            'branch_id' => 1,
            'role_id' => 1,
            'is_active' => true,
            'email' => 'tokoemas@mail.com',
            'password' => Hash::make('tokoemas'),
        ]);
    }
}
