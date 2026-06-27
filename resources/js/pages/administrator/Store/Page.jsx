import { useEffect, useState } from 'react';
import { PencilSimple, PencilSimpleIcon } from "@phosphor-icons/react";
import ModalSettingStore from "./Modal";
import HeaderSection from '../../../components/HeaderSection';
import NullState from '../../../assets/images/setting_store.svg'
import StoreApis from '../../../Services/Store.apis';
import LoadingStore from '../../../Store/LoadingStore';
import StoreSettingStore from '../../../Store/StoreSettingStore';

const SettingStore = () => {
    const [storeData, setStoreData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const setLoading = LoadingStore((state) => state.setLoading);
    const setStoreSetting = StoreSettingStore((state) => state.setStoreSetting);
    const [formData, setFormData] = useState({});
    const [formError, setFormError] = useState({});
    const [requiredFields, setRequiredFields] = useState([
        { name: 'image', error_message: 'Logo toko wajib diupload' },
        { name: 'shop_name', error_message: 'Nama toko wajib diisi' },
        { name: 'website', error_message: 'Website wajib diisi' },
        { name: 'email', error_message: 'Email wajib diisi' }
    ]);


    const fetchData = () => {
        StoreApis.GetSettingsStore('').then(data => {
            console.log(data);
            const setting = data?.data?.[0] || null;
            setStoreData({...setting, image: setting?.image_path ? `${import.meta.env.VITE_API_BASE_URL}storage/${setting?.image_path}` : setting?.logo } || null);
            setStoreSetting(setting);
            setLoading(false);
        })
    }

    useEffect(() => {
        setLoading(true)
        fetchData();
    }, []);


    const handleOpenModal = (mode) => {
        setModalMode(mode);
        setFormError({});
        if (mode === 'edit' && storeData) {
            setFormData(storeData);
        } else {
            setFormData({});
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setTimeout(() => {
            setFormData({});
            setFormError({});
        }, 300);
    };

    const handleChange = (e) => {
        const { name, value, files } = e.target;

        if (files) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }

        if (formError[name]) {
            setFormError(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = async (data) => {
        let hasError = false;
        const newErrors = {};

        requiredFields.forEach(field => {
            const value = data[field.name];
            if (!value || (typeof value === 'string' && !value.trim())) {
                newErrors[field.name] = field.error_message;
                hasError = true;
            }
        });

        if (hasError) {
            setFormError(newErrors);
            return;
        }

        setLoading(true);

        try {
            const body = new FormData();
           if(data.image instanceof File) {
                body.append('image', data.image);
           }
            body.append('shop_name', data.shop_name);
            body.append('website', data.website);
            body.append('email', data.email);
            await data?.id ? StoreApis.PutSettingsStore(data.id, body) : StoreApis.PostSettingsStore(body);
            setTimeout(() => {
                fetchData();
                handleCloseModal();
                setLoading(false)
                showAlert({ title: 'Berhasil', message: 'Data berhasil disimpan', icon: 'success' });
            }, 500);
        } catch (error) {
            setLoading(false);
        }

        handleCloseModal();
    };



    return (
        <div className="flex flex-col w-full h-full gap-6">
            <HeaderSection
                title="Setting Toko"
                description="setting informasi toko untuk menampilkan branding pada dashboard dan operasional cabang."
            />

            {!storeData ? (
                <div className="flex flex-col items-center justify-center w-full py-20 bg-white shadow-sm rounded-xl">
                    <img
                        src={NullState}
                        alt="Store Empty"
                        className="object-contain w-48 h-48 "
                    />
                    <h2 className="mb-2 text-lg font-semibold text-gray-950">
                        Informasi Store Belum Diatur
                    </h2>
                    <p className="max-w-md mb-6 text-sm text-center text-gray-500">
                        Lengkapi identitas toko untuk menampilkan branding pada dashboard dan operasional cabang.
                    </p>
                    <button
                        onClick={() => handleOpenModal('add')}
                        className="px-6 py-2 text-sm font-medium text-white transition-colors rounded-lg bg-primary-500 hover:bg-primary-600"
                    >
                        Setting Toko
                    </button>
                </div>
            ) : (
                <div className="w-full p-6 bg-white shadow-sm rounded-xl">
                    <div className="flex items-start justify-between w-full">
                        <div className="flex gap-8">
                            <div className="flex flex-col gap-2">
                                <span className="text-sm text-gray-500">Logo Toko</span>
                                <div className="flex items-center justify-center w-24 h-24 border rounded-lg border-gray-200/60 p-2">
                                    {storeData.logo || storeData?.image_path ? (
                                        <img src={storeData.image_path ? `${import.meta.env.VITE_API_BASE_URL}storage/${storeData.image_path}` : URL.createObjectURL(storeData.logo)} alt="Logo Toko" className="object-contain w-full h-full" />
                                    ) : (
                                        <div className="text-gray-400">Logo</div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-24">
                                <div className="flex flex-col col-span-2">
                                    <span className="text-sm text-gray-500">Nama Toko</span>
                                    <span className="font-medium text-gray-950">{storeData.shop_name}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-gray-500">Website</span>
                                    <span className="font-medium text-gray-950">{storeData.website}</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm text-gray-500">Email</span>
                                    <span className="font-medium text-gray-950">{storeData.email}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => handleOpenModal('edit')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors bg-white border rounded-lg text-primary-500 border-primary-500 hover:bg-primary-50"
                        >
                            <PencilSimpleIcon size={18} />
                            Edit
                        </button>
                    </div>
                </div>
            )}

            <ModalSettingStore
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                mode={modalMode}
                formData={formData}
                onChange={handleChange}
                formError={formError}
            />
        </div>
    );
}

export default SettingStore;
