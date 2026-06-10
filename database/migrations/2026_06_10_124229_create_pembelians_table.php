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
        Schema::create('pembelians', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('batch', false, true);
            $table->bigInteger('product_id', false, true);
            $table->bigInteger('category_id', false, true);
            $table->bigInteger('subcategory_id', false, true);
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('bank_id', false, true);
            $table->enum('status', ['APPROVAL', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN']);
            $table->string('barcode');
            $table->integer('berat');
            $table->decimal('karat');
            $table->decimal('modal');
            $table->decimal('jual');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pembelians');
    }
};
