<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'kode_transfer',
    'branch_source_id',
    'branch_dest_id',
    'created_by',
    'status',
    'note',
    'note_approval',
])]
class TransferItem extends Model
{
    public function branchSource()
    {
        return $this->belongsTo(MBranch::class, 'branch_source_id', 'id');
    }

    public function branchDest()
    {
        return $this->belongsTo(MBranch::class, 'branch_dest_id', 'id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function details()
    {
        return $this->hasMany(TransferItemDetail::class, 'transfer_item_id', 'id');
    }
}
