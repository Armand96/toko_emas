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
        Schema::create('bank_cabangs', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('bank_id', false, true);
            $table->string('nomor_rekening', 50);
            $table->string('nama_pemilik', 150);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_cabangs');
    }
};
