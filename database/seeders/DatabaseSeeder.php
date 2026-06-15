<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

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
        DB::raw("
            INSERT INTO `m_products` (`id`, `product_name`, `branch_id`, `category_id`, `image_path`, `thumb_path`, `barcode`, `is_active`, `description`, `created_at`, `updated_at`) VALUES (1, 'Cincin Emas 1 gram', 1, 1, NULL, NULL, 'CIN-00001', 1, 'cincin emas dengan berat 1 gram', '2026-06-15 05:35:31', '2026-06-15 05:35:31');
            INSERT INTO `m_suppliers` (`id`, `supplier_name`, `phone_number`, `address`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'PT ABC Jaya', '0089829823', 'Jl Permata Hijau', 1, '2026-06-15 05:38:15', '2026-06-15 05:38:15');
            INSERT INTO `m_banks` (`id`, `bank_name`, `bank_code`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Bank BCA', 'BCA', 1, '2026-06-15 05:36:08', '2026-06-15 05:36:08');
            INSERT INTO `m_branches` (`id`, `branch_name`, `branch_code`, `address`, `pic`, `branch_open_date`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Jakarta', 'DKIJKT', 'Jl. Yos Sudarso', 1, '2026-11-01', 1, '2026-06-15 05:36:44', '2026-06-15 05:36:44');
            INSERT INTO `m_categories` (`id`, `category_name`, `description`, `category_code`, `parent_id`, `image_path`, `thumb_path`, `created_at`, `updated_at`) VALUES (1, 'Cincin', 'Kategori Cincin', 'CIN', NULL, NULL, NULL, '2026-06-15 05:35:21', '2026-06-15 05:35:21');
        ");
    }
}
