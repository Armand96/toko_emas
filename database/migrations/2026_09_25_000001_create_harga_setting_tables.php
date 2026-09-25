<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('harga_dasar', function (Blueprint $table) {
            $table->id();
            $table->decimal('harga_dasar_jual', 15, 2)->default(0);
            $table->decimal('harga_dasar_beli', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('harga_perhiasan', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('karat');
            // Presisi dinaikkan ke 8 desimal oleh migration berikutnya.
            $table->decimal('kadar', 8, 4);
            $table->decimal('lb_jual', 10, 6);
            $table->decimal('lb_beli', 10, 6);
            $table->decimal('berat', 10, 3)->default(1);
            $table->unsignedSmallInteger('urutan')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('harga_logam_mulia', function (Blueprint $table) {
            $table->id();
            $table->decimal('berat', 10, 3);
            $table->decimal('harga_jual', 15, 2);
            $table->decimal('harga_buyback', 15, 2);
            $table->unsignedSmallInteger('urutan')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('harga_logam_mulia');
        Schema::dropIfExists('harga_perhiasan');
        Schema::dropIfExists('harga_dasar');
    }
};
