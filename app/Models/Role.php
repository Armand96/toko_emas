<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['role_name'])]
#[Hidden(['created_at', 'updated_at'])]
class Role extends Model
{
    //
}
