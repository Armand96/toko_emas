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
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('product_id', false, true);
            $table->bigInteger('category_id', false, true);
            $table->bigInteger('subcategory_id', false, true);
            $table->bigInteger('branch_id', false, true);
            $table->string('barcode');
            $table->float('berat');
            $table->integer('karat');
            $table->decimal('modal', 16, 2);
            $table->decimal('jual', 16, 2);
            $table->string('image_path')->nullable();
            $table->string('thumb_path')->nullable();
            $table->enum('status', ['AVAILABLE', 'TRANSIT', 'SOLD', 'REPAIR', 'LOST']);
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventories');
    }
};
