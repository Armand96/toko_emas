<?php

namespace App\Helpers;

enum InventoryStatus
{
    case AVAILABLE;
    case TRANSIT;
    case SOLD;
    case REPAIR;
}
