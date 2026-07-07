<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            // Make pembelian_id optional — inventory can come from buyback too
            $table->bigInteger('pembelian_id', false, true)->nullable()->change();

            // Add buyback_id (optional — set when inventory originates from a buyback)
            $table->bigInteger('buyback_id', false, true)->nullable()->after('pembelian_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventories', function (Blueprint $table) {
            $table->dropColumn('buyback_id');
            $table->bigInteger('pembelian_id', false, true)->nullable(false)->change();
        });
    }
};
