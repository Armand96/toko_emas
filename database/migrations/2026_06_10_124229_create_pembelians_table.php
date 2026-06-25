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
            $table->bigInteger('created_by', false, true);
            $table->bigInteger('category_id', false, true);
            $table->bigInteger('subcategory_id', false, true);
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('bank_cabang_id', false, true)->nullable();
            $table->bigInteger('supplier_id', false, true)->nullable();
            $table->enum('status', ['APPROVAL', 'DISETUJUI', 'DITOLAK', 'DIBATALKAN']);
            $table->enum('tipe_pembayaran', ['TUNAI', 'TRANSFER']);
            $table->string('inventory_code', 60)->nullable();
            $table->string('image_path')->nullable();
            $table->string('thumb_path')->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->string('barcode');
            $table->float('berat');
            $table->integer('karat');
            $table->decimal('modal', 16, 2);
            $table->decimal('jual', 16, 2);
            $table->string('note')->nullable();
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
