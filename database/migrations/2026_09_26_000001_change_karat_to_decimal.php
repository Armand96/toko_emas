<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Toko memakai karat desimal (24,999 untuk emas 99,9%). Sebagai tinyint
     * nilainya dibulatkan jadi 24 sehingga bentrok dengan baris 24K biasa.
     * Raw SQL dipakai agar tidak bergantung pada doctrine/dbal.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE harga_perhiasan MODIFY karat DECIMAL(6,3) NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE harga_perhiasan MODIFY karat TINYINT UNSIGNED NOT NULL');
    }
};
