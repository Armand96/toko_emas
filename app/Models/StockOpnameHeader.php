<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'kode_sesi',
    'branch_id',
    'total_item',
    'in_stock',
    'missing',
    'extra',
    'status',
    'start_date_time',
    'end_date_time',
])]
class StockOpnameHeader extends Model
{
    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }

    public function details()
    {
        return $this->hasMany(StockOpnameDetail::class, 'stockopname_header_id', 'id');
    }
}
