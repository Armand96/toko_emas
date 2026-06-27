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
        Schema::create('transfer_item_details', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('transfer_item_id', false, true);
            $table->bigInteger('product_id', false, true);
            $table->string('inventory_code', 60);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfer_item_details');
    }
};
