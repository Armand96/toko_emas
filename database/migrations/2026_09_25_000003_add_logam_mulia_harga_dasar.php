<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Logam mulia punya harga dasar sendiri, terpisah dari perhiasan.
     * Harga per baris = dasar x berat, jadi kolom harga di harga_logam_mulia
     * tidak lagi diisi (dan NOT NULL tanpa default bikin insert gagal).
     */
    public function up(): void
    {
        Schema::table('harga_dasar', function (Blueprint $table) {
            $table->decimal('harga_dasar_jual_lm', 15, 2)->default(0)->after('harga_dasar_beli');
            $table->decimal('harga_dasar_beli_lm', 15, 2)->default(0)->after('harga_dasar_jual_lm');
        });

        Schema::table('harga_logam_mulia', function (Blueprint $table) {
            $table->dropColumn(['harga_jual', 'harga_buyback']);
        });
    }

    public function down(): void
    {
        Schema::table('harga_dasar', function (Blueprint $table) {
            $table->dropColumn(['harga_dasar_jual_lm', 'harga_dasar_beli_lm']);
        });

        Schema::table('harga_logam_mulia', function (Blueprint $table) {
            $table->decimal('harga_jual', 15, 2)->default(0)->after('berat');
            $table->decimal('harga_buyback', 15, 2)->default(0)->after('harga_jual');
        });
    }
};
