<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'code',
    'branch_id',
    'created_by',
    'note',
    'note_approval',
    'jenis',
    'status',
])]
class RemoveItem extends Model
{
    public function details()
    {
        return $this->hasMany(RemoveItemDetail::class, 'remove_header_id', 'id');
    }

    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }
}
