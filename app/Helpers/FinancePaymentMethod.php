<?php

namespace App\Helpers;

enum FinancePaymentMethod: string
{
    case CASH = 'CASH';
    case TRANSFER = 'TRANSFER';
}
