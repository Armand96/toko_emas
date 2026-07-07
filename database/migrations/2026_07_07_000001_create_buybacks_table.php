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
        Schema::create('buybacks', function (Blueprint $table) {
            $table->id();
            $table->string('buyback_code', 50)->unique(); // e.g. BB-2605015
            $table->bigInteger('customer_id', false, true);
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('created_by', false, true);
            $table->decimal('sub_total', 16, 2)->default(0);
            $table->decimal('grand_total', 16, 2)->default(0);
            $table->enum('payment_type', ['TUNAI', 'TRANSFER']);
            $table->string('receiver_name', 150)->nullable();       // Nama Penerima (for TRANSFER)
            $table->string('receiver_bank_name', 100)->nullable();  // Bank penerima
            $table->string('receiver_rekening', 100)->nullable();   // No. Rekening penerima
            $table->bigInteger('sender_bank_id', false, true)->nullable(); // Bank Keluar (BankCabang)
            $table->enum('status', ['APPROVAL', 'CETAK KWITANSI', 'SELESAI', 'DITOLAK', 'DIBATALKAN']);
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('buybacks');
    }
};
