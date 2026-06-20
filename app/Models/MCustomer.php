<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MCustomer extends Model
{
    protected $fillable = [
        'customer_name',
        'address',
        'phone_number',
        'is_active'
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];

    public function sales()
    {
        return $this->hasMany(TSales::class, 'customer_id', 'id');
    }
}
