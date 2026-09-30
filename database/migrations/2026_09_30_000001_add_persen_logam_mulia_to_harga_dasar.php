<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Markup jual logam mulia sebelumnya hardcode 3%. Default disamakan
     * dengan nilai lama supaya harga tidak berubah saat migrate.
     */
    public function up(): void
    {
        Schema::table('harga_dasar', function (Blueprint $table) {
            $table->decimal('persen_jual_lm', 8, 3)->default(3)->after('harga_dasar_beli_lm');
        });
    }

    public function down(): void
    {
        Schema::table('harga_dasar', function (Blueprint $table) {
            $table->dropColumn('persen_jual_lm');
        });
    }
};
