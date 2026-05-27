<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MCategory extends Model
{
    protected $fillable = [
        'category_name',
        'description',
        'parent_id',
        'image_path',
        'thumb_path'
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];
}
