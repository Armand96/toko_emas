<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MBranch extends Model
{
    protected $fillable = [
        'branch_name',
        'branch_code',
        'address',
        'pic',
        'lokasi_cabang',
        'branch_open_date',
        'is_active'
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];

    public function bankcabang()
    {
        return $this->hasOne(BankCabang::class, 'bank_id', 'id');
    }

    public function pic()
    {
        return $this->hasOne(User::class, 'pic', 'id');
    }
}
