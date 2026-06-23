import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { TimerIcon, CheckCircleIcon, XCircleIcon, ReceiptIcon } from "@phosphor-icons/react";
import ModalCustom from "../../components/modalCustom";
import CodeBadge from "../../components/CodeBadge";
import ApprovalStatusCard from "../../components/ApprovalStatusCard";
import HelperFunctions from "../../utils/HelperFunctions";
import OptionsStore from "../../Store/OptionsStore";

const SectionHeader = ({ title, badge }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
            <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
        </div>
        {badge && (
            <span className="px-3 py-1 bg-neutral-100 border border-neutral-200 text-xs font-medium text-neutral-600 rounded-md">
                {badge}
            </span>
        )}
    </div>
);

// Map approval_status (backend) -> tampilan ApprovalStatusCard
const APPROVAL_VIEW = {
    'APPROVAL': {
        Icon: TimerIcon,
        iconColor: 'text-warning-500',
        statusText: 'Menunggu Approval oleh',
    },
    'CETAK KWITANSI': {
        Icon: ReceiptIcon,
        iconColor: 'text-info-500',
        statusText: 'Disetujui, siap cetak kwitansi oleh',
    },
    'SELESAI': {
        Icon: CheckCircleIcon,
        iconColor: 'text-success-500',
        statusText: 'Disetujui oleh',
    },
    'DITOLAK': {
        Icon: XCircleIcon,
        iconColor: 'text-danger-500',
        statusText: 'Ditolak oleh',
    },
};

const ModalViewPenjualan = ({ isOpen, onClose, data }) => {
    const ensureBanks = OptionsStore((s) => s.ensureBanks);
    const [bankCabangs, setBankCabangs] = useState([]);

    useEffect(() => {
        if (isOpen && data?.payment_type === 'TRANSFER') {
            ensureBanks()
                .then((bankData) => setBankCabangs(bankData))
                .catch((err) => console.error(err));
        }
    }, [isOpen, data]);

    if (!data) return null;

    const { customer, user, details, branch, approval_status } = data;
    const isTransfer = data.payment_type === 'TRANSFER';
    const approvalView = APPROVAL_VIEW[approval_status] || APPROVAL_VIEW['APPROVAL'];
    const receiverBank = bankCabangs.find((b) => b.id === data.receiver_bank_id);

    return (
        <ModalCustom
            title="Detail Penjualan"
            isOpen={isOpen}
            onClose={onClose}
            footer={false}
        >
            <div className="flex flex-col gap-5 py-1">

                {/* SECTION 1: DATA CUSTOMER */}
                <div className="flex flex-col gap-4 border border-neutral-200 rounded-lg p-5">
                    <SectionHeader title="Data Customer" />
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
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
                            <span className="text-sm font-medium text-neutral-900 leading-snug">{customer?.address ?? '-'}</span>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: KERANJANG PENJUALAN */}
                <div className="flex flex-col gap-4 border border-neutral-200 rounded-lg p-5">
                    <SectionHeader title="Keranjang Penjualan" badge={`${details?.length || 0} item`} />
                    <div className="flex flex-col gap-3">
                        {(details || []).map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg bg-white">
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

                {/* SECTION 3: PEMBAYARAN */}
                <div className="flex flex-col gap-4 border border-neutral-200 rounded-lg p-5">
                    <SectionHeader title="Pembayaran" badge={isTransfer ? 'Transfer' : 'Tunai'} />

                    <div className="flex flex-col">
                        <div className="flex justify-between py-2 border-b border-dashed border-neutral-200">
                            <span className="text-sm text-neutral-500">Sub Total</span>
                            <span className="text-sm font-medium text-neutral-900">{HelperFunctions.formatCurrency(data.sub_total)}</span>
                        </div>
                        <div className="flex justify-between pt-3">
                            <span className="text-sm font-bold text-neutral-900">Total</span>
                            <span className="text-sm font-bold text-neutral-900">{HelperFunctions.formatCurrency(data.grand_total)}</span>
                        </div>
                    </div>

                    {isTransfer ? (
                        <div className="flex flex-col p-4 border border-neutral-200 rounded-lg bg-neutral-50/50 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-md flex items-center justify-center text-white font-extrabold italic text-sm shadow-sm flex-shrink-0 bg-neutral-500">
                                    {receiverBank?.bank?.bank_code ?? receiverBank?.bank?.bank_name ?? '-'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-neutral-900">{receiverBank?.nama_pemilik ?? '-'}</span>
                                    <span className="text-xs font-medium text-neutral-500 mt-0.5">{receiverBank?.nomor_rekening ?? '-'} • {receiverBank?.bank?.bank_name ?? '-'}</span>
                                </div>
                            </div>
                            <div className="text-xs text-neutral-600 border-t border-dashed border-neutral-200 pt-3 flex flex-col gap-1">
                                <div>Pengirim: <span className="font-bold text-neutral-900 uppercase">{data.sender_name ?? '-'}</span></div>
                                <div>No. Rekening Pengirim: <span className="font-bold text-neutral-900">{data.sender_rekening ?? '-'}</span></div>
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
                </div>

                {/* SECTION 4: METADATA TRANSAKSI */}
                <div className="flex items-center gap-4 border border-neutral-200 rounded-lg px-5 py-3 text-xs">
                    <div className="flex-1">
                        <span className="text-neutral-500">Order ID </span>
                        <span className="font-semibold text-neutral-900">{data.order_id}</span>
                    </div>
                    <div className="w-px h-8 bg-neutral-200"></div>
                    <div className="flex-1">
                        <span className="text-neutral-500">Diajukan oleh </span>
                        <span className="font-semibold text-neutral-900">{user?.name ?? '-'}</span>
                    </div>
                    <div className="w-px h-8 bg-neutral-200"></div>
                    <div className="flex-1 font-semibold text-neutral-900">{data.created_at ? dayjs(data.created_at).format('DD MMMM YYYY, HH:mm') : '-'}</div>
                </div>

                {/* SECTION 5: APPROVAL */}
                <ApprovalStatusCard
                    status="Approval"
                    Icon={approvalView.Icon}
                    iconColor={approvalView.iconColor}
                    statusText={approvalView.statusText}
                    pic={branch?.branch_name ?? '-'}
                    date={data.updated_at ? dayjs(data.updated_at).format('DD MMMM YYYY, HH:mm') : '-'}
                    reasonLabel="Alasan Penolakan"
                    reason={approval_status === 'DITOLAK' ? data.note : null}
                />
            </div>
        </ModalCustom>
    );
};

export default ModalViewPenjualan;
