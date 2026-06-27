<?php
echo "=== USERS ===\n";
foreach (App\Models\User::orderBy('id')->get() as $u) {
    echo $u->id . " | " . $u->username . " | role_id=" . $u->role_id . " | branch_id=" . ($u->branch_id ?? 'null') . " | active=" . $u->is_active . " | phone=" . ($u->phone_number ?? '-') . "\n";
}
echo "\n=== ROLES ===\n";
foreach (DB::table('roles')->get() as $r) {
    echo $r->id . " | " . $r->role_name . "\n";
}
echo "\n=== BRANCHES ===\n";
foreach (App\Models\MBranch::orderBy('id')->get() as $b) {
    echo $b->id . " | " . $b->branch_name . " | code=" . $b->branch_code . " | active=" . $b->is_active . "\n";
}
echo "\n=== BANK CABANG ===\n";
foreach (DB::table('bank_cabangs')->get() as $bc) {
    echo $bc->id . " | branch=" . $bc->branch_id . " | bank=" . $bc->bank_id . " | active=" . $bc->is_active . "\n";
}
echo "\n=== COUNTS ===\n";
echo "products=" . DB::table('m_products')->count() . "\n";
echo "categories=" . DB::table('m_categories')->count() . "\n";
echo "suppliers active=" . DB::table('m_suppliers')->where('is_active',1)->count() . " total=" . DB::table('m_suppliers')->count() . "\n";
echo "customers=" . DB::table('m_customers')->count() . "\n";
echo "inventory total=" . DB::table('inventories')->count() . "\n";
foreach (DB::table('inventories')->select('status', DB::raw('count(*) as c'))->groupBy('status')->get() as $s) {
    echo "  inv status " . $s->status . " = " . $s->c . "\n";
}
echo "pembelian=" . DB::table('pembelians')->count() . "\n";
echo "sales=" . DB::table('t_sales')->count() . "\n";
echo "finances=" . DB::table('finances')->count() . "\n";
