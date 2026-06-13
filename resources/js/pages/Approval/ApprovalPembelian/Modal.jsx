import { TrendUpIcon, TrendDownIcon, BarcodeIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import ModalCustom from '../../../components/modalCustom';
import ApprovalStatusCard from '../../../components/ApprovalStatusCard';
import HelperFunctions from '../../../utils/HelperFunctions';

export default function Modal({
    isOpen,
    onClose,
    onSubmitApprove,
    onSubmitReject,
    data,
    mode = 'view'
}) {
    const statusMap = {
        'APPROVAL': { label: 'Approval', style: 'bg-warning-50 text-warning-700 border-warning-200' },
        'DISETUJUI': { label: 'Disetujui', style: 'bg-success-50 text-success-700 border-success-200' },
        'DITOLAK': { label: 'Ditolak', style: 'bg-danger-50 text-danger-700 border-danger-200' },
        'DIBATALKAN': { label: 'Dibatalkan', style: 'bg-danger-50 text-danger-700 border-danger-200' },
    };
    const status = statusMap[data?.status] || { label: data?.status || '-', style: 'bg-gray-50 text-gray-700 border-gray-200' };

    const margin = (data?.jual || 0) - (data?.modal || 0);
    const marginPercent = data?.modal ? ((margin / data.modal) * 100).toFixed(1) : 0;

    return (
        <ModalCustom
            title={mode === 'approve' ? 'Approval Pembelian' : 'Detail Pembelian'}
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-3xl"
            footer={mode === 'approve' && data?.status === 'APPROVAL'}
            customFooter={
                <div className="flex justify-end gap-3 px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-outline px-4 rounded-lg py-2"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onSubmitReject}
                        className="btn-danger flex items-center gap-2 rounded-lg py-2 px-4"
                    >
                        <XCircleIcon size={18} weight="bold" /> Tolak
                    </button>
                    <button
                        type="button"
                        onClick={onSubmitApprove}
                        className="btn-primary flex items-center gap-2 rounded-lg py-2 px-4"
                    >
                        <CheckCircleIcon size={18} weight="bold" /> Setujui
                    </button>
                </div>
            }
        >
            <div className="flex flex-col gap-4">
                <div className="flex gap-5">
                    <div className="w-32 h-32 bg-neutral-50 rounded-lg border border-neutral-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {data?.product?.image_path ? (
                            <img src={`/storage/${data.product.image_path}`} alt="Foto Barang" className="w-full h-full object-cover" />
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
                                    <span>{data?.barcode || '-'}</span>
                                </div>
                            </div>
                            <span className={`px-3 py-1 text-sm font-medium rounded-md border ${status.style}`}>
                                {status.label}
                            </span>
                        </div>

                        <div className="mt-4 grid  gap-y-2 text-sm">
                            <div className="flex">
                                <span className="w-24 text-neutral-500">Berat</span>
                                <span className="font-medium text-neutral-800">{data?.berat ? `${data.berat} gr` : '-'}</span>
                            </div>
                            <div className="flex">
                                <span className="w-24 text-neutral-500">Karat</span>
                                <span className="font-medium text-neutral-800">{data?.karat ? `${data.karat} K` : '-'}</span>
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
                            <span className="text-sm font-medium text-neutral-900">{data?.category?.category_name || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-sm text-neutral-500">Sub Kategori</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.category?.parent_id ? data?.category?.category_name : '-'}</span>
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
                            <span className="text-sm text-neutral-500">Bank Keluar</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.bank?.bank_name || '-'}</span>
                        </div>
                    </div>
                </div>

                <div className="border border-neutral-200 rounded-lg p-4 flex items-center gap-6 text-sm">
                    <div className="flex gap-2">
                        <span className="text-neutral-500">Batch</span>
                        <span className="font-medium text-neutral-900">{data?.batch ? String(data.batch).padStart(5, '0') : '-'}</span>
                    </div>
                    <div className="w-px h-4 bg-neutral-200"></div>
                    <div className="font-medium text-neutral-900">
                        {data?.created_at ? dayjs(data.created_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    </div>
                </div>

                <ApprovalStatusCard
                    status="Approval"
                    Icon={data?.status === 'DISETUJUI' ? CheckCircleIcon : data?.status === 'DITOLAK' ? XCircleIcon : ClockIcon}
                    iconColor={data?.status === 'DISETUJUI' ? 'text-success-500' : data?.status === 'DITOLAK' ? 'text-danger-500' : 'text-warning-500'}
                    statusText={data?.status === 'DISETUJUI' ? 'Disetujui oleh' : data?.status === 'DITOLAK' ? 'Ditolak oleh' : 'Menunggu Approval oleh'}
                    pic={data?.approved_by || 'Owner'}
                    date={data?.updated_at ? dayjs(data.updated_at).format('DD MMMM YYYY, HH:mm') : '-'}
                />
            </div>
        </ModalCustom>
    );
}
