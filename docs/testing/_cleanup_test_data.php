<?php
// Cleanup transactional rows created during deep testing.
// Keeps master data (products, categories, branches, banks, customers, suppliers, users).
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

$tables = [
    'stock_opname_details',
    'stock_opname_headers',
    'transfer_item_details',
    'transfer_items',
    'remove_item_details',
    'remove_items',
    't_sales_details',
    't_sales',
    'inventory_edit_histories',
    'inventories',
    'pembelians',
    'pembelian_batches',
];

DB::statement('SET FOREIGN_KEY_CHECKS=0;');
foreach ($tables as $t) {
    if (Schema::hasTable($t)) {
        $before = DB::table($t)->count();
        DB::table($t)->truncate();
        echo "Truncated $t (was $before rows)\n";
    } else {
        echo "SKIP (no table): $t\n";
    }
}

// Remove auto finance rows created during test; keep the 4 original 'Uang Awal' seed rows (is_auto=1 but id<=4).
$autoDeleted = DB::table('finances')->where('id', '>', 4)->delete();
echo "Deleted finances id>4: $autoDeleted rows\n";

DB::statement('SET FOREIGN_KEY_CHECKS=1;');
echo "CLEANUP DONE\n";
