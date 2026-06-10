import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from '@phosphor-icons/react';
import ModalCustom from '../../../components/modalCustom';
import ApprovalStatusCard from '../../../components/ApprovalStatusCard';
import HelperFunctions from '../../../utils/HelperFunctions';

const getApprovalCardProps = (data) => {
    const pic = data?.pic_approval || data?.disetujui_oleh || data?.ditolak_oleh || data?.dibatalkan_oleh || 'Owner';
    const date = data?.tanggal_approval || '-';

    switch (data?.status) {
        case 'Disetujui':
            return { Icon: CheckCircle, iconColor: 'text-success-500', statusText: 'Disetujui oleh', pic, date, reason: null };
        case 'Dibatalkan':
            return { Icon: XCircle, iconColor: 'text-danger-500', statusText: 'Dibatalkan oleh', pic, date, reason: data?.alasan, reasonLabel: 'Alasan Pembatalan' };
        case 'Ditolak':
            return { Icon: XCircle, iconColor: 'text-danger-500', statusText: 'Ditolak oleh', pic, date, reason: data?.alasan, reasonLabel: 'Alasan Penolakan' };
        case 'Approval':
        case 'Menunggu Approval':
            return { Icon: Clock, iconColor: 'text-warning-400', statusText: 'Menunggu Approval oleh', pic, date, reason: null };
        default:
            return null;
    }
};

const ModalDetailTransfer = ({
    isOpen,
    onClose,
    mode = 'view',
    data = {},
    onSubmitApprove,
    onSubmitReject,
}) => {
    const [formData, setFormData] = useState({ catatan: '' });

    useEffect(() => {
        if (isOpen) setFormData({ catatan: '' });
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const items = data?.items || [];
    const approvalProps = getApprovalCardProps(data);

    return (
        <ModalCustom
            title={data?.judul || 'Detail Transfer Item'}
            isOpen={isOpen}
            onClose={onClose}
            footer={false}
        >
            <div className="flex flex-col gap-5">

                {/* ── INFORMASI TRANSFER ── */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-info-500 rounded-full flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-sm">Informasi Transfer</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-400">Cabang Asal</span>
                            <span className="text-sm font-medium text-gray-900">{data?.cabang_asal || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-400">Cabang Tujuan</span>
                            <span className="text-sm font-medium text-gray-900">{data?.cabang_tujuan || '-'}</span>
                        </div>
                        {data?.catatan && (
                            <div className="col-span-2 flex flex-col gap-0.5">
                                <span className="text-xs text-gray-400">Catatan</span>
                                <span className="text-sm font-medium text-gray-900">{data.catatan}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── DAFTAR BARANG ── */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-info-500 rounded-full flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 text-sm">Daftar Barang</h3>
                    </div>
                    <div className="border border-gray-200 rounded-lg px-4">
                        {items.length > 0 ? items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                                <span className="text-xs text-info-500 font-medium w-24 flex-shrink-0">{item.kode}</span>
                                <div className="w-10 h-10 rounded-md bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-200">
                                    {item.image ? (
                                        <img src={item.image} alt={item.nama} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                                <circle cx="8.5" cy="8.5" r="1.5" />
                                                <path d="M21 15l-5-5L5 21" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-900 truncate">{item.nama}</span>
                                    <span className="text-xs text-gray-400">{item.berat} • {item.karat}</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900 flex-shrink-0">
                                    {HelperFunctions.formatCurrency(item.harga_jual)}
                                </span>
                            </div>
                        )) : (
                            <p className="text-sm text-gray-400 py-4 text-center">Tidak ada barang</p>
                        )}
                    </div>
                </div>

                {/* ── FOOTER INFO ── */}
                <div className="flex items-center gap-6 text-xs text-gray-500 pt-1 border-t border-gray-100">
                    <span>Kode <span className="font-semibold text-gray-700">{data?.kode_transaksi || data?.kode}</span></span>
                    <span>Diajukan oleh <span className="font-semibold text-gray-700">{data?.diajukan_oleh || data?.pic_approval || '-'}</span></span>
                    <span className="ml-auto">{data?.tanggal}</span>
                </div>

                {/* ── APPROVAL STATUS ── */}
                {approvalProps && (
                    <ApprovalStatusCard
                        Icon={approvalProps.Icon}
                        iconColor={approvalProps.iconColor}
                        statusText={approvalProps.statusText}
                        pic={approvalProps.pic}
                        date={approvalProps.date}
                        status="Approval"
                        reason={approvalProps.reason}
                        reasonLabel={approvalProps.reasonLabel}
                    />
                )}

                {/* ── FORM APPROVE ── */}
                {mode === 'approve' && (
                    <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-gray-900 text-sm">Form Approval</h4>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-900">Catatan</label>
                            <textarea
                                name="catatan"
                                value={formData.catatan}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Masukkan catatan..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none resize-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => onSubmitReject?.(formData)} className="btn btn-danger-outline rounded-lg">
                                Tolak
                            </button>
                            <button onClick={() => onSubmitApprove?.(formData)} className="btn btn-primary rounded-lg">
                                Setujui
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </ModalCustom>
    );
};

export default ModalDetailTransfer;
