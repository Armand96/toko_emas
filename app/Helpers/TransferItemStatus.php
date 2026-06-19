<?php

namespace App\Helpers;

enum TransferItemStatus: string
{
    case APPROVAL = 'APPROVAL';
    case DISETUJUI = 'DISETUJUI';
    case DITOLAK = 'DITOLAK';
    case DIBATALKAN = 'DIBATALKAN';
}
