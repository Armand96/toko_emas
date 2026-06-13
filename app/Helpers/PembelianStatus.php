<?php

namespace App\Helpers;

enum PembelianStatus: string
{
    case APPROVAL = 'APPROVAL';
    case DISETUJUI = 'DISETUJUI';
    case DITOLAK = 'DITOLAK';
    case DIBATALKAN = 'DIBATALKAN';
}
