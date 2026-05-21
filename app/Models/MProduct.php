<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MProduct extends Model
{
    protected $fillable = [
        'product_name',
        'branch_id',
        'category_id',
        'deskripsi',
        'is_active',
        'image_path',
        'thumb_path'
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];
}
