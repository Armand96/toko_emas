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
        Schema::create('stock_opname_headers', function (Blueprint $table) {
            $table->id();
            $table->string('kode_sesi', 60);
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('total_item', false, true);
            $table->bigInteger('in_stock', false, true);
            $table->bigInteger('missing', false, true);
            $table->bigInteger('extra', false, true);
            $table->enum('status', ['SESUAI', 'SELISIH']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_opname_headers');
    }
};
