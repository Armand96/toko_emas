<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tambah kolom `note_approval` terpisah dari `note` (catatan pengajuan)
     * supaya alasan approve/tolak/batalkan tidak menimpa catatan asli.
     */
    public function up(): void
    {
        Schema::table('remove_items', function (Blueprint $table) {
            $table->string('note_approval')->nullable()->after('note');
        });

        Schema::table('transfer_items', function (Blueprint $table) {
            $table->string('note_approval')->nullable()->after('note');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('remove_items', function (Blueprint $table) {
            $table->dropColumn('note_approval');
        });

        Schema::table('transfer_items', function (Blueprint $table) {
            $table->dropColumn('note_approval');
        });
    }
};
