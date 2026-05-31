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
            $table->bigInteger('customer_id', false, true);
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('created_by', false, true);
            $table->bigInteger('approval_id', false, true);
            $table->decimal('sub_total');
            $table->decimal('grand_total');
            $table->enum('payment_type', ['TUNAI', 'TRANSFER']);
            $table->string('sender_name', 150);
            $table->enum('approval_status', ['APPROVAL', 'APPROVED', 'REJECTED']);
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
