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
        Schema::create('finances', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('category_finance_id', false, true);
            $table->bigInteger('bank_cabang_id', false, true);
            $table->enum('type', ['CASH IN', 'CASH OUT']);
            $table->enum('payment_method', ['CASH', 'TRANSFER']);
            $table->decimal('nominal', 16, 2)->default(9);
            $table->string('note')->nullable();
            $table->string('attachment')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finances');
    }
};
