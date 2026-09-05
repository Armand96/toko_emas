<?php

namespace App\Helpers;

enum RemoveItemJenis: string
{
    case HILANG = 'HILANG';
    case REPAIR = 'REPAIR';
    case SALAH_INPUT = 'SALAH_INPUT';
}
