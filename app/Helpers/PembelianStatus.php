<?php

namespace App\Helpers;

enum PembelianStatus
{
    case APPROVAL;
    case DISETUJUI;
    case DITOLAK;
    case DIBATALKAN;
}
