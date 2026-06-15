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
        Schema::create('remove_items', function (Blueprint $table) {
            $table->id();
            $table->string('code');
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('created_by', false, true);
            $table->string('note')->nullable(true);
            $table->enum('jenis', ['HILANG', 'REPAIR']);
            $table->enum('status', ['APPROVAL', 'DISETUJUI', 'DITOALK', 'DIBATALKAN']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('remove_items');
    }
};
