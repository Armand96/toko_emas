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
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `subcategory_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (1, 'Cincin Emas 1 gram', 1, 1, 1, NULL, NULL, 'CIN-00001', 1, 'cincin emas dengan berat 1 gram', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_suppliers` (`id`, `supplier_name`, `phone_number`, `address`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'PT ABC Jaya', '0089829823', 'Jl Permata Hijau', 1, '2026-06-15 05:38:15', '2026-06-15 05:38:15');
            INSERT INTO `m_banks` (`id`, `bank_name`, `bank_code`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Bank BCA', 'BCA', 1, '2026-06-15 05:36:08', '2026-06-15 05:36:08');
            INSERT INTO `m_branches` (`id`, `branch_name`, `branch_code`, `address`, `lokasi_cabang`, `pic`, `branch_open_date`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Jakarta', 'DKIJKT', 'Jl. Yos Sudarso', 'Jakarta', 1, '2026-11-01', 1, '2026-06-15 05:36:44', '2026-06-15 05:36:44');
            INSERT INTO `m_categories` (`id`, `category_name`, `description`, `category_code`, `parent_id`, `image_path`, `thumb_path`, `created_at`, `updated_at`) VALUES (1, 'Cincin', 'Kategori Cincin', 'CIN', NULL, NULL, NULL, '2026-06-15 05:35:21', '2026-06-15 05:35:21');
            INSERT INTO `m_customers` (`id`, `customer_name`, `address`, `phone_number`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Aldi Sujono', 'Jl. Kemayoran', '08827372616', 1, '2026-06-15 06:21:26', '2026-06-15 06:21:26');
            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Operasional', 'CASH OUT', 1, '2026-06-15 06:46:19', '2026-06-15 06:46:38');
            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'Pembelian', 'CASH OUT', 1, NULL, NULL);
            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (3, 'Penjualan', 'CASH IN', 1, NULL, NULL);
            INSERT INTO `bank_cabangs` (`id`, `branch_id`, `bank_id`, `nomor_rekening`, `nama_pemilik`, `is_active`, `created_at`, `updated_at`) VALUES (1, 1, 1, '00338227', 'Jono', 1, '2026-06-15 06:24:12', '2026-06-15 06:24:12');
            INSERT INTO `roles` (`id`, `role_name`, `created_at`, `updated_at`) VALUES (1, 'Super Admin', NULL, NULL);
            INSERT INTO `roles` (`id`, `role_name`, `created_at`, `updated_at`) VALUES (2, 'Owner', NULL, NULL);
            INSERT INTO `roles` (`id`, `role_name`, `created_at`, `updated_at`) VALUES (3, 'PIC', NULL, NULL);
            INSERT INTO `roles` (`id`, `role_name`, `created_at`, `updated_at`) VALUES (4, 'Kasir', NULL, NULL);

        ");

        User::create(array(
            'username' => 'tokoemas',
            'name' => 'tokoemas',
            'branch_id' => 1,
            'role_id' => 1,
            'is_active' => true,
            'email' => 'tokoemas@mail.com',
            'password' => Hash::make('tokoemas')
        ));
    }
}
