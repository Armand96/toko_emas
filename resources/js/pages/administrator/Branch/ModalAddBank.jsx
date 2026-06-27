import { useState, useEffect } from 'react';
import ModalCustom from '../../../components/modalCustom';
import InputGroup from '../../../components/FormElement/InputGroup';
import BankApis from '../../../Services/Bank.apis';
import HelperFunctions from '../../../utils/HelperFunctions';

export default function ModalAddBank({ isOpen, onClose, onSubmit, initialData }) {
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState({});
    const [bankOptions, setBankOptions] = useState([])

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData || {});
            setFormError({});
        }
    }, [isOpen, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;


        // if(name === "bank_id"){
        //     const findBank = bankOptions?.find((x) => x.id === x.value)
            setFormData(prev => ({ ...prev, [name]: value   }));
        // }
        if (formError[name]) {
            setFormError(prev => ({ ...prev, [name]: '' }));
        }
    };


    useEffect(() => {
        BankApis.GetBankMaster(`?per_page=10000&is_active=1`).then((res) => {
            setBankOptions(HelperFunctions.formatDropdownWithCode(res?.data, 'id', 'bank_code', 'bank_name'))
        })
    }, [isOpen])

    const handleSubmit = () => {
        let errors = {};
        if (!formData.bank_id) errors.bank_id = 'Nama Bank wajib diisi';
        if (!formData.nomor_rekening) errors.account_number = 'No Rekening wajib diisi';
        if (!formData.nama_pemilik) errors.account_number = 'Nama Pemilik Wajib diisi';


        if (Object.keys(errors).length > 0) {
            setFormError(errors);
            return;
        }

        onClose()
        onSubmit(formData);
    };

    const fields = [
        { name: 'bank_id', label: 'Nama Bank', type: 'dropdown', options: bankOptions, isRequired: true, placeholder: 'Pilih Bank' },
        { name: 'nomor_rekening', label: 'No Rekening', type: 'text', isRequired: true, placeholder: 'Masukkan No Rekening' },
        { name: 'nama_pemilik', label: 'Nama Pemilik', type: 'text', isRequired: true, placeholder: 'Masukkan Nama Pemilik' },
        { name: 'is_active', label: 'Status', type: 'checkbox', }


    ];

    return (
        <ModalCustom
            isOpen={isOpen}
            onClose={onClose}
            title={'Settings Bank'}
            width="w-[500px]"
            handleOnSubmit={handleSubmit}
            confirmTextButton="Simpan"
        >
            <div className="flex flex-col gap-4">
                <InputGroup
                    fields={fields}
                    formData={formData}
                    onChange={handleChange}
                    formError={formError}
                    cols="2"
                />
            </div>
        </ModalCustom>
    );
}
