import { TimerIcon, CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import ModalCustom from '../../../components/modalCustom';
import ApprovalStatusCard from '../../../components/ApprovalStatusCard';
import HelperFunctions from '../../../utils/HelperFunctions';

const APPROVAL_VIEW = {
    'APPROVAL': { Icon: TimerIcon, iconColor: 'text-warning-500', statusText: 'Menunggu Approval oleh', reason: null },
    'DISETUJUI': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh', reason: null },
    'DITOLAK': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Ditolak oleh', reasonLabel: 'Alasan Penolakan' },
    'DIBATALKAN': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Dibatalkan oleh', reasonLabel: 'Alasan Pembatalan' },
};

export default function ModalDetailTransfer({
    isOpen,
    onClose,
    onSubmitApprove,
    onSubmitReject,
    data,
    productMap = {},
}) {
    const details = data?.details || [];
    const items = details.map((d) => {
        const inv = d.inventory || {};
        return {
            kode: d.inventory_code,
            image: inv.image_path ? HelperFunctions.getStorageUrl(inv.image_path) : null,
            nama: productMap[d.product_id] || d.product?.product_name || d.product?.name || inv.product?.product_name || '-',
            berat: inv.berat ? `${inv.berat}g` : '-',
            karat: inv.karat || '-',
            harga_jual: inv.jual || 0,
        };
    });

    const isPending = data?.status === 'APPROVAL';
    const view = APPROVAL_VIEW[data?.status] || APPROVAL_VIEW['APPROVAL'];

    const branchSource = data?.branch_source?.branch_name || data?.branch_source?.name || '-';
    const branchDest = data?.branch_dest?.branch_name || data?.branch_dest?.name || '-';
    const createdBy = data?.user?.name || '-';
    const tanggalPengajuan = data?.created_at
        ? new Date(data.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-';
    const tanggalApproval = data?.updated_at
        ? new Date(data.updated_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : '-';

    return (
        <ModalCustom
            title="Detail Transfer Item"
            isOpen={isOpen}
            onClose={onClose}
            footer={isPending}
            customFooter={
                <div className="flex justify-between items-center px-6 py-4 border-t border-neutral-200">
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
            <div className="flex flex-col gap-5">

                {/* ── INFORMASI TRANSFER ── */}
                <div className="flex flex-col gap-3 border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary-500 rounded-full flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-sm">Informasi Transfer</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-400">Cabang Asal</span>
                            <span className="text-sm font-medium text-gray-900">{branchSource}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-400">Cabang Tujuan</span>
                            <span className="text-sm font-medium text-gray-900">{branchDest}</span>
                        </div>
                        {data?.note && (
                            <div className="col-span-2 flex flex-col gap-0.5">
                                <span className="text-xs text-gray-400">Catatan</span>
                                <span className="text-sm font-medium text-gray-900">{data.note}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── DAFTAR BARANG ── */}
                <div className="flex flex-col gap-3 border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary-500 rounded-full flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-sm">Daftar Barang</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        {items.length > 0 ? items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-white">
                                <span className="px-3 py-1 bg-gray-50 rounded text-xs font-medium text-gray-500 border border-gray-200 flex-shrink-0">{item.kode}</span>
                                <div className="w-10 h-10 rounded-md bg-amber-100/50 overflow-hidden flex-shrink-0 border border-gray-200 flex items-center justify-center">
                                    {item.image ? (
                                        <img src={item.image} alt={item.nama} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[10px] text-amber-700">Img</span>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-sm font-bold text-gray-900 truncate">{item.nama}</span>
                                    <span className="text-xs text-gray-500 mt-0.5">{item.berat} • {item.karat}</span>
                                </div>
                                <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                                    {HelperFunctions.formatCurrency(item.harga_jual)}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 py-4 text-center">Tidak ada barang</p>
                        )}
                    </div>
                </div>

                {/* ── META INFO ── */}
                <div className="flex items-center gap-4 border border-gray-200 rounded-lg px-5 py-3 text-xs">
                    <div className="flex-1">
                        <span className="text-gray-500">Kode </span>
                        <span className="font-semibold text-gray-900">{data?.kode_transfer || '-'}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex-1">
                        <span className="text-gray-500">Diajukan oleh </span>
                        <span className="font-semibold text-gray-900">{createdBy}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex-1 font-semibold text-gray-900">{tanggalPengajuan}</div>
                </div>

                {/* ── APPROVAL STATUS ── */}
                <ApprovalStatusCard
                    status="Approval"
                    Icon={view.Icon}
                    iconColor={view.iconColor}
                    statusText={view.statusText}
                    pic={data?.approved_by?.name || 'Owner'}
                    date={tanggalApproval}
                    reasonLabel={view.reasonLabel}
                    reason={data?.note_approval || null}
                />
            </div>
        </ModalCustom>
    );
}
