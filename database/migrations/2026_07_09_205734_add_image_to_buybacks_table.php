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
        Schema::table('buybacks', function (Blueprint $table) {
            $table->string('image_path')->nullable()->after('note');
            $table->string('thumb_path')->nullable()->after('image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('buybacks', function (Blueprint $table) {
            $table->dropColumn(['image_path', 'thumb_path']);
        });
    }
};
