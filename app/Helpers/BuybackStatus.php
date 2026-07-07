<?php

namespace App\Helpers;

enum BuybackStatus: string
{
    case APPROVAL = 'APPROVAL';
    case CETAK_KWITANSI = 'CETAK KWITANSI';
    case SELESAI = 'SELESAI';
    case DITOLAK = 'DITOLAK';
    case DIBATALKAN = 'DIBATALKAN';
}
