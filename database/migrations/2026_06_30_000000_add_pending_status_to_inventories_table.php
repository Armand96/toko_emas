<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE inventories MODIFY COLUMN status ENUM('AVAILABLE', 'PENDING', 'TRANSIT', 'SOLD', 'REPAIR', 'LOST') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("UPDATE inventories SET status = 'AVAILABLE' WHERE status = 'PENDING'");
        DB::statement("ALTER TABLE inventories MODIFY COLUMN status ENUM('AVAILABLE', 'TRANSIT', 'SOLD', 'REPAIR', 'LOST') NOT NULL");
    }
};
