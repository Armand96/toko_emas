<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tandai transaksi finance yang dibuat otomatis (approval pembelian
     * & cetak kwitansi penjualan) supaya tidak bisa diedit/dihapus manual.
     */
    public function up(): void
    {
        Schema::table('finances', function (Blueprint $table) {
            $table->boolean('is_auto')->default(false)->after('attachment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finances', function (Blueprint $table) {
            $table->dropColumn('is_auto');
        });
    }
};
