import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { TimerIcon, CheckCircleIcon, XCircleIcon, ReceiptIcon } from "@phosphor-icons/react";
import ModalCustom from "../../components/modalCustom";
import SectionCard from "../../components/SectionCard";
import ApprovalStatusCard from "../../components/ApprovalStatusCard";
import InventoryItemCard from "../../components/InventoryItemCard";
import HelperFunctions from "../../utils/HelperFunctions";
import BankApis from "../../Services/Bank.apis";

const APPROVAL_VIEW = {
    'APPROVAL': { Icon: TimerIcon, iconColor: 'text-warning-500', statusText: 'Menunggu Approval oleh' },
    'DISETUJUI': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh' },
    'CETAK KWITANSI': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh' },
    'SELESAI': { Icon: CheckCircleIcon, iconColor: 'text-success-500', statusText: 'Disetujui oleh' },
    'DITOLAK': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Ditolak oleh' },
    'DIBATALKAN': { Icon: XCircleIcon, iconColor: 'text-danger-500', statusText: 'Dibatalkan oleh' },
};

const ModalViewPenjualan = ({ isOpen, onClose, data }) => {
    const [receiverBank, setReceiverBank] = useState(null);

    useEffect(() => {
        if (isOpen && data?.payment_type === 'TRANSFER' && data?.receiver_bank_id) {
            BankApis.GetBankBranchSingle(data.receiver_bank_id)
                .then((res) => setReceiverBank(res || null))
                .catch(() => setReceiverBank(null));
        } else {
            setReceiverBank(null);
        }
    }, [isOpen, data?.receiver_bank_id]);

    if (!data) return null;

    const { customer, user, details, approval_status } = data;
    const isTransfer = data.payment_type === 'TRANSFER';
    const approvalView = APPROVAL_VIEW[approval_status] || APPROVAL_VIEW['APPROVAL'];
    const customerBadge = (customer?.sales_count ?? 0) > 1 ? 'Member Terdaftar' : 'Customer Baru';

    return (
        <ModalCustom
            title="Detail Penjualan"
            isOpen={isOpen}
            onClose={onClose}
            footer={false}
        >
            <div className="flex flex-col gap-5 py-1">
                <SectionCard title="Data Customer" badge={customerBadge}>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">ID Customer</span>
                            <span className="text-sm font-medium text-neutral-900">{customer?.customer_code || '-'}</span>
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
                            <span className="text-sm font-medium text-neutral-900 leading-snug">{customer?.address ?? '-'}</span>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Keranjang Penjualan" badge={`${details?.length || 0} item`}>
                    <div className="flex flex-col gap-3">
                        {(details || []).map((item, index) => (
                            <InventoryItemCard
                                key={index}
                                code={item.inventory_code}
                                name={item.product?.product_name}
                                specs={[
                                    item.inventory?.berat ? `${item.inventory.berat}g` : '',
                                    item.inventory?.karat ? `${item.inventory.karat}K` : '',
                                ].filter(Boolean).join(' • ')}
                                image={item.inventory?.thumb_path ? HelperFunctions.getStorageUrl(item.inventory.thumb_path) : null}
                                price={item.price}
                            />
                        ))}
                    </div>
                </SectionCard>

                <SectionCard title="Pembayaran" badge={isTransfer ? 'Transfer' : 'Tunai'}>
                    <div className="flex flex-col">
                        <div className="flex justify-between py-2 border-b border-dashed border-neutral-200">
                            <span className="text-sm text-neutral-500">Sub Total</span>
                            <span className="text-sm text-neutral-900">{HelperFunctions.formatCurrency(data.sub_total)}</span>
                        </div>
                        <div className="flex justify-between pt-3">
                            <span className="text-sm font-bold text-neutral-900 font-medium">Total</span>
                            <span className="text-sm font-bold text-neutral-900 font-medium">{HelperFunctions.formatCurrency(data.grand_total)}</span>
                        </div>
                    </div>

                    {isTransfer ? (
                        <div className="flex flex-col p-4 border border-neutral-200 rounded-lg bg-neutral-50/50 gap-4">
                            {receiverBank && (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-md flex items-center justify-center text-white font-extrabold italic text-sm shadow-sm flex-shrink-0 bg-neutral-500">
                                        {receiverBank.bank?.bank_code ?? receiverBank.bank?.bank_name ?? '-'}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-neutral-900">{receiverBank.nama_pemilik ?? '-'}</span>
                                        <span className="text-xs font-medium text-neutral-500 mt-0.5">{receiverBank.nomor_rekening ?? '-'} • {receiverBank.bank?.bank_name ?? '-'}</span>
                                    </div>
                                </div>
                            )}
                            <div className="text-xs text-neutral-600 border-t border-dashed border-neutral-200 pt-3">
                                Pengirim: <span className="font-bold text-neutral-900 uppercase">{data.sender_name ?? '-'}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 border-t border-dashed border-neutral-200 pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-500">Uang Dibayar</span>
                                <span className="text-sm font-medium text-neutral-900">{HelperFunctions.formatCurrency(data.nominal_paid)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-500">Kembalian</span>
                                <span className="text-sm font-medium text-neutral-900">{HelperFunctions.formatCurrency(data.exchange)}</span>
                            </div>
                        </div>
                    )}
                </SectionCard>

                <div className="flex items-center gap-4 border border-neutral-200 rounded-lg px-5 py-3 text-xs">
                    <div className="flex-1">
                        <span className="text-neutral-500">Order ID </span>
                        <span className="font-bold text-neutral-900">{data.order_id}</span>
                    </div>
                    <div className="w-px h-8 bg-neutral-200"></div>
                    <div className="flex-1">
                        <span className="text-neutral-500">Diajukan oleh </span>
                        <span className="font-bold text-neutral-900">{user?.name ?? '-'}</span>
                    </div>
                    <div className="w-px h-8 bg-neutral-200"></div>
                    <div className="flex-1 font-bold text-neutral-900">{data.created_at ? dayjs(data.created_at).format('DD MMMM YYYY, HH:mm') : '-'}</div>
                </div>

                <ApprovalStatusCard
                    status="Approval"
                    Icon={approvalView.Icon}
                    iconColor={approvalView.iconColor}
                    statusText={approvalView.statusText}
                    pic={approval_status === 'DIBATALKAN' ? (user?.name || '-') : 'Owner'}
                    date={data.updated_at ? dayjs(data.updated_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    reasonLabel={approval_status === 'DITOLAK' ? 'Alasan Penolakan' : approval_status === 'DIBATALKAN' ? 'Alasan Pembatalan' : null}
                    reason={(approval_status === 'DITOLAK' || approval_status === 'DIBATALKAN') ? data.note : null}
                />
            </div>
        </ModalCustom>
    );
};

export default ModalViewPenjualan;
