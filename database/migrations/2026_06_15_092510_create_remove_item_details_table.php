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
        Schema::create('remove_item_details', function (Blueprint $table) {
            $table->id();
            $table->string('inventory_code');
            $table->bigInteger('remove_header_id', false, true);
            $table->bigInteger('product_id', false, true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('remove_item_details');
    }
};
