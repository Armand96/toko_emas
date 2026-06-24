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
        Schema::create('m_products', function (Blueprint $table) {
            $table->id();
            $table->string('product_name');
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('category_id', false, true);
            $table->bigInteger('subcategory_id', false, true);
            $table->string('image_path')->nullable();
            $table->string('thumb_path')->nullable();
            $table->string('barcode');
            $table->boolean('is_active')->default(true);
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_products');
    }
};
