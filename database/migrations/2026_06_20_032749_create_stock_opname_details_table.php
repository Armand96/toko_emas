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
        Schema::create('stock_opname_details', function (Blueprint $table) {
            $table->id();
            $table->string('inventory_code', 60);
            $table->bigInteger('stockopname_header_id', false, true);
            $table->bigInteger('product_id', false, true);
            $table->enum('last_status', ['AVAILABLE', 'TRANSIT', 'SOLD', 'REPAIR', 'LOST']);
            $table->enum('opname_status', ['INSTOCK', 'EXTRA', 'MISSING']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_opname_details');
    }
};
