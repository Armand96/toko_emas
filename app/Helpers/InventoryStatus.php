<?php

namespace App\Helpers;

enum InventoryStatus: string
{
    case AVAILABLE = 'AVAILABLE';
    case TRANSIT = 'TRANSIT';
    case SOLD = 'SOLD';
    case REPAIR = 'REPAIR';
}
