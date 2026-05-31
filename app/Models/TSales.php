<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TSales extends Model
{
    protected $fillable = [
        'customer_id',
        'branch_id',
        'created_by',
        'approval_id',
        'sub_total',
        'grand_total',
        'payment_type',
        'sender_name',
        'approval_status',
    ];

    public function details()
    {
        return $this->hasMany(TSalesDetail::class, 'sales_id', 'id');
    }
}
