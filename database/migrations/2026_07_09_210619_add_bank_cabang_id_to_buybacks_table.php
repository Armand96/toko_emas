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
        Schema::table('buybacks', function (Blueprint $table) {
            $table->bigInteger('bank_cabang_id', false, true)->nullable()->after('sender_bank_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buybacks', function (Blueprint $table) {
            $table->dropColumn('bank_cabang_id');
        });
    }
};
