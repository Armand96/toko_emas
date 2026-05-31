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
        Schema::create('t_inventories', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('product_id', false, true);
            $table->bigInteger('branch_id', false, true);
            $table->bigInteger('category_id', false, true);
            $table->float('berat');
            $table->integer('karat');
            $table->decimal('modal');
            $table->decimal('jual');
            $table->string('image_path')->nullable();
            $table->string('thumb_path')->nullable();
            $table->enum('type', ['IN', 'OUT']);
            $table->enum('status', ['AVAILABLE', 'TRANSIT', 'SOLD', 'REPAIR']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('t_inventories');
    }
};
