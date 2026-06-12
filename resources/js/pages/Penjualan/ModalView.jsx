import { TimerIcon, CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import ModalCustom from "../../components/modalCustom";
import ApprovalStatusCard from "../../components/ApprovalStatusCard";
import HelperFunctions from "../../utils/HelperFunctions";

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

// Map status approval -> tampilan ApprovalStatusCard
const APPROVAL_VIEW = {
    'Menunggu Approval': {
        Icon: TimerIcon,
        iconColor: 'text-warning-500',
        statusText: 'Menunggu Approval oleh',
    },
    'Disetujui': {
        Icon: CheckCircleIcon,
        iconColor: 'text-success-500',
        statusText: 'Disetujui oleh',
    },
    'Dibatalkan': {
        Icon: XCircleIcon,
        iconColor: 'text-danger-500',
        statusText: 'Dibatalkan oleh',
    },
};

const ModalViewPenjualan = ({ isOpen, onClose, data }) => {
    if (!data) return null;

    const { customer, cart, payment, meta, approval } = data;
    const isTransfer = payment.method?.toLowerCase() === 'transfer';
    const approvalView = APPROVAL_VIEW[approval.status] || APPROVAL_VIEW['Menunggu Approval'];

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
                    <SectionHeader title="Data Customer" badge={customer.type} />
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">ID Customer</span>
                            <span className="text-sm font-medium text-neutral-900">{customer.id || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">Nama Customer</span>
                            <span className="text-sm font-medium text-neutral-900">{customer.nama || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">No. Handphone</span>
                            <span className="text-sm font-medium text-neutral-900">{customer.hp || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-neutral-500">Alamat</span>
                            <span className="text-sm font-medium text-neutral-900 leading-snug">{customer.alamat || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* SECTION 2: KERANJANG PENJUALAN */}
                <div className="flex flex-col gap-4 border border-neutral-200 rounded-lg p-5">
                    <SectionHeader title="Keranjang Penjualan" badge={`${cart.length} item`} />
                    <div className="flex flex-col gap-3">
                        {cart.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg bg-white">
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-neutral-50 rounded text-xs font-medium text-neutral-500 border border-neutral-200">
                                        {item.id}
                                    </span>
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover border border-neutral-200" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-md bg-amber-100/50 border border-neutral-200 flex items-center justify-center text-[10px] text-amber-700">Img</div>
                                    )}
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-neutral-900">{item.name}</span>
                                        <span className="text-xs text-neutral-500 mt-0.5">{item.specs}</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-neutral-900">{HelperFunctions.formatCurrency(item.price)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SECTION 3: PEMBAYARAN */}
                <div className="flex flex-col gap-4 border border-neutral-200 rounded-lg p-5">
                    <SectionHeader title="Pembayaran" badge={payment.method} />

                    <div className="flex flex-col">
                        <div className="flex justify-between py-2 border-b border-dashed border-neutral-200">
                            <span className="text-sm text-neutral-500">Sub Total</span>
                            <span className="text-sm font-medium text-neutral-900">{HelperFunctions.formatCurrency(payment.subTotal)}</span>
                        </div>
                        <div className="flex justify-between pt-3">
                            <span className="text-sm font-bold text-neutral-900">Total</span>
                            <span className="text-sm font-bold text-neutral-900">{HelperFunctions.formatCurrency(payment.total)}</span>
                        </div>
                    </div>

                    {isTransfer ? (
                        <div className="flex flex-col p-4 border border-neutral-200 rounded-lg bg-neutral-50/50 gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-md flex items-center justify-center text-white font-extrabold italic text-sm shadow-sm flex-shrink-0 ${payment.bank === 'BCA' ? 'bg-[#005EAA]' : 'bg-[#F05A28]'}`}>
                                    {payment.bank}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-neutral-900">{payment.rekeningName}</span>
                                    <span className="text-xs font-medium text-neutral-500 mt-0.5">{payment.rekeningNumber} • {payment.bank}</span>
                                </div>
                            </div>
                            <div className="text-xs text-neutral-600 border-t border-dashed border-neutral-200 pt-3">
                                Pengirim: <span className="font-bold text-neutral-900 uppercase">{payment.pengirim}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2 border-t border-dashed border-neutral-200 pt-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-500">Uang Dibayar</span>
                                <span className="text-sm font-medium text-neutral-900">{HelperFunctions.formatCurrency(payment.uangDibayar)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-neutral-500">Kembalian</span>
                                <span className="text-sm font-medium text-neutral-900">{HelperFunctions.formatCurrency(payment.kembalian)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECTION 4: METADATA TRANSAKSI */}
                <div className="flex items-center gap-4 border border-neutral-200 rounded-lg px-5 py-3 text-xs">
                    <div className="flex-1">
                        <span className="text-neutral-500">Order ID </span>
                        <span className="font-semibold text-neutral-900">{meta.orderId}</span>
                    </div>
                    <div className="w-px h-8 bg-neutral-200"></div>
                    <div className="flex-1">
                        <span className="text-neutral-500">Diajukan oleh </span>
                        <span className="font-semibold text-neutral-900">{meta.diajukanOleh}</span>
                    </div>
                    <div className="w-px h-8 bg-neutral-200"></div>
                    <div className="flex-1 font-semibold text-neutral-900">{meta.tanggal}</div>
                </div>

                {/* SECTION 5: APPROVAL */}
                <ApprovalStatusCard
                    status="Approval"
                    Icon={approvalView.Icon}
                    iconColor={approvalView.iconColor}
                    statusText={approvalView.statusText}
                    pic={approval.role}
                    date={approval.tanggal}
                    reasonLabel={approval.reasonLabel || 'Alasan Pembatalan'}
                    reason={approval.reason}
                />
            </div>
        </ModalCustom>
    );
};

export default ModalViewPenjualan;
