import { useEffect, useState } from 'react';
import { TrendUpIcon, TrendDownIcon, BarcodeIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import ModalCustom from '../../../components/modalCustom';
import ApprovalStatusCard from '../../../components/ApprovalStatusCard';
import Badge from '../../../components/Badge';
import HelperFunctions from '../../../utils/HelperFunctions';
import OptionsStore from '../../../Store/OptionsStore';

export default function ModalView({ isOpen, onClose, data }) {
    const ensureCategories = OptionsStore((s) => s.ensureCategories);
    const [categoryOptions, setCategoryOptions] = useState([]);

    const statusMap = {
        'APPROVAL': { label: 'Approval', tone: 'warning' },
        'DISETUJUI': { label: 'Disetujui', tone: 'success' },
        'DITOLAK': { label: 'Ditolak', tone: 'danger' },
        'DIBATALKAN': { label: 'Dibatalkan', tone: 'danger' },
    };
    const status = statusMap[data?.status] || { label: data?.status || '-', tone: 'gray' };

    const margin = (data?.jual || 0) - (data?.modal || 0);
    const marginPercent = data?.modal ? ((margin / data.modal) * 100).toFixed(1) : 0;

    useEffect(() => {
        ensureCategories()
            .then((data) => setCategoryOptions(HelperFunctions.formatDropdown(data, "id", "category_name")))
            .catch((err) => console.error(err));
    }, []);

    const resolvedCategory = (() => {
        if (data?.subcategory) {
            return {
                kategori: data.category?.category_name || '-',
                subKategori: data.subcategory.category_name || '-',
            };
        }
        const category = categoryOptions.find((c) => c.value === data?.category_id)?.details;
        const isSubCategory = category?.parent_id !== null && category?.parent_id !== undefined;
        const parentCategory = isSubCategory
            ? categoryOptions.find((c) => c.value === category.parent_id)?.details
            : category;
        return {
            kategori: parentCategory?.category_name || '-',
            subKategori: isSubCategory ? category?.category_name : '-',
        };
    })();

    const bankCabang = data?.bank_cabang || null;

    return (
        <ModalCustom
            title="Detail Pembelian"
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-3xl"
            footer={false}
        >
            <div className="flex flex-col gap-4">
                <div className="flex gap-5">
                    <div className="w-32 h-32 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {data?.image_path ? (
                            <img src={`/storage/${data.image_path}`} alt="Foto Barang" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-xs text-neutral-400">Tidak ada foto</span>
                        )}
                    </div>

                    <div className="flex flex-col flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-lg font-bold text-neutral-900">{data?.product?.product_name || '-'}</h2>
                                <div className="flex items-center gap-1.5 text-sm text-neutral-500 mt-1">
                                    <BarcodeIcon size={16} weight="bold" />
                                    <span>{data?.inventory_code || '-'}</span>
                                </div>
                            </div>
                            <Badge tone={status.tone} className="!text-sm">
                                {status.label}
                            </Badge>
                        </div>

                        <div className="mt-4 grid gap-y-2 text-sm">
                            <div className="flex">
                                <span className="w-24 text-neutral-500">Berat</span>
                                <span className="font-medium text-neutral-800">{data?.berat ? `${data.berat} gr` : '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-24 text-neutral-500">Karat</span>
                                <span className="font-medium text-neutral-800">{data?.karat ? `${data.karat} K` : '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-24 text-neutral-500">No. Seri</span>
                                <span className="font-medium text-neutral-800">{data?.serial_number || data?.no_seri || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-5 flex flex-col gap-4 mt-2">
                    <div className="flex items-center gap-2 border-b border-neutral-100 pb-3">
                        <div className="w-1 h-4 bg-info-500 rounded-full"></div>
                        <h3 className="font-semibold text-neutral-900 text-sm">Informasi Detail</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Kategori</span>
                            <span className="text-sm font-medium text-neutral-900">{resolvedCategory.kategori}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Sub Kategori</span>
                            <span className="text-sm font-medium text-neutral-900">{resolvedCategory.subKategori}</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <span className="text-sm text-neutral-500">Keterangan</span>
                        <span className="text-sm font-medium text-neutral-900">{data?.product?.description || '-'}</span>
                    </div>

                    <hr className="border-dashed border-neutral-200 my-1" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Harga Modal</span>
                            <span className="text-sm font-medium text-neutral-900">{HelperFunctions.formatCurrency(data?.modal)}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Harga Jual</span>
                            <span className="text-sm font-medium text-neutral-900">{HelperFunctions.formatCurrency(data?.jual)}</span>
                        </div>
                    </div>

                    <div className={`rounded-md p-3 flex justify-between items-center mt-1 ${margin < 0 ? 'bg-danger-50' : 'bg-success-50'}`}>
                        <span className={`text-sm font-medium ${margin < 0 ? 'text-danger-700' : 'text-success-700'}`}>Margin keuntungan</span>
                        <div className={`flex items-center gap-2 text-sm font-medium ${margin < 0 ? 'text-danger-700' : 'text-success-700'}`}>
                            {margin < 0 ? <TrendDownIcon size={16} weight="bold" /> : <TrendUpIcon size={16} weight="bold" />}
                            {HelperFunctions.formatCurrency(margin)} ({margin < 0 ? '' : '+'}{marginPercent}%)
                        </div>
                    </div>

                    <hr className="border-dashed border-neutral-200 my-1" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Cabang</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.branch?.branch_name || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Supplier</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.supplier?.supplier_name || '-'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Metode Bayar</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.tipe_pembayaran === 'TUNAI' ? 'Tunai' : data?.tipe_pembayaran === 'TRANSFER' ? 'Transfer' : data?.tipe_pembayaran || '-'}</span>
                        </div>
                        {data?.tipe_pembayaran === 'TRANSFER' && (
                            <div className="flex flex-col gap-1">
                                <span className="text-sm text-neutral-500">Bank Keluar</span>
                                <span className="text-sm font-medium text-neutral-900">
                                    {bankCabang?.bank?.bank_name || '-'}
                                    {bankCabang?.nomor_rekening ? ` (${bankCabang.nomor_rekening})` : ''}
                                </span>
                                {bankCabang?.nama_pemilik && (
                                    <span className="text-xs text-neutral-500">a.n. {bankCabang.nama_pemilik}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 flex items-center gap-6 text-sm">
                    <div className="flex gap-2">
                        <span className="text-neutral-500">Batch</span>
                        <span className="font-medium text-neutral-900">{data?.batch}</span>
                    </div>
                    <div className="w-px h-4 bg-neutral-200"></div>
                    <div className="flex gap-2">
                        <span className="text-neutral-500">Diajukan oleh</span>
                        <span className="font-medium text-neutral-900">{data?.user?.name || '-'}</span>
                    </div>
                    <div className="w-px h-4 bg-neutral-200"></div>
                    <div className="font-medium text-neutral-900">
                        {data?.created_at ? dayjs(data.created_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    </div>
                </div>

                <ApprovalStatusCard
                    status="Approval"
                    Icon={data?.status === 'DISETUJUI' ? CheckCircleIcon : (data?.status === 'DITOLAK' || data?.status === 'DIBATALKAN') ? XCircleIcon : ClockIcon}
                    iconColor={data?.status === 'DISETUJUI' ? 'text-success-500' : (data?.status === 'DITOLAK' || data?.status === 'DIBATALKAN') ? 'text-danger-500' : 'text-warning-500'}
                    statusText={data?.status === 'DISETUJUI' ? 'Disetujui oleh' : data?.status === 'DITOLAK' ? 'Ditolak oleh' : data?.status === 'DIBATALKAN' ? 'Dibatalkan oleh' : 'Menunggu Approval oleh'}
                    pic={data?.approved_by || 'Owner'}
                    date={data?.updated_at ? dayjs(data.updated_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    reasonLabel={data?.status === 'DITOLAK' ? 'Alasan Penolakan' : data?.status === 'DIBATALKAN' ? 'Alasan Pembatalan' : null}
                    reason={(data?.status === 'DITOLAK' || data?.status === 'DIBATALKAN') ? data?.note : null}
                />
            </div>
        </ModalCustom>
    );
}
