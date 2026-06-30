<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $fillable = [
        'inventory_code',
        'product_id',
        'category_id',
        'subcategory_id',
        'pembelian_id',
        'branch_id',
        'barcode',
        'berat',
        'karat',
        'modal',
        'jual',
        'image_path',
        'thumb_path',
        'status',
        'note',
        'serial_number'
    ];

    // protected $hidden = [
    //     // 'created_at',
    //     'updated_at'
    // ];

    public function product()
    {
        return $this->belongsTo(MProduct::class, 'product_id', 'id');
    }

    public function branch()
    {
        return $this->belongsTo(MBranch::class, 'branch_id', 'id');
    }

    public function category()
    {
        return $this->belongsTo(MCategory::class, 'category_id', 'id');
    }

    public function subCategory()
    {
        return $this->belongsTo(MCategory::class, 'subcategory_id', 'id');
    }

    public function sales()
    {
        return $this->hasOne(TSalesDetail::class, 'inventory_code', 'inventory_code');
    }

    public function pembelian()
    {
        return $this->hasOne(Pembelian::class, 'inventory_code', 'inventory_code');
    }

    public function transfer()
    {
        return $this->hasOne(TransferItem::class, 'inventory_code', 'inventory_code');
    }

    public function remove()
    {
        return $this->hasOne(RemoveItem::class, 'inventory_code', 'inventory_code');
    }

    public function stockOpnameData()
    {
        return $this->hasMany(StockOpnameDetail::class, 'inventory_code', 'inventory_code');
    }

    public function editHistories()
    {
        return $this->hasMany(InventoryEditHistory::class, 'inventory_id', 'id');
    }

    // Riwayat lengkap: item bisa ditransfer/dihapus berkali-kali sepanjang waktu,
    // beda dengan transfer()/remove() yang hasOne dan hanya ambil 1 record.
    public function transferDetails()
    {
        return $this->hasMany(TransferItemDetail::class, 'inventory_code', 'inventory_code');
    }

    public function removeDetails()
    {
        return $this->hasMany(RemoveItemDetail::class, 'inventory_code', 'inventory_code');
    }

    public function salesDetail()
    {
        return $this->hasOne(TSalesDetail::class, 'inventory_code', 'inventory_code');
    }
}
