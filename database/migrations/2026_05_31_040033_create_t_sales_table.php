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
        Schema::create('t_sales', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 50);
            $table->bigInteger('customer_id', false, true);
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('created_by', false, true);
            $table->decimal('sub_total', 16, 2)->default(0);
            $table->decimal('grand_total', 16, 2)->default(0);
            $table->decimal('nominal_paid', 16, 2)->nullable(true);
            $table->decimal('exchange', 16, 2)->nullable(true);
            $table->enum('payment_type', ['TUNAI', 'TRANSFER']);
            $table->string('sender_name', 150)->nullable(true);
            $table->string('sender_rekening', 100)->nullable(true);
            $table->bigInteger('sender_bank_id', false, true)->nullable(true);
            $table->bigInteger('receiver_bank_id', false, true)->nullable(true);
            $table->enum('approval_status', ['APPROVAL', 'CETAK KWITANSI', 'DITOLAK', 'SELESAI']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_sales');
    }
};
