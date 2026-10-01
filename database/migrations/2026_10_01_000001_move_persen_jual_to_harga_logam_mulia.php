<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Persen jual logam mulia sekarang diatur per berat (tidak dipukul rata).
     * Nilai lama di harga_dasar.persen_jual_lm disalin ke semua baris supaya
     * harga tidak berubah saat migrate.
     */
    public function up(): void
    {
        Schema::table('harga_logam_mulia', function (Blueprint $table) {
            $table->decimal('persen_jual', 8, 3)->default(3)->after('berat');
        });

        $lama = DB::table('harga_dasar')->where('id', 1)->value('persen_jual_lm');
        if ($lama !== null) {
            DB::table('harga_logam_mulia')->update(['persen_jual' => $lama]);
        }

        Schema::table('harga_dasar', function (Blueprint $table) {
            $table->dropColumn('persen_jual_lm');
        });
    }

    public function down(): void
    {
        Schema::table('harga_dasar', function (Blueprint $table) {
            $table->decimal('persen_jual_lm', 8, 3)->default(3)->after('harga_dasar_beli_lm');
        });

        Schema::table('harga_logam_mulia', function (Blueprint $table) {
            $table->dropColumn('persen_jual');
        });
    }
};
