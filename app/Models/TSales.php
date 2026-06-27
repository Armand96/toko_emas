<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TSales extends Model
{
    protected $fillable = [
        'order_id',
        'customer_id',
        'branch_id',
        'created_by',
        'sub_total',
        'grand_total',
        'payment_type',
        'sender_name',
        'sender_rekening',
        'sender_bank_id',
        'receiver_bank_id',
        'approval_status',
        'nominal_paid',
        'exchange',
        'note',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function details()
    {
        return $this->hasMany(TSalesDetail::class, 'sales_id', 'id');
    }

    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }

    public function customer()
    {
        return $this->belongsTo(MCustomer::class, 'customer_id', 'id');
    }

    public function senderBank()
    {
        return $this->belongsTo(BankCabang::class, 'sender_bank_id', 'id');
    }

    public function receiverBank()
    {
        return $this->belongsTo(BankCabang::class, 'receiver_bank_id', 'id');
    }
}
