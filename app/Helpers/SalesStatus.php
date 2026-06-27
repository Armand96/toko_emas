<?php

namespace App\Helpers;

enum SalesStatus: string
{
    case APPROVAL = 'APPROVAL';
    case CETAK_KWITANSI = 'CETAK KWITANSI';
    case DISETUJUI = 'DISETUJUI';
    case DITOLAK = 'DITOLAK';
    case DIBATALKAN = 'DIBATALKAN';
    case SELESAI = 'SELESAI';
}
