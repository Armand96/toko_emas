<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'product_id',
    'branch_id'
])]
class BranchProduct extends Model
{
    public function header()
    {
        return $this->belongsTo(MProduct::class, 'product_id', 'id');
    }

    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }
}
