import { useState, useEffect } from 'react';
import { PlusCircleIcon, PencilSimpleLineIcon, TrashIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import ModalCustom from '../../../components/modalCustom';
import Table from '../../../components/Table/Table';
import ModalAddBank from './ModalAddBank';
import BankApis from '../../../Services/Bank.apis';
import { showAlert } from '../../../utils/showAlert';

export default function Modal({ isOpen, onClose, onSubmit, formData, onChange, isView }) {
    const [banks, setBanks] = useState([]);
    const [isBankModalOpen, setIsBankModalOpen] = useState(false);
    const [selectedBank, setSelectedBank] = useState(null);

    useEffect(() => {
        if (isOpen) {
            BankApis.GetBankBranch(`?branch_id=${formData?.id}`).then((res) => {
                setBanks(res?.data)
            })
        }
    }, [isOpen, formData]);

    const handleOpenBankModal = (bank = null) => {
        setSelectedBank(bank);
        setIsBankModalOpen(true);
    };

    const handleCloseBankModal = () => {
        setIsBankModalOpen(false);
        setTimeout(() => setSelectedBank(null), 300);
    };

    const handleSubmitBank = (bankData) => {
        console.log(bankData)
        // let updatedBanks;
        if (bankData.id) {
            BankApis.PutBankBranch(bankData?.id, {
                ...bankData,
                is_active: bankData ? 1 : 0,
                branch_id: formData?.id,
                bank_id: bankData?.bank_id
            }).then(() => {
                BankApis.GetBankBranch(`?branch_id=${formData?.id}`).then((res) => {
                    setBanks(res?.data)
                })
            })
        } else {
            BankApis.PostBankBranch({
                ...bankData,
                is_active: bankData ? 1 : 0,
                branch_id: formData?.id,
                bank_id: bankData?.bank_id
            }).then(() => {
                BankApis.GetBankBranch(`?branch_id=${formData?.id}`).then((res) => {
                    setBanks(res?.data)
                })
            })
        }
        handleCloseBankModal();
    };

    const handleDeleteBank = (data) => {
        showAlert({
            icon: "warning",
            title: "Hapus Bank",
            isAutoClose: false,
            message: "Anda yakin ingin menghapus bank ?",
            confirmText: "Ya",
            cancelText: "Tidak"
        }).then((res) => {
            if(res.confirmed){
                BankApis.DeleteBank(data.id).then(() => {
                      BankApis.GetBankBranch(`?branch_id=${formData?.id}`).then((res) => {
                    setBanks(res?.data)
                })
                })
            }
        })
    };

    const bankColumns = [
        { header: 'Nama Bank', accessor: 'nama_bank' },
        { header: 'No Rekening', accessor: 'nomor_rekening' },
        { header: 'Nama Pemilik', accessor: 'nama_pemilik' },
        {
            header: 'Status',
            accessor: 'is_active',
            render: (row) => {
                const isActive = row.is_active === 1;
                return (
                    <span className={`px-3 py-1 rounded-md text-xs font-medium border ${isActive
                        ? 'bg-success-50 text-success-700 border-success-200'
                        : 'bg-danger-50 text-danger-700 border-danger-200'
                        }`}>
                        {isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                );
            }
        },
        {
            header: 'Aksi',
            accessor: 'aksi',
            render: (row) => (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleOpenBankModal(row)}
                        disabled={isView}
                        className="p-1.5 btn-outline !border-primary-500 text-warning-500 hover:bg-warning-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PencilSimpleLineIcon size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDeleteBank(row)}
                        disabled={isView}
                        className="p-1.5 btn-outline !text-danger-500 !border-danger-500 hover:bg-warning-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <TrashSimpleIcon size={20} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            <ModalAddBank
                isOpen={isBankModalOpen}
                onClose={handleCloseBankModal}
                onSubmit={handleSubmitBank}
                initialData={selectedBank}
            />
            <ModalCustom
                isOpen={isOpen}
                onClose={onClose}
                footer={false}
                title="Detail Bank"
                onSubmit={() => onSubmit({ ...formData, banks })}
                isView={isView}
                width="w-[800px]"
            >
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-neutral-900">List Bank</h3>
                        {!isView && (
                            <button
                                type="button"
                                onClick={() => handleOpenBankModal()}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium btn-outline rounded-md transition-colors"
                            >
                                <PlusCircleIcon size={20} />
                                Tambah Bank
                            </button>
                        )}
                    </div>

                    <div className="border border-neutral-200 rounded-lg overflow-hidden">
                        <Table
                            paginate={false}
                            columns={bankColumns}
                            data={banks}
                            page={1}
                            pageSize={banks.length > 0 ? banks.length : 10}
                            total={banks.length}
                            onPageChange={() => { }}
                            onPageSizeChange={() => { }}

                        />
                    </div>
                </div>


            </ModalCustom>
        </>
    );
}
