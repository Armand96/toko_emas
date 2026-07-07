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
        Schema::create('buyback_details', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('buyback_id', false, true);
            $table->bigInteger('product_id', false, true);
            $table->string('inventory_code', 60)->nullable(); // linked inventory item being bought back
            $table->float('berat');
            $table->integer('karat');
            $table->string('serial_number', 100)->nullable();
            $table->decimal('price', 16, 2); // harga buyback per item
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('buyback_details');
    }
};
