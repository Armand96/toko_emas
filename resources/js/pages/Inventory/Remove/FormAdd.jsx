import { useState, useEffect } from 'react';
import { ScanIcon, XIcon, ImageIcon, WarningIcon, WrenchIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import ModalScanBarcode from "../../../components/ModaScanBarcode";
import InventoryApis from "../../../Services/Inventory.apis";
import HelperFunctions from "../../../utils/HelperFunctions";
import { showAlert } from "../../../utils/showAlert";
import PermissionStore from "../../../Store/PermissionStore";
import AuthStore from "../../../Store/AuthStore";

const JENIS_OPTIONS = [
    { value: 'HILANG', label: 'Hilang', desc: 'Item tidak ditemukan/hilang', Icon: WarningIcon, color: 'text-danger-500', bg: 'bg-danger-50' },
    { value: 'REPAIR', label: 'Repair', desc: 'Item keluar untuk perbaikan', Icon: WrenchIcon, color: 'text-neutral-500', bg: 'bg-neutral-100' },
];

const FormAdd = ({ setCurentState }) => {
    const isKasir = PermissionStore((s) => s.isKasir);
    const user = AuthStore((s) => s.user);
    const [formData, setFormData] = useState({ jenis: 'HILANG', catatan: '' });
    const [selectedItems, setSelectedItems] = useState([]);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inventoryOptions, setInventoryOptions] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const branchFilter = isKasir() && user?.branch_id ? `&branch_id=${user.branch_id}` : '';
        InventoryApis.GetInventory(`?per_page=10000&status=AVAILABLE${branchFilter}`)
            .then((res) => {
                const list = res?.data || [];
                setInventoryOptions(list);
            })
            .catch(console.error);
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const addItemFromInventory = (inv) => {
        if (!inv) return;
        if (selectedItems.find(i => i.inventory_code === inv.inventory_code)) {
            showAlert({ title: 'Duplikat', message: 'Item ini sudah ditambahkan.', icon: 'warning', confirmText: 'OK' });
            return;
        }
        setSelectedItems(prev => [...prev, {
            id: inv.id,
            inventory_code: inv.inventory_code,
            product_id: inv.product_id,
            name: inv.product?.product_name || inv.product?.name || inv.inventory_code,
            weight: inv.berat ? `${inv.berat}g` : '-',
            karat: inv.karat || '-',
            price: inv.jual || 0,
            image: inv.image_path ? HelperFunctions.getStorageUrl(inv.image_path) : null,
        }]);
        if (errors.items) setErrors(prev => ({ ...prev, items: null }));
    };

    const handleSelectChange = (e) => {
        const inventoryCode = e.target.value;
        if (!inventoryCode) return;
        const inv = inventoryOptions.find(i => i.inventory_code === inventoryCode);
        addItemFromInventory(inv);
        e.target.value = '';
    };

    const handleScanSuccess = async (scannedCode) => {
        setIsScanModalOpen(false);
        try {
            const res = await InventoryApis.GetInventory(`?inventory_code=${scannedCode}`);
            const list = res?.data || [];
            if (list.length > 0) {
                addItemFromInventory(list[0]);
            } else {
                showAlert({ title: 'Tidak Ditemukan', message: `Item dengan kode ${scannedCode} tidak ditemukan.`, icon: 'error', confirmText: 'OK' });
            }
        } catch (err) {
            console.error(err);
            showAlert({ title: 'Error', message: 'Gagal memuat data item.', icon: 'error', confirmText: 'OK' });
        }
    };

    const handleRemoveItem = (inventoryCode) => {
        setSelectedItems(prev => prev.filter(item => item.inventory_code !== inventoryCode));
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.catatan.trim()) newErrors.catatan = 'Catatan wajib diisi';
        if (selectedItems.length === 0) newErrors.items = 'Pilih minimal 1 item';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsSubmitting(true);
        try {
            const payload = {
                branch_id: user?.branch_id || 1,
                user_id: user?.id || 1,
                jenis: formData.jenis,
                note: formData.catatan,
                item: selectedItems.map(i => ({
                    inventory_code: i.inventory_code,
                    product_id: i.product_id,
                })),
            };

            await InventoryApis.PostRemoveItem(payload);
            await showAlert({ title: 'Berhasil', message: 'Remove item berhasil diajukan.', icon: 'success', confirmText: 'OK' });
            setCurentState('main');
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.message || 'Terjadi kesalahan saat menyimpan.';
            showAlert({ title: 'Gagal', message: msg, icon: 'error', confirmText: 'OK' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-gray-50/50 p-6 min-h-screen">
            <HeaderSection
                title="Input Remove Item"
                description="Lengkapi informasi dan pilih item inventory yang akan dikeluarkan dari inventory aktif."
            />

            <div className="w-full flex flex-col gap-6">

                {/* CARD 1: INFORMASI PENGELUARAN */}
                <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                        <h2 className="text-lg font-semibold text-gray-900">Informasi Pengeluaran</h2>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Jenis<span className="text-danger-500 ml-1">*</span></label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {JENIS_OPTIONS.map((opt) => {
                                    const active = formData.jenis === opt.value;
                                    return (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, jenis: opt.value }))}
                                            className={`flex items-center gap-3 p-4 rounded-lg border text-left transition-all cursor-pointer ${active ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                                        >
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${opt.bg}`}>
                                                <opt.Icon size={22} weight="fill" className={opt.color} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                                                <span className="text-xs text-gray-500">{opt.desc}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Catatan<span className="text-danger-500 ml-1">*</span></label>
                            <textarea
                                name="catatan"
                                value={formData.catatan}
                                onChange={handleInputChange}
                                placeholder="Tuliskan keterangan pengeluaran item"
                                rows="3"
                                className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none ${errors.catatan ? 'border-danger-500' : 'border-gray-300'}`}
                            />
                            {errors.catatan && <span className="text-xs text-danger-500">{errors.catatan}</span>}
                        </div>
                    </div>
                </div>

                {/* CARD 2: DAFTAR BARANG */}
                <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                        <h2 className="text-lg font-semibold text-gray-900">Daftar Barang</h2>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsScanModalOpen(true)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-primary-500 text-primary-500 bg-white rounded-lg hover:bg-primary-50 transition-colors font-medium text-sm cursor-pointer"
                            >
                                <ScanIcon size={20} />
                                Scan QR Code
                            </button>

                            <span className="text-sm text-gray-400 font-medium">atau</span>

                            <div className="flex-[2]">
                                <select
                                    onChange={handleSelectChange}
                                    className={`w-full px-4 py-2.5 bg-white border rounded-lg text-gray-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer ${errors.items ? 'border-danger-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Pilih item..</option>
                                    {inventoryOptions.map((inv) => (
                                        <option key={inv.inventory_code} value={inv.inventory_code}>
                                            {inv.inventory_code} - {inv.product?.product_name || inv.product?.name || '-'} ({inv.berat ? `${inv.berat}g` : '-'} • {inv.karat ? `${inv.karat}K` : '-'})
                                        </option>
                                    ))}
                                </select>
                                {errors.items && <span className="text-xs text-danger-500 mt-1 block">{errors.items}</span>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {selectedItems.map((item) => (
                                <div key={item.inventory_code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-md text-xs font-semibold tracking-wide border border-gray-200">
                                            {item.inventory_code}
                                        </div>
                                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-400 overflow-hidden">
                                            {item.image
                                                ? <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                                : <ImageIcon size={24} weight="fill" />
                                            }
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                                            <span className="text-xs text-gray-500">{item.weight} • {item.karat}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 justify-between sm:justify-end">
                                        <span className="text-sm font-bold text-gray-900">{HelperFunctions.formatCurrency(item.price)}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.inventory_code)}
                                            className="p-1.5 text-danger-500 hover:bg-danger-50 rounded-md transition-colors cursor-pointer"
                                        >
                                            <XIcon size={16} weight="bold" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {selectedItems.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                    Belum ada barang yang dipilih.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* FOOTER BUTTONS */}
                <div className="flex items-center justify-between mt-2 mb-8">
                    <button
                        type="button"
                        onClick={() => setCurentState('main')}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan & Ajukan'}
                    </button>
                </div>
            </div>

            <ModalScanBarcode
                isOpen={isScanModalOpen}
                onClose={() => setIsScanModalOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
        </div>
    );
};

export default FormAdd;
