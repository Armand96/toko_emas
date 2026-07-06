import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { TimerIcon, CheckCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import ModalCustom from '../../../components/modalCustom';
import SectionCard from '../../../components/SectionCard';
import ApprovalStatusCard from '../../../components/ApprovalStatusCard';
import HelperFunctions from "../../../utils/HelperFunctions";
import InventoryItemCard from '../../../components/InventoryItemCard';
import BankApis from '../../../Services/Bank.apis';

const APPROVAL_VIEW = {
    'APPROVAL': { Icon: TimerIcon, iconColor: 'text-warning-500', statusText: 'Menunggu Approval oleh' },
    'CETAK KWITANSI': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh' },
    'DISETUJUI': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh' },
    'SELESAI': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh' },
    'DITOLAK': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Ditolak oleh' },
    'DIBATALKAN': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Dibatalkan oleh' },
};

export default function ModalDetailBuyback({
    isOpen,
    onClose,
    onSubmitApprove,
    onSubmitReject,
    data
}) {
    const [senderBank, setSenderBank] = useState(null);

    useEffect(() => {
        if (isOpen && data?.payment_type === 'TRANSFER' && data?.sender_bank_id) {
            BankApis.GetBankBranchSingle(data.sender_bank_id)
                .then((res) => setSenderBank(res || null))
                .catch(() => setSenderBank(null));
        } else {
            setSenderBank(null);
        }
    }, [isOpen, data?.sender_bank_id]);

    if (!data) return null;

    const { customer, user, details, approval_status, payment_type } = data;
    const isTransfer = payment_type === 'TRANSFER';

    const isPending = approval_status === 'APPROVAL';
    const approvalView = APPROVAL_VIEW[approval_status] || APPROVAL_VIEW['APPROVAL'];
    const customerBadge = (customer?.sales_count ?? 0) > 1 ? 'Member Terdaftar' : 'Customer Baru';

    return (
        <ModalCustom
            title="Detail Buyback"
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-3xl"
            footer={isPending}
            customFooter={
                <div className="flex justify-between items-center gap-2 p-4 border-t border-neutral-200">
                    <button
                        onClick={onClose}
                        className="px-4 sm:px-6 py-2 bg-white border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                        Batal
                    </button>
                    <div className="flex gap-2 sm:gap-3">
                        <button
                            onClick={onSubmitReject}
                            className="px-4 sm:px-6 py-2 bg-danger-500 text-white font-medium rounded-lg hover:bg-danger-600 transition-colors"
                        >
                            Tolak
                        </button>
                        <button
                            onClick={onSubmitApprove}
                            className="px-4 sm:px-6 py-2 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
                        >
                            Setujui
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex flex-col gap-6">
                <SectionCard title="Data Customer" badge={customerBadge}>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">ID Customer</span>
                            <span className="text-sm font-medium text-neutral-900">{customer?.customer_code ?? customer?.id ?? '-'}</span>
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
                </SectionCard>

                <SectionCard title="Barang" badge={`${details?.length || 0} item`}>
                    <div className="flex flex-col gap-2">
                        {(details || []).map((item, index) => (
                            <InventoryItemCard
                                key={index}
                                code={item.serial_number || item.inventory_code || '-'}
                                name={item.product?.product_name}
                                specs={[
                                    item.inventory?.berat ? `${item.inventory.berat}g` : (item.berat ? `${item.berat}g` : ''),
                                    item.inventory?.karat ? `${item.inventory.karat}K` : (item.karat ? `${item.karat}K` : ''),
                                ].filter(Boolean).join(' • ')}
                                image={item.inventory?.thumb_path ? HelperFunctions.getStorageUrl(item.inventory.thumb_path) : null}
                                price={item.price}
                            />
                        ))}
                    </div>
                </SectionCard>

                <SectionCard title="Pembayaran" badge={isTransfer ? 'Transfer' : 'Tunai'}>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-neutral-500">Sub Total</span>
                        <span className=" text-neutral-900">{HelperFunctions.formatCurrency(data?.sub_total)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-bold border-t border-dashed border-neutral-200 pt-3">
                        <span className="text-neutral-900 font-medium">Total</span>
                        <span className="text-neutral-900 font-medium">{HelperFunctions.formatCurrency(data?.grand_total)}</span>
                    </div>

                    {isTransfer && (
                        <div className="flex flex-col p-4 border border-neutral-200 rounded-lg bg-neutral-50/50 gap-4 mt-3">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-neutral-500">Nama Penerima</span>
                                    <span className="text-sm font-medium text-neutral-900 uppercase">{data?.receiver_name ?? '-'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-neutral-500">Bank</span>
                                    <span className="text-sm font-medium text-neutral-900">{data?.receiver_bank_name ?? '-'}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-neutral-500">No. Rekening</span>
                                    <span className="text-sm font-medium text-neutral-900">{data?.receiver_rekening ?? '-'}</span>
                                </div>
                            </div>
                            {senderBank && (
                                <div className="flex flex-col gap-2 border-t border-dashed border-neutral-200 pt-3">
                                    <span className="text-xs text-neutral-500">Bank Keluar</span>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-md flex items-center justify-center text-white font-extrabold italic text-sm shadow-sm flex-shrink-0 bg-neutral-500">
                                            {senderBank.bank?.bank_code ?? senderBank.bank?.bank_name ?? '-'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-neutral-900">{senderBank.nama_pemilik ?? '-'}</span>
                                            <span className="text-xs font-medium text-neutral-500 mt-0.5">{senderBank.nomor_rekening ?? '-'} • {senderBank.bank?.bank_name ?? '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </SectionCard>

                <div className="flex gap-4 text-xs text-neutral-500 border border-gray-200 rounded-lg px-6 py-3">
                    <div className="flex-1 border-r border-neutral-200 pr-4">
                        Buyback ID <span className="font-bold text-neutral-900 ml-1">{data?.order_id || '-'}</span>
                    </div>
                    <div className="flex-1 border-r border-neutral-200 px-4">
                        Diajukan oleh <span className="font-bold text-neutral-900 ml-1">{user?.name || '-'}</span>
                    </div>
                    <div className="flex-1 pl-4 font-bold text-neutral-900">
                        {data?.created_at ? dayjs(data.created_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    </div>
                </div>

                <ApprovalStatusCard
                    status="Approval"
                    Icon={approvalView.Icon}
                    iconColor={approvalView.iconColor}
                    statusText={approvalView.statusText}
                    pic="Owner"
                    date={data?.updated_at ? dayjs(data.updated_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    reasonLabel="Alasan Penolakan"
                    reason={approval_status === 'DITOLAK' ? data?.note : null}
                />
            </div>
        </ModalCustom>
    );
}
