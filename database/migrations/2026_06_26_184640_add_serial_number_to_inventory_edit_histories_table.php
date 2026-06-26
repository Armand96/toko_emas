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
        Schema::table('inventory_edit_histories', function (Blueprint $table) {
            $table->string('serial_number')->nullable()->after('note');
        });
    }

    public function down(): void
    {
        Schema::table('inventory_edit_histories', function (Blueprint $table) {
            $table->dropColumn('serial_number');
        });
    }
};
