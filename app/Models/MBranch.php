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
        'image_path',
        'thumb_path',
        'branch_open_date',
        'is_active'
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];
}
