import { useState, useEffect } from 'react';
import ModalCustom from '../../../components/modalCustom';
import InputGroup from '../../../components/FormElement/InputGroup';

export default function Modal({
    isOpen,
    onClose,
    onSubmitApprove,
    onSubmitReject,
    data
}) {
    const [viewState, setViewState] = useState('view');
    const [formData, setFormData] = useState({
        nominal: '',
        catatan: ''
    });

    useEffect(() => {
        if (isOpen) {
            setViewState('view');
            setFormData({ nominal: '', catatan: '' });
        }
    }, [isOpen]);

    const formatRupiah = (number) => {
        if (!number) return '';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getModalTitle = () => {
        if (viewState === 'approve') return 'Setujui Pembelian';
        if (viewState === 'reject') return 'Tolak Pembelian';
        return 'Approval Pembelian';
    };

    const isSubmitDisabled = () => {
        if (viewState === 'approve' && !formData.nominal) return true;
        if (viewState === 'reject' && !formData.catatan) return true;
        return false;
    };

    const infoFields = [
        { label: 'Tanggal Transaksi', name: 'tanggal_transaksi', type: 'text', value: data?.tanggal_transaksi || '', isDisable: true, onChange: () => {} },
        { label: 'Kategori', name: 'kategori', type: 'text', value: data?.kategori || '', isDisable: true, onChange: () => {} },
        { label: 'PIC', name: 'pic', type: 'text', value: data?.pic || '', isDisable: true, onChange: () => {} },
        { label: 'Harga Beli', name: 'harga_beli', type: 'text', value: formatRupiah(data?.harga_beli), isDisable: true, onChange: () => {} }
    ];

    const actionFields = viewState === 'approve' ? [
        { label: 'Nominal', name: 'nominal', type: 'text', value: formData.nominal, onChange: handleChange, isRequired: true, placeholder: 'Rp 0' },
        { label: 'Catatan', name: 'catatan', type: 'textArea', value: formData.catatan, onChange: handleChange, placeholder: 'Masukkan catatan' }
    ] : [
        { label: 'Catatan', name: 'catatan', type: 'textArea', value: formData.catatan, onChange: handleChange, isRequired: true, placeholder: 'Masukkan catatan' }
    ];

    return (
        <ModalCustom
            title={getModalTitle()}
            isOpen={isOpen}
            onClose={onClose}
            width="max-w-2xl"
        >
            <div className="flex flex-col gap-6">

                <div className="flex flex-col gap-3">
                    <h3 className="text-sm font-semibold text-gray-800">Informasi Pembelian</h3>
                    <InputGroup
                        cols="2"
                        fields={infoFields}
                    />
                </div>

                {viewState !== 'view' && (
                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800">Detail Approval</h3>
                        <InputGroup
                            cols="1"
                            fields={actionFields}
                        />
                    </div>
                )}

            </div>
        </ModalCustom>
    );
}
