<?php

namespace App\Helpers;

enum FinancePaymentMethod: string
{
    case TUNAI = 'TUNAI';
    case TRANSFER = 'TRANSFER';
}
