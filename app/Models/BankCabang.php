<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'branch_id',
    'bank_id',
    'nomor_rekening',
    'nama_pemilik',
    'is_active',
])]
#[Hidden(['created_at', 'updated_at'])]
class BankCabang extends Model
{
    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }

    public function bank()
    {
        return $this->belongsTo(MBank::class, 'bank_id', 'id');
    }
}
