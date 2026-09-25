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
            INSERT INTO `m_banks` (`id`, `bank_name`, `bank_code`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Bank Central Asia', 'BCA', 1, '2026-06-15 05:36:08', '2026-06-23 08:14:53');

            INSERT INTO `m_branches` (`id`, `branch_name`, `branch_code`, `address`, `lokasi_cabang`, `pic`, `branch_open_date`, `phone_numbers`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Jakarta', 'DKIJKT', 'Blok M Square Pintu Berlian 2 Lt. UG A 118', 'Jakarta', 3, '2026-11-01', '0813 1829 0055', 1, '2026-06-15 05:36:44', '2026-06-25 20:26:56');

            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (1, 'Operasional', 'CASH OUT', 1, '2026-06-15 06:46:19', '2026-06-15 06:46:38');
            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (2, 'Pembelian', 'CASH OUT', 1, NULL, NULL);
            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (3, 'Penjualan', 'CASH IN', 1, NULL, NULL);
            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (4, 'Uang Awal', 'CASH IN', 1, NULL, NULL);
            INSERT INTO `m_category_finances` (`id`, `category_name`, `type`, `is_active`, `created_at`, `updated_at`) VALUES (5, 'Buyback', 'CASH OUT', 1, NULL, NULL);

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
        User::create([
            'username' => 'owner',
            'name' => 'Owner',
            'branch_id' => 1,
            'role_id' => 2,
            'is_active' => true,
            'email' => 'owner@mail.com',
            'password' => Hash::make('owner'),
        ]);
        User::create([
            'username' => 'pic',
            'name' => 'pic',
            'branch_id' => 1,
            'role_id' => 3,
            'is_active' => true,
            'email' => 'pic@mail.com',
            'password' => Hash::make('pic'),
        ]);
        User::create([
            'username' => 'kasir',
            'name' => 'kasir',
            'branch_id' => 1,
            'role_id' => 4,
            'is_active' => true,
            'email' => 'kasir@mail.com',
            'password' => Hash::make('kasir'),
        ]);
    }
}
