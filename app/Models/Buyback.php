<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Buyback extends Model
{
    protected $fillable = [
        'buyback_code',
        'customer_id',
        'branch_id',
        'created_by',
        'sub_total',
        'grand_total',
        'payment_type',
        'receiver_name',
        'receiver_bank_name',
        'receiver_rekening',
        'sender_bank_id',
        'status',
        'note',
        'image_path',
        'thumb_path',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function customer()
    {
        return $this->belongsTo(MCustomer::class, 'customer_id', 'id');
    }

    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }

    public function senderBank()
    {
        return $this->belongsTo(BankCabang::class, 'sender_bank_id', 'id');
    }


    public function details()
    {
        return $this->hasMany(BuybackDetail::class, 'buyback_id', 'id');
    }

    public function inventories()
    {
        return $this->hasMany(Inventory::class, 'buyback_id', 'id');
    }
}
