<?php

namespace App\Helpers;

enum ApprovalStatus: string
{
    case APPROVAL = 'APPROVAL';
    case APPROVED = 'APPROVED';
    case REJECT = 'REJECT';
}
