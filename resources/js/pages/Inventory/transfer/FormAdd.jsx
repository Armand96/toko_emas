import { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Scan, X, Image as ImageIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import ModalScanBarcode from "../../../components/ModaScanBarcode";
import InventoryApis from "../../../Services/Inventory.apis";
import CodeBadge from "../../../components/CodeBadge";
import HelperFunctions from "../../../utils/HelperFunctions";
import { showAlert } from "../../../utils/showAlert";
import OptionsStore from "../../../Store/OptionsStore";
import AuthStore from "../../../Store/AuthStore";
import Dropdown from "../../../components/FormElement/SingleElement/Dropdown";

const FormAdd = ({ setCurentState }) => {
    const user = AuthStore((s) => s.user);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
    const ensureProducts = OptionsStore((s) => s.ensureProducts);

    const [formData, setFormData] = useState({ cabang_tujuan: '', catatan: '' });
    const [selectedItems, setSelectedItems] = useState([]);
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [inventoryOptions, setInventoryOptions] = useState([]);
    const [branchOptions, setBranchOptions] = useState([]);
    const [userBranchName, setUserBranchName] = useState('');
    const [productMap, setProductMap] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        ensureBranches().then((data) => {
            const userBranch = data.find((b) => b.id === user?.branch_id);
            if (userBranch) setUserBranchName(userBranch.branch_name);

            const filtered = data
                .filter((b) => b.id !== user?.branch_id)
                .map((b) => ({ label: b.branch_name, value: b.id }));
            setBranchOptions(filtered);
        });

        ensureProducts().then((data) => {
            const map = {};
            data.forEach((p) => { map[p.id] = p.product_name; });
            setProductMap(map);
        });

        if (user?.branch_id) {
            InventoryApis.GetInventory(`?per_page=10000&status=AVAILABLE&branch_id=${user.branch_id}`)
                .then((res) => {
                    const list = res?.data || [];
                    setInventoryOptions(list);
                })
                .catch(console.error);
        }
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
            name: productMap[inv.product_id] || inv.product?.product_name || inv.product?.name || inv.inventory_code,
            weight: inv.berat ? `${inv.berat}g` : '-',
            karat: inv.karat || '-',
            price: inv.jual || 0,
            image: inv.image_path ? HelperFunctions.getStorageUrl(inv.image_path) : null,
        }]);
        if (errors.items) setErrors(prev => ({ ...prev, items: null }));
    };

    const itemDropdownOptions = useMemo(() => {
        return inventoryOptions
            .filter((inv) => !selectedItems.some((item) => item.inventory_code === inv.inventory_code))
            .map((inv) => {
                const prodName = productMap[inv.product_id] || inv.product?.product_name || inv.product?.name || '-';
                return {
                    value: inv.inventory_code,
                    label: `${inv.inventory_code} - ${prodName} (${inv.berat}g • ${inv.karat})`,
                };
            });
    }, [inventoryOptions, selectedItems, productMap]);

    const handleSelectChange = (e) => {
        const inventoryCode = e.target.value;
        if (!inventoryCode) return;
        const inv = inventoryOptions.find(i => i.inventory_code === inventoryCode);
        addItemFromInventory(inv);
    };

    const handleScanSuccess = async (scannedCode) => {
        setIsScanModalOpen(false);
        try {
            const res = await InventoryApis.GetInventory(`?inventory_code=${scannedCode}&branch_id=${user?.branch_id}`);
            const list = res?.data || [];
            if (list.length > 0) {
                addItemFromInventory(list[0]);
            } else {
                showAlert({ title: 'Tidak Ditemukan', message: `Item dengan kode ${scannedCode} tidak ditemukan di cabang ini.`, icon: 'error', confirmText: 'OK' });
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
        if (!formData.cabang_tujuan) newErrors.cabang_tujuan = 'Cabang tujuan wajib dipilih';
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
                branch_source_id: user?.branch_id,
                branch_dest_id: parseInt(formData.cabang_tujuan),
                note: formData.catatan,
                item: selectedItems.map(i => ({
                    inventory_code: i.inventory_code,
                    product_id: i.product_id,
                })),
            };

            await InventoryApis.PostTransferItem(payload);
            await showAlert({ title: 'Berhasil', message: 'Transfer item berhasil diajukan.', icon: 'success', isAutoClose: true });
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
                title="Input Transfer"
                description="Lengkapi informasi transfer dan pilih item inventory yang akan ditransfer antar cabang."
            />

            <div className="w-full flex flex-col gap-6">

                {/* --- CARD 1: INFORMASI TRANSFER --- */}
                <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                        <h2 className="text-lg font-semibold text-gray-900">Informasi Transfer</h2>
                    </div>

                    <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Cabang Asal</label>
                                <input
                                    type="text"
                                    value={userBranchName}
                                    disabled
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 outline-none"
                                />
                            </div>

                            <div className="mt-6 text-gray-400">
                                <ArrowRight size={20} weight="bold" />
                            </div>

                            <div className="flex-1 flex flex-col gap-1.5">
                                <Dropdown
                                    label="Cabang Tujuan"
                                    name="cabang_tujuan"
                                    value={formData.cabang_tujuan}
                                    options={branchOptions}
                                    placeholder="Pilih cabang tujuan"
                                    isRequired
                                    onChange={handleInputChange}
                                    error={errors.cabang_tujuan}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">
                                Catatan<span className="text-red-500 ml-1">*</span>
                            </label>
                            <textarea
                                name="catatan"
                                value={formData.catatan}
                                onChange={handleInputChange}
                                placeholder="Tuliskan keterangan transfer item"
                                rows="3"
                                className={`w-full px-4 py-3 bg-white border rounded-lg text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none ${errors.catatan ? 'border-danger-500' : 'border-gray-300'}`}
                            ></textarea>
                            {errors.catatan && <span className="text-xs text-danger-500">{errors.catatan}</span>}
                        </div>
                    </div>
                </div>

                {/* --- CARD 2: DAFTAR BARANG --- */}
                <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                        <h2 className="text-lg font-semibold text-gray-900">Daftar Barang</h2>
                    </div>

                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsScanModalOpen(true)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-blue-500 text-blue-500 bg-white rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm cursor-pointer"
                            >
                                <Scan size={20} />
                                Scan QR Code
                            </button>

                            <span className="text-sm text-gray-400 font-medium">atau</span>

                            <div className="flex-[2]">
                                <Dropdown
                                    name="item_select"
                                    value=""
                                    options={itemDropdownOptions}
                                    placeholder="Pilih item.."
                                    onChange={handleSelectChange}
                                    error={errors.items}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {selectedItems.map((item) => (
                                <div key={item.inventory_code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <CodeBadge variant="blue">{item.inventory_code}</CodeBadge>
                                        <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-400 overflow-hidden">
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
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                        >
                                            <X size={16} weight="bold" />
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

                {/* --- FOOTER BUTTONS --- */}
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
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Ajukan Transfer Item'}
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
