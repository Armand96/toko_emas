<?php

namespace App\Helpers;

enum RemoveItemStatus: string
{
    case APPROVAL = 'APPROVAL';
    case DISETUJUI = 'DISETUJUI';
    case DITOLAK = 'DITOLAK';
    case DIBATALKAN = 'DIBATALKAN';
    case RETURN = 'RETURN';
}
