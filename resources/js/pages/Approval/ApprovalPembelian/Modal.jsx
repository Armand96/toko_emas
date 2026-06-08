import { useState, useEffect } from 'react';
import { Tag, TrendUp, CheckCircle, BarcodeIcon } from '@phosphor-icons/react';
import ModalCustom from '../../../components/modalCustom';
import InputGroup from '../../../components/FormElement/InputGroup';

export default function Modal({
    isOpen,
    onClose,
    onSubmitApprove,
    onSubmitReject,
    data,
    mode = 'view'
}) {
    const [formData, setFormData] = useState({
        nominal: '',
        catatan: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({ nominal: '', catatan: '' });
        }
    }, [isOpen, mode]);

    const formatRupiah = (number) => {
        if (!number) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const formFields = [
        {
            label: 'Catatan Approval',
            name: 'catatan',
            type: 'textArea',
            value: formData.catatan,
            onChange: handleChange,
            placeholder: 'Masukkan catatan jika ada'
        }
    ];

    return (
        <ModalCustom
            title={mode === 'approve' ? 'Approval Pembelian' : 'Detail Pembelian'}
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-3xl"
        >
            <div className="flex flex-col gap-4">
                <div className="flex gap-5">
                    <div className="w-32 h-32 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {data?.foto ? (
                            <img src={data.foto} alt="Foto Barang" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs text-neutral-400">Tidak ada foto</span>
                        )}
                    </div>

                    <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-bold text-neutral-900">{data?.nama_produk || 'Kalung Italy Rantai'}</h2>
                                <div className="flex items-center gap-1.5 text-sm text-neutral-500 mt-1">
                                    <BarcodeIcon size={16} weight="bold" />
                                    <span>{data?.sku || 'KAL-000006-001'}</span>
                                </div>
                            </div>
                            <span className="px-3 py-1 bg-success-50 text-success-700 text-sm font-medium rounded-md border border-success-200">
                                {data?.status || 'Disetujui'}
                            </span>
                        </div>

                        <div className="mt-4 grid  gap-y-2 text-sm">
                            <div className="flex">
                                <span className="w-24 text-neutral-500">Berat</span>
                                <span className="font-medium text-neutral-800">{data?.berat || '6.50 gr'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-24 text-neutral-500">Karat</span>
                                <span className="font-medium text-neutral-800">{data?.karat || '22 K'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-24 text-neutral-500">No. Seri</span>
                                <span className="font-medium text-neutral-800">{data?.no_seri || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-5 flex flex-col gap-4 mt-2">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                        <div className="w-1 h-4 bg-info-500 rounded-full"></div>
                        <h3 className="font-bold text-neutral-900">Informasi Detail</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Kategori</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.kategori || 'Perhiasan'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Sub Kategori</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.sub_kategori || 'Kalung'}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-neutral-500">Keterangan</span>
                        <span className="text-sm font-medium text-neutral-900">{data?.keterangan || 'Kalung rantai diameter 10cm dengan motif bunga mawar'}</span>
                    </div>

                    <hr className="border-dashed border-neutral-200 my-1" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Harga Modal</span>
                            <span className="text-sm font-medium text-neutral-900">{formatRupiah(data?.harga_modal || 5460000)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Harga Jual</span>
                            <span className="text-sm font-medium text-neutral-900">{formatRupiah(data?.harga_jual || 6440000)}</span>
                        </div>
                    </div>

                    <div className="bg-success-50 rounded-md p-3 flex justify-between items-center mt-1">
                        <span className="text-sm font-medium text-success-700">Margin keuntungan</span>
                        <div className="flex items-center gap-2 text-sm font-medium text-success-700">
                            <TrendUp size={16} weight="bold" />
                            {formatRupiah(data?.margin || 980000)} (+17.9%)
                        </div>
                    </div>

                    <hr className="border-dashed border-neutral-200 my-1" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Cabang</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.cabang || 'Blok M 1'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Bank Keluar</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.bank || '01 - BCA (03243435345)'}</span>
                        </div>
                    </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 flex items-center gap-6 text-sm">
                    <div className="flex gap-2">
                        <span className="text-neutral-500">Batch</span>
                        <span className="font-medium text-neutral-900">{data?.batch || '00001'}</span>
                    </div>
                    <div className="w-px h-4 bg-neutral-200"></div>
                    <div className="flex gap-2">
                        <span className="text-neutral-500">Diajukan oleh</span>
                        <span className="font-medium text-neutral-900">{data?.diajukan_oleh || 'Dianita Admin'}</span>
                    </div>
                    <div className="w-px h-4 bg-neutral-200"></div>
                    <div className="font-medium text-neutral-900">
                        {data?.tanggal_pengajuan || '21 Mei 2026, 12:00'}
                    </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                        <div className="w-1 h-4 bg-info-500 rounded-full"></div>
                        <h3 className="font-bold text-neutral-900">Approval</h3>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                        <CheckCircle size={24} weight="fill" className="text-success-500" />
                        <div className="font-medium text-neutral-900">
                            Disetujui oleh <span className="text-info-500">{data?.disetujui_oleh || 'Owner'}</span>
                            <span className="text-neutral-400 font-normal ml-2">• {data?.tanggal_disetujui || '21 Mei 2026, 12:00'}</span>
                        </div>
                    </div>
                </div>

                {mode === 'approve' && (
                    <div className="flex flex-col gap-4 pt-4 border-t border-neutral-200 mt-2">
                        <InputGroup cols="1" fields={formFields} formData={formData} onChange={handleChange} />
                    </div>
                )}
            </div>
        </ModalCustom>
    );
}
