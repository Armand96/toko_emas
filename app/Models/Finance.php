<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'branch_id',
    'category_finance_id',
    'bank_cabang_id',
    'type',
    'payment_method',
    'nominal',
    'note',
    'attachment',
])]
class Finance extends Model
{
    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }

    public function bank()
    {
        return $this->belongsTo(BankCabang::class, 'bank_cabang_id', 'id');
    }

    public function category()
    {
        return $this->belongsTo(MCategoryFinance::class, 'category_finance_id', 'id');
    }
}
