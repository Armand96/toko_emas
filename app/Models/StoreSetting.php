<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    protected $fillable = [
        'shop_name',
        'website',
        'email',
        'image_path',
        'thumb_path'
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];
}
