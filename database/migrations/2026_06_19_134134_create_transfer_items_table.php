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
        Schema::create('transfer_items', function (Blueprint $table) {
            $table->id();
            $table->string('kode_transfer', 60);
            $table->bigInteger('branch_source_id', false, true);
            $table->bigInteger('branch_dest_id', false, true);
            $table->bigInteger('created_by', false, true);
            $table->enum('status', ['APPROVAL', 'DISETUJUI', 'DIBATALKAN', 'DITOLAK']);
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfer_items');
    }
};
