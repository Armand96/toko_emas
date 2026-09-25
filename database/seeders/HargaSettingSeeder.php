<?php

namespace Database\Seeders;

use App\Models\HargaDasar;
use App\Models\HargaLogamMulia;
use App\Models\HargaPerhiasan;
use Illuminate\Database\Seeder;

class HargaSettingSeeder extends Seeder
{
    public function run(): void
    {
        HargaDasar::updateOrCreate(['id' => 1], [
            'harga_dasar_jual' => 2480000,
            'harga_dasar_beli' => 2277000,
        ]);

        // lb_beli diinput manual per karat; lb_jual turun linier 1/24 tiap karat.
        $lbBeli = [
            24 => 0.94, 23 => 0.88, 22 => 0.84, 21 => 0.80, 20 => 0.76,
            19 => 0.72, 18 => 0.68, 17 => 0.65, 16 => 0.63, 15 => 0.57,
            14 => 0.54, 13 => 0.50, 12 => 0.45, 11 => 0.41, 10 => 0.37,
            9 => 0.32, 8 => 0.25, 7 => 0.22, 6 => 0.15,
        ];

        $urutan = 0;
        foreach ($lbBeli as $karat => $beli) {
            // Excel: kadar = karat/24, lb_jual = kadar + 0,12.
            // Baris 24K di-override manual (kadar 0,990 & LB 1,12).
            $kadar = $karat === 24 ? 0.99 : $karat / 24;
            $lbJual = $karat === 24 ? 1.12 : $kadar + 0.12;

            HargaPerhiasan::updateOrCreate(['karat' => $karat], [
                'kadar' => round($kadar, 8),
                'lb_jual' => round($lbJual, 8),
                'lb_beli' => $beli,
                'berat' => 1,
                'urutan' => $urutan++,
                'is_active' => true,
            ]);
        }

        $logamMulia = [
            [0.5, 1463000, 1200000],
            [1, 2740000, 2400000],
            [2, 5428000, 4800000],
            [3, 8123000, 7200000],
            [5, 13250000, 11950000],
            [10, 26419000, 23900000],
            [25, 65878000, 59750000],
            [50, 131587000, 119500000],
            [100, 263360000, 239000000],
        ];

        foreach ($logamMulia as $urutan => [$berat, $jual, $buyback]) {
            HargaLogamMulia::updateOrCreate(['berat' => $berat], [
                'harga_jual' => $jual,
                'harga_buyback' => $buyback,
                'urutan' => $urutan,
                'is_active' => true,
            ]);
        }
    }
}
