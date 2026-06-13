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

    public function subcategories()
    {
        return $this->hasMany(
            MCategory::class,
            'parent_id',
            'id'
        );
    }

    public function parent()
    {
        return $this->belongsTo(
            MCategory::class,
            'parent_id',
            'id'
        );
    }
}
