<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TApproval extends Model
{
    protected $fillable = [
        'order_id',
        'customer_id',
        'product_id',
        'branch_id',
        'nominal',
        'created_by',
        'payment_type',
        'approval_type',
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];

    public function product()
    {
        return $this->belongsTo(MProduct::class, 'product_id', 'id');
    }
}
