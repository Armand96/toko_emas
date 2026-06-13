<?php

namespace App\Helpers;

enum SalesStatus: string
{
    case APPROVAL = 'APPROVAL';
    case CETAK_KWITANSI = 'CETAK KWITANSI';
    case DITOLAK = 'DITOLAK';
    case SELESAI = 'SELESAI';
}
