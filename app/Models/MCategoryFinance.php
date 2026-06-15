<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;
#[Fillable([
    'category_name',
    'is_active'
])]
#[Hidden([
    'created_at',
    'updated_at'
])]
class MCategoryFinance extends Model
{
    //
}
