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
        Schema::create('m_branches', function (Blueprint $table) {
            $table->id();
            $table->string('branch_name', 150);
            $table->string('branch_code', 10);
            $table->string('address');
            $table->string('lokasi_cabang');
            $table->text('phone_numbers')->nullable();
            $table->bigInteger('pic', false, true);
            $table->date('branch_open_date');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('m_branches');
    }
};
