import { TimerIcon, CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import ModalCustom from '../../../components/modalCustom';
import ApprovalStatusCard from '../../../components/ApprovalStatusCard';

const APPROVAL_VIEW = {
    'Approval': { Icon: TimerIcon, iconColor: 'text-warning-500', statusText: 'Menunggu Approval oleh' },
    'Disetujui': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh' },
    'Ditolak': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Ditolak oleh' },
    'Dibatalkan': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Dibatalkan oleh' },
};

export default function ModalDetailPenjualan({
    isOpen,
    onClose,
    onSubmitApprove,
    onSubmitReject,
    data
}) {
    const formatRupiah = (number) => {
        if (!number) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    // Footer aksi hanya tampil saat transaksi masih menunggu approval
    const isPending = data?.status === 'Approval';
    const approvalView = APPROVAL_VIEW[data?.status] || APPROVAL_VIEW['Approval'];
    const customerBadge = data?.customer?.type || (data?.customer?.id ? 'Member Terdaftar' : 'Customer Baru');

    return (
        <ModalCustom
            title="Detail Penjualan"
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-3xl"
            footer={isPending}
            customFooter={
                <div className="flex justify-between items-center p-4 border-t border-neutral-200">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        Batal
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onSubmitReject}
                            className="px-6 py-2 bg-danger-500 text-white font-medium rounded-lg hover:bg-danger-600 transition-colors"
                        >
                            Tolak
                        </button>
                        <button
                            onClick={onSubmitApprove}
                            className="px-6 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            Setujui
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 border border-[#E2E8F0] p-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
                            <h3 className="font-bold text-neutral-900">Data Customer</h3>
                        </div>
                        <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-md">
                            {customerBadge}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">ID Customer</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.customer?.id || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">Nama Customer</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.customer?.nama || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">No. Handphone</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.customer?.phone || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">Alamat</span>
                            <span className="text-sm font-medium text-neutral-900">{data?.customer?.alamat || '-'}</span>
                        </div>
                    </div>
                </div>

                <hr className="border-neutral-200" />

                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
                            <h3 className="font-bold text-neutral-900">Keranjang Penjualan</h3>
                        </div>
                        <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-md">
                            {data?.items?.length || 0} item
                        </span>
                    </div>

                    <div className="flex flex-col gap-2 ">
                        {data?.items?.map((item, index) => (
                            <div key={index} className="flex justify-between items-center border border-neutral-200 rounded-lg p-3">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-neutral-500 bg-neutral-50 px-2 py-1 rounded border border-neutral-200">
                                        {item.sku}
                                    </span>
                                    <div className="w-10 h-10 bg-amber-100/50 rounded flex items-center justify-center text-xs text-amber-700">Img</div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-neutral-900">{item.nama}</span>
                                        <span className="text-xs text-neutral-500">{item.berat} • {item.karat}</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-neutral-900">{formatRupiah(item.harga)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="border-neutral-200" />

                <div className="flex flex-col gap-3 border border-[#E2E8F0] p-6 rounded-lg">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 ">
                            <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
                            <h3 className="font-bold text-neutral-900">Pembayaran</h3>
                        </div>
                        <span className="px-3 py-1 bg-neutral-100 text-neutral-600 text-xs font-medium rounded-md">
                            {data?.pembayaran || '-'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Sub Total</span>
                        <span className="font-medium text-neutral-900">{formatRupiah(data?.sub_total)}</span>
                    </div>
                    <hr className="border-dashed border-neutral-200" />
                    <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-neutral-900">Total</span>
                        <span className="text-neutral-900">{formatRupiah(data?.total)}</span>
                    </div>
                </div>

                <div className="flex gap-4 text-xs text-neutral-500 border border-[#E2E8F0] p-6 rounded-lg py-3 mt-2">
                    <div className="flex-1 border-r border-neutral-200 pr-4">
                        Order ID <span className="font-medium text-neutral-900 ml-1">{data?.order_id || '-'}</span>
                    </div>
                    <div className="flex-1 border-r border-neutral-200 px-4">
                        Diajukan oleh <span className="font-medium text-neutral-900 ml-1">{data?.diajukan_oleh || '-'}</span>
                    </div>
                    <div className="flex-1 pl-4 font-medium text-neutral-900">
                        {data?.tanggal_pengajuan || '-'}
                    </div>
                </div>

                {/* <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
                        <h3 className="font-bold text-neutral-900">Approval</h3>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Clock size={20} className="text-warning-500" weight="fill" />
                        <span className="font-medium text-neutral-900">Menunggu Approval</span>
                        <span className="text-neutral-500">oleh <span className="text-primary-500 font-medium">Owner</span></span>
                    </div>
                </div> */}

                <ApprovalStatusCard
                    status="Approval"
                    Icon={approvalView.Icon}
                    iconColor={approvalView.iconColor}
                    statusText={approvalView.statusText}
                    pic={data?.approval_by || 'Owner'}
                    date={data?.approval_date || '21 Mei 2026, 12:00'}
                    reasonLabel={data?.status === 'Ditolak' ? 'Alasan Penolakan' : 'Alasan Pembatalan'}
                    reason={data?.reason}
                />
            </div>
        </ModalCustom>
    );
}
