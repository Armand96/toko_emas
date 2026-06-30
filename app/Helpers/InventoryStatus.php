<?php

namespace App\Helpers;

enum InventoryStatus: string
{
    case AVAILABLE = 'AVAILABLE';
    case PENDING = 'PENDING';
    case TRANSIT = 'TRANSIT';
    case SOLD = 'SOLD';
    case REPAIR = 'REPAIR';
    case LOST = 'LOST';
}
