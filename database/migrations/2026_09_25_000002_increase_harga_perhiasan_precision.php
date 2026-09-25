<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * LB asli hasil pembagian berulang (23K = 1,07833333…). Pada 6 desimal
     * harga meleset dari acuan Excel (2.674.266 vs 2.674.267) di 12 dari 19 baris.
     * Raw SQL dipakai agar tidak bergantung pada doctrine/dbal.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE harga_perhiasan MODIFY kadar DECIMAL(12,8) NOT NULL');
        DB::statement('ALTER TABLE harga_perhiasan MODIFY lb_jual DECIMAL(12,8) NOT NULL');
        DB::statement('ALTER TABLE harga_perhiasan MODIFY lb_beli DECIMAL(12,8) NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE harga_perhiasan MODIFY kadar DECIMAL(8,4) NOT NULL');
        DB::statement('ALTER TABLE harga_perhiasan MODIFY lb_jual DECIMAL(10,6) NOT NULL');
        DB::statement('ALTER TABLE harga_perhiasan MODIFY lb_beli DECIMAL(10,6) NOT NULL');
    }
};
