<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\HargaDasar;
use App\Models\HargaLogamMulia;
use App\Models\HargaPerhiasan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class HargaSettingController extends Controller
{
    public function index()
    {
        return ApiResponse::success($this->payload(), 'Success');
    }

    /**
     * Endpoint publik tanpa auth untuk halaman display harga.
     */
    public function publik()
    {
        return ApiResponse::success($this->payload(true), 'Success');
    }

    private function payload(bool $onlyActive = false): array
    {
        HargaPerhiasan::flushDasarCache();
        HargaLogamMulia::flushDasarCache();
        $dasar = HargaDasar::current();

        $perhiasan = HargaPerhiasan::query()
            ->when($onlyActive, fn ($q) => $q->where('is_active', true))
            ->orderBy('urutan')
            ->orderByDesc('karat')
            ->get();

        $logamMulia = HargaLogamMulia::query()
            ->when($onlyActive, fn ($q) => $q->where('is_active', true))
            ->orderBy('urutan')
            ->orderBy('berat')
            ->get();

        return [
            'dasar' => $dasar,
            'perhiasan' => $perhiasan,
            'logam_mulia' => $logamMulia,
        ];
    }

    /**
     * Simpan harga dasar + seluruh baris perhiasan & logam mulia dalam satu transaksi.
     * Baris yang tidak ikut terkirim dianggap dihapus.
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'harga_dasar_jual' => 'required|numeric|min:0',
            'harga_dasar_beli' => 'required|numeric|min:0',
            'harga_dasar_jual_lm' => 'required|numeric|min:0',
            'harga_dasar_beli_lm' => 'required|numeric|min:0',

            'perhiasan' => 'present|array',
            'perhiasan.*.id' => 'nullable|integer',
            // Desimal: toko memakai 24,999 untuk emas 99,9%.
            'perhiasan.*.karat' => 'required|numeric|min:1|max:24.999',
            'perhiasan.*.kadar' => 'required|numeric|min:0',
            'perhiasan.*.lb_jual' => 'required|numeric|min:0',
            'perhiasan.*.lb_beli' => 'required|numeric|min:0',
            'perhiasan.*.berat' => 'nullable|numeric|min:0',
            'perhiasan.*.is_active' => 'nullable|boolean',

            // harga_jual & harga_buyback logam mulia adalah turunan dari harga
            // dasar beli + margin, jadi tidak dikirim/disimpan.
            'logam_mulia' => 'present|array',
            'logam_mulia.*.id' => 'nullable|integer',
            'logam_mulia.*.berat' => 'required|numeric|min:0',
            'logam_mulia.*.is_active' => 'nullable|boolean',
        ]);

        try {
            DB::transaction(function () use ($validated) {
                HargaDasar::current()->update([
                    'harga_dasar_jual' => $validated['harga_dasar_jual'],
                    'harga_dasar_beli' => $validated['harga_dasar_beli'],
                    'harga_dasar_jual_lm' => $validated['harga_dasar_jual_lm'],
                    'harga_dasar_beli_lm' => $validated['harga_dasar_beli_lm'],
                ]);

                $this->syncRows(
                    HargaPerhiasan::class,
                    $validated['perhiasan'],
                    ['karat', 'kadar', 'lb_jual', 'lb_beli', 'berat', 'is_active']
                );

                $this->syncRows(
                    HargaLogamMulia::class,
                    $validated['logam_mulia'],
                    ['berat', 'is_active']
                );
            });

            return ApiResponse::success($this->payload(), 'Harga berhasil disimpan');
        } catch (\Throwable $th) {
            Log::error('HargaSettingController@bulkUpdate error', [
                'error' => $th->getMessage(),
                'trace' => $th->getTraceAsString(),
            ]);

            return ApiResponse::error($th->getMessage(), $th, 500);
        }
    }

    /**
     * Upsert baris yang dikirim, hapus baris lama yang tidak ada di payload.
     */
    private function syncRows(string $model, array $rows, array $fields): void
    {
        $keptIds = [];

        foreach ($rows as $index => $row) {
            $attributes = ['urutan' => $index];
            foreach ($fields as $field) {
                if (array_key_exists($field, $row)) {
                    $attributes[$field] = $row[$field];
                }
            }
            $attributes['is_active'] = $row['is_active'] ?? true;

            $record = ! empty($row['id'])
                ? $model::find($row['id'])
                : null;

            if ($record) {
                $record->update($attributes);
            } else {
                $record = $model::create($attributes);
            }

            $keptIds[] = $record->id;
        }

        $model::whereNotIn('id', $keptIds ?: [0])->delete();
    }
}
