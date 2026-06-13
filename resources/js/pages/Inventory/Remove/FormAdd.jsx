import { useState } from 'react';
import { ScanIcon, XIcon, ImageIcon, WarningIcon, WrenchIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import ModalScanBarcode from "../../../components/ModaScanBarcode";

const JENIS_OPTIONS = [
    { value: 'Hilang', label: 'Hilang', desc: 'Item tidak ditemukan/hilang', Icon: WarningIcon, color: 'text-danger-500', bg: 'bg-danger-50' },
    { value: 'Repair', label: 'Repair', desc: 'Item keluar untuk perbaikan', Icon: WrenchIcon, color: 'text-neutral-500', bg: 'bg-neutral-100' },
];

const FormAdd = ({ setCurentState }) => {
    const [formData, setFormData] = useState({
        jenis: 'Hilang',
        catatan: '',
    });

    const [selectedItems, setSelectedItems] = useState([
        { id: 1, code: 'GLD0100000', name: 'Kalung Italy Rantai', weight: '5g', karat: '18K', price: 'Rp 19.500.000' },
        { id: 2, code: 'GLD0100001', name: 'Gelang Flower', weight: '8g', karat: '20K', price: 'Rp 19.500.000' },
    ]);

    const [isScanModalOpen, setIsScanModalOpen] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRemoveItem = (idToRemove) => {
        setSelectedItems(prev => prev.filter(item => item.id !== idToRemove));
    };

    const handleScanSuccess = (scannedCode) => {
        const newItem = {
            id: Date.now(),
            code: scannedCode,
            name: 'Item Hasil Scan',
            weight: '0g',
            karat: '24K',
            price: 'Rp 0',
        };
        setSelectedItems(prev => [...prev, newItem]);
    };

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-gray-50/50 p-6 min-h-screen">
            <HeaderSection
                title="Input Remove Item"
                description="Lengkapi informasi dan pilih item inventory yang akan dikeluarkan dari inventory aktif."
            />

            <div className="w-full flex flex-col gap-6">

                {/* --- CARD 1: INFORMASI PENGELUARAN --- */}
                <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                        <h2 className="text-lg font-semibold text-gray-900">Informasi Pengeluaran</h2>
                    </div>

                    <div className="flex flex-col gap-5">
                        {/* Pilih Jenis */}
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

                        {/* Catatan */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Catatan<span className="text-danger-500 ml-1">*</span></label>
                            <textarea
                                name="catatan"
                                value={formData.catatan}
                                onChange={handleInputChange}
                                placeholder="Masukkan catatan..."
                                rows="3"
                                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* --- CARD 2: DAFTAR BARANG --- */}
                <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
                        <h2 className="text-lg font-semibold text-gray-900">Daftar Barang</h2>
                    </div>

                    <div className="flex flex-col gap-6">
                        {/* Scan & Select */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsScanModalOpen(true)}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-primary-500 text-primary-500 bg-white rounded-lg hover:bg-primary-50 transition-colors font-medium text-sm cursor-pointer"
                            >
                                <ScanIcon size={20} />
                                Scan Barcode
                            </button>

                            <span className="text-sm text-gray-400 font-medium">atau</span>

                            <div className="flex-[2]">
                                <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-500 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 cursor-pointer">
                                    <option value="">Pilih item..</option>
                                    <option value="item1">Kalung Italy Rantai</option>
                                    <option value="item2">Gelang Flower</option>
                                </select>
                            </div>
                        </div>

                        {/* List Selected Items */}
                        <div className="flex flex-col gap-3">
                            {selectedItems.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="px-3 py-1.5 bg-gray-50 text-gray-500 rounded-md text-xs font-semibold tracking-wide border border-gray-200">
                                            {item.code}
                                        </div>
                                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-400 overflow-hidden">
                                            <ImageIcon size={24} weight="fill" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-900">{item.name}</span>
                                            <span className="text-xs text-gray-500">{item.weight} • {item.karat}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 justify-between sm:justify-end">
                                        <span className="text-sm font-bold text-gray-900">{item.price}</span>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
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

                {/* --- FOOTER BUTTONS --- */}
                <div className="flex items-center justify-between mt-2 mb-8">
                    <button
                        onClick={() => setCurentState('main')}
                        className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                    >
                        Batal
                    </button>
                    <button
                        className="px-6 py-2.5 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors text-sm cursor-pointer"
                    >
                        Simpan & Ajukan
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