<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StoreSetting extends Model
{
    protected $hidden = [
        'shop_name',
        'website',
        'email',
        'image_path',
        'thumb_path'
    ];
}
