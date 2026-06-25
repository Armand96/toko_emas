import dayjs from "dayjs";
import { TimerIcon, CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import ModalCustom from '../../../components/modalCustom';
import ApprovalStatusCard from '../../../components/ApprovalStatusCard';
import HelperFunctions from "../../../utils/HelperFunctions";
import InventoryItemCard from '../../../components/InventoryItemCard';

const STATUS_VIEW = {
    'APPROVAL': { Icon: TimerIcon, iconColor: 'text-warning-500', statusText: 'Menunggu Approval oleh' },
    'DISETUJUI': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh' },
    'DITOLAK': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Ditolak oleh' },
    'DIBATALKAN': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Dibatalkan oleh' },
    'RETURN': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Dikembalikan oleh' },
};

const JENIS_LABEL = { HILANG: 'Hilang', REPAIR: 'Repair' };

export default function ModalDetailRemoveItem({
    isOpen,
    onClose,
    onSubmitApprove,
    onSubmitReject,
    data
}) {
    if (!data) return null;

    const { details, branch, user, status, jenis } = data;
    const isPending = status === 'APPROVAL';
    const statusView = STATUS_VIEW[status] || STATUS_VIEW['APPROVAL'];

    return (
        <ModalCustom
            title="Detail Remove Item"
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-2xl"
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
            <div className="flex flex-col gap-5">

                {/* ── INFORMASI PENGELUARAN ── */}
                <div className="flex flex-col gap-3 border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary-500 rounded-full flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-sm">Informasi Pengeluaran</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-400">Jenis</span>
                            <span className="text-sm font-medium text-gray-900">{JENIS_LABEL[jenis] || jenis || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-400">Catatan</span>
                            <span className="text-sm font-medium text-gray-900">{data?.note || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* ── DAFTAR BARANG ── */}
                <div className="flex flex-col gap-3 border border-gray-200 rounded-lg p-5">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary-500 rounded-full flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-sm">Daftar Barang</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        {(details || []).length > 0 ? (details || []).map((d, idx) => (
                            <InventoryItemCard
                                key={idx}
                                code={d.inventory_code}
                                name={d.product?.product_name}
                                specs={[
                                    d.inventory?.berat ? `${d.inventory.berat}g` : '-',
                                    d.inventory?.karat ? `${d.inventory.karat}K` : '-',
                                ].join(' • ')}
                                image={d.inventory?.image_path ? HelperFunctions.getStorageUrl(d.inventory.image_path) : null}
                                price={d.inventory?.jual || 0}
                            />
                        )) : (
                            <p className="text-sm text-gray-400 py-4 text-center">Tidak ada barang</p>
                        )}
                    </div>
                </div>

                {/* ── META INFO ── */}
                <div className="flex items-center gap-4 border border-gray-200 rounded-lg px-5 py-3 text-xs">
                    <div className="flex-1">
                        <span className="text-gray-500">Kode </span>
                        <span className="font-semibold text-gray-900">{data?.code || '-'}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex-1">
                        <span className="text-gray-500">Diajukan oleh </span>
                        <span className="font-semibold text-gray-900">{user?.name || '-'}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex-1 font-semibold text-gray-900">
                        {data?.created_at ? dayjs(data.created_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    </div>
                </div>

                {/* ── APPROVAL STATUS ── */}
                <ApprovalStatusCard
                    status="Approval"
                    Icon={statusView.Icon}
                    iconColor={statusView.iconColor}
                    statusText={statusView.statusText}
                    pic={branch?.name || 'Owner'}
                    date={data?.updated_at ? dayjs(data.updated_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    reasonLabel="Alasan Penolakan"
                    reason={status === 'DITOLAK' ? data?.note : null}
                />
            </div>
        </ModalCustom>
    );
}
