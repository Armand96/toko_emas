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
        Schema::create('t_approvals', function (Blueprint $table) {
            $table->id();
            $table->string('order_id', 50);
            $table->bigInteger('customer_id', false, true);
            $table->bigInteger('product_id', false, true);
            $table->bigInteger('branch_id', false, true);
            $table->decimal('nominal');
            $table->bigInteger('created_by', false, true);
            $table->enum('payment_type', ['TUNAI', 'TRANSFER']);
            $table->enum('approval_type', ['TRANSACTION', 'TRANSFER']);
            $table->enum('status', ['APPROVAL', 'APPROVED', 'REJECTED']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_approvals');
    }
};
