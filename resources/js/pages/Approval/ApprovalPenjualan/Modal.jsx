import dayjs from "dayjs";
import { TimerIcon, CheckCircleIcon, XCircleIcon, ReceiptIcon } from '@phosphor-icons/react';
import ModalCustom from '../../../components/modalCustom';
import ApprovalStatusCard from '../../../components/ApprovalStatusCard';
import HelperFunctions from "../../../utils/HelperFunctions";
import CodeBadge from '../../../components/CodeBadge';

const APPROVAL_VIEW = {
    'APPROVAL': { Icon: TimerIcon, iconColor: 'text-warning-500', statusText: 'Menunggu Approval oleh' },
    'CETAK KWITANSI': { Icon: ReceiptIcon, iconColor: 'text-info-500', statusText: 'Disetujui, siap cetak kwitansi oleh' },
    'DISETUJUI': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh' },
    'SELESAI': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh' },
    'DITOLAK': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Ditolak oleh' },
    'DIBATALKAN': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Dibatalkan oleh' },
};

export default function ModalDetailPenjualan({
    isOpen,
    onClose,
    onSubmitApprove,
    onSubmitReject,
    data
}) {
    if (!data) return null;

    const { customer, user, details, branch, approval_status, payment_type } = data;
    const isTransfer = payment_type === 'TRANSFER';

    // Footer aksi hanya tampil saat transaksi masih menunggu approval
    const isPending = approval_status === 'APPROVAL';
    const approvalView = APPROVAL_VIEW[approval_status] || APPROVAL_VIEW['APPROVAL'];
    const customerBadge = customer?.id ? 'Member Terdaftar' : 'Customer Baru';

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
                            <span className="text-sm font-medium text-neutral-900">{customer?.id ?? '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">Nama Customer</span>
                            <span className="text-sm font-medium text-neutral-900">{customer?.customer_name ?? '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">No. Handphone</span>
                            <span className="text-sm font-medium text-neutral-900">{customer?.phone_number ?? '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">Alamat</span>
                            <span className="text-sm font-medium text-neutral-900">{customer?.address ?? '-'}</span>
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
                            {details?.length || 0} item
                        </span>
                    </div>

                    <div className="flex flex-col gap-2">
                        {(details || []).map((item, index) => (
                            <div key={index} className="flex justify-between items-center border border-neutral-200 rounded-lg p-3">
                                <div className="flex items-center gap-4">
                                    <CodeBadge>{item.inventory_code}</CodeBadge>
                                    {item.inventory?.thumb_path ? (
                                        <img src={HelperFunctions.getStorageUrl(item.inventory.thumb_path)} alt={item.product?.product_name} className="w-10 h-10 rounded-md object-cover border border-neutral-200" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-md bg-amber-100/50 border border-neutral-200 flex items-center justify-center text-[10px] text-amber-700">Img</div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-neutral-900">{item.product?.product_name ?? '-'}</span>
                                        <span className="text-xs text-neutral-500 mt-0.5">
                                            {item.inventory?.berat ? `${item.inventory.berat}g` : ''}
                                            {item.inventory?.karat ? ` • ${item.inventory.karat}K` : ''}
                                        </span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-neutral-900">{HelperFunctions.formatCurrency(item.price)}</span>
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
                            {isTransfer ? 'Transfer' : 'Tunai'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Sub Total</span>
                        <span className="font-medium text-neutral-900">{HelperFunctions.formatCurrency(data?.sub_total)}</span>
                    </div>
                    <hr className="border-dashed border-neutral-200" />
                    <div className="flex justify-between items-center text-sm font-bold">
                        <span className="text-neutral-900">Total</span>
                        <span className="text-neutral-900">{HelperFunctions.formatCurrency(data?.grand_total)}</span>
                    </div>

                    {!isTransfer && (
                        <div className="text-sm border-t border-dashed border-neutral-200 pt-3 flex flex-col gap-1">
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Uang Dibayar</span>
                                <span className="font-medium text-neutral-900">{HelperFunctions.formatCurrency(data?.nominal_paid ?? 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-500">Kembalian</span>
                                <span className="font-medium text-neutral-900">{HelperFunctions.formatCurrency(data?.exchange ?? 0)}</span>
                            </div>
                        </div>
                    )}

                    {isTransfer && (
                        <div className="text-xs text-neutral-600 border-t border-dashed border-neutral-200 pt-3 flex flex-col gap-1">
                            <div>Pengirim: <span className="font-bold text-neutral-900 uppercase">{data?.sender_name ?? '-'}</span></div>
                            <div>No. Rekening Pengirim: <span className="font-bold text-neutral-900">{data?.sender_rekening ?? '-'}</span></div>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 text-xs text-neutral-500 border border-[#E2E8F0] p-6 rounded-lg py-3 mt-2">
                    <div className="flex-1 border-r border-neutral-200 pr-4">
                        Order ID <span className="font-medium text-neutral-900 ml-1">{data?.order_id || '-'}</span>
                    </div>
                    <div className="flex-1 border-r border-neutral-200 px-4">
                        Diajukan oleh <span className="font-medium text-neutral-900 ml-1">{user?.name || '-'}</span>
                    </div>
                    <div className="flex-1 pl-4 font-medium text-neutral-900">
                        {data?.created_at ? dayjs(data.created_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    </div>
                </div>

                <ApprovalStatusCard
                    status="Approval"
                    Icon={approvalView.Icon}
                    iconColor={approvalView.iconColor}
                    statusText={approvalView.statusText}
                    pic={branch?.branch_name || 'Owner'}
                    date={data?.updated_at ? dayjs(data.updated_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    reasonLabel="Alasan Penolakan"
                    reason={approval_status === 'DITOLAK' ? data?.note : null}
                />
            </div>
        </ModalCustom>
    );
}
