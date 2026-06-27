<?php

namespace App\Helpers;

enum OpnameDetailStatus: string
{
    case INSTOCK = 'INSTOCK';
    case EXTRA = 'EXTRA';
    case MISSING = 'MISSING';
}
