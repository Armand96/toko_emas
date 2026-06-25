import { CheckCircle, XCircle, Clock } from '@phosphor-icons/react';
import ModalCustom from '../../../components/modalCustom';
import SectionCard from '../../../components/SectionCard';
import ApprovalStatusCard from '../../../components/ApprovalStatusCard';
import InventoryItemCard from '../../../components/InventoryItemCard';

const getApprovalCardProps = (data) => {
    const pic = 'Owner';
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
    data = {},
}) => {
    const items = data?.items || [];
    const approvalProps = getApprovalCardProps(data);

    return (
        <ModalCustom
            title="Detail Transfer Item"
            isOpen={isOpen}
            onClose={onClose}
            footer={false}
        >
            <div className="flex flex-col gap-5">
                <SectionCard title="Informasi Transfer">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-400">Cabang Asal</span>
                            <span className="text-sm font-medium text-gray-900">{data?.cabang_asal || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-xs text-gray-400">Cabang Tujuan</span>
                            <span className="text-sm font-medium text-gray-900">{data?.cabang_tujuan || '-'}</span>
                        </div>
                        <div className="col-span-2 flex flex-col gap-0.5">
                            <span className="text-xs text-gray-400">Catatan</span>
                            <span className="text-sm font-medium text-gray-900">{data?.catatan || '-'}</span>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Daftar Barang" badge={`${items.length} item`}>
                    <div className="flex flex-col gap-3">
                        {items.length > 0 ? items.map((item, idx) => (
                            <InventoryItemCard
                                key={idx}
                                code={item.kode}
                                name={item.nama}
                                specs={`${item.berat} • ${item.karat}`}
                                image={item.image}
                                price={item.harga_jual}
                            />
                        )) : (
                            <p className="text-sm text-gray-400 py-4 text-center">Tidak ada barang</p>
                        )}
                    </div>
                </SectionCard>

                <div className="flex items-center gap-4 border border-gray-200 rounded-lg px-5 py-3 text-xs">
                    <div className="flex-1">
                        <span className="text-gray-500">Kode </span>
                        <span className="font-bold text-gray-900">{data?.kode_transaksi || data?.kode || '-'}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex-1">
                        <span className="text-gray-500">Diajukan oleh </span>
                        <span className="font-bold text-gray-900">{data?.diajukan_oleh || '-'}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex-1 font-bold text-gray-900">{data?.tanggal || '-'}</div>
                </div>

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
            </div>
        </ModalCustom>
    );
};

export default ModalDetailTransfer;
