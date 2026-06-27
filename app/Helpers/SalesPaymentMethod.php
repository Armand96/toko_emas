<?php

namespace App\Helpers;

enum SalesPaymentMethod: string
{
    case TUNAI = 'TUNAI';
    case TRANSFER = 'TRANSFER';
}
