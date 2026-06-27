<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Test users per role for RBAC testing. All password = 'password'.
$users = [
    ['username' => 'owner',    'name' => 'Owner Test',    'role_id' => 2, 'branch_id' => 1, 'phone_number' => '081100000002'],
    ['username' => 'pic',      'name' => 'PIC Test',      'role_id' => 3, 'branch_id' => 1, 'phone_number' => '081100000003'],
    ['username' => 'kasirjkt', 'name' => 'Kasir Jakarta', 'role_id' => 4, 'branch_id' => 1, 'phone_number' => '081100000041'],
    ['username' => 'kasirbgr', 'name' => 'Kasir Bogor',   'role_id' => 4, 'branch_id' => 2, 'phone_number' => '081100000042'],
    ['username' => 'kasironaktif', 'name' => 'Kasir Nonaktif', 'role_id' => 4, 'branch_id' => 4, 'phone_number' => '081100000043', 'is_active' => 0],
];

foreach ($users as $u) {
    $existing = User::where('username', $u['username'])->first();
    $data = array_merge([
        'is_active' => 1,
        'email'     => $u['username'] . '@mail.com',
        'password'  => Hash::make('password'),
    ], $u);
    if ($existing) {
        $existing->update($data);
        echo "UPDATED: " . $u['username'] . " (id=" . $existing->id . ", role=" . $u['role_id'] . ", branch=" . $u['branch_id'] . ")\n";
    } else {
        $created = User::create($data);
        echo "CREATED: " . $u['username'] . " (id=" . $created->id . ", role=" . $u['role_id'] . ", branch=" . $u['branch_id'] . ")\n";
    }
}
echo "DONE. All passwords = 'password'\n";
