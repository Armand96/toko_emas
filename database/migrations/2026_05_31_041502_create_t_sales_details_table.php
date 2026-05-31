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
        Schema::create('t_sales_details', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('sales_id', false, true);
            $table->bigInteger('product_id', false, true);
            $table->decimal('harga');
            $table->bigInteger('qty', false, true);
            $table->bigInteger('inventory_id');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_sales_details');
    }
};
