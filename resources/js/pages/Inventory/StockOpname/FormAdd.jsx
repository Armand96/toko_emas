import { useState, useEffect, useMemo } from 'react';
import { ScanIcon, PackageIcon, CheckCircleIcon, ClockCountdownIcon, PlusCircleIcon } from "@phosphor-icons/react";
import ModalScanBarcode from "../../../components/ModaScanBarcode";
import StatCards from "./StatCards";
import InventoryApis from "../../../Services/Inventory.apis";
import CodeBadge from "../../../components/CodeBadge";
import Badge from "../../../components/Badge";
import HelperFunctions from "../../../utils/HelperFunctions";
import { showAlert } from "../../../utils/showAlert";
import AuthStore from "../../../Store/AuthStore";

const FormAdd = ({ setCurentState }) => {
    const user = AuthStore((s) => s.user);

    const [activeTab, setActiveTab] = useState('sesuai');
    const [isScanModalOpen, setIsScanModalOpen] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Seluruh inventory cabang user (status AVAILABLE) = baseline yang harus dicocokkan.
    const [branchInventory, setBranchInventory] = useState([]);
    // Map inventory_code -> data inventory cabang ini, untuk lookup O(1) saat scan.
    const inventoryMap = useMemo(() => {
        const map = {};
        branchInventory.forEach((inv) => { map[inv.inventory_code] = inv; });
        return map;
    }, [branchInventory]);

    // Hasil scan/input: kode -> { status: 'AVAILABLE' | 'EXTRA', inv, waktu }
    const [scanned, setScanned] = useState({});

    useEffect(() => {
        if (!user?.branch_id) return;
        setIsLoading(true);
        InventoryApis.GetInventory(`?per_page=10000&status=AVAILABLE&branch_id=${user.branch_id}`)
            .then((res) => {
                setBranchInventory(res?.data || []);
            })
            .catch((err) => {
                console.error(err);
                showAlert({ title: 'Gagal', message: 'Gagal memuat inventory cabang.', icon: 'error', confirmText: 'OK' });
            })
            .finally(() => setIsLoading(false));
    }, [user?.branch_id]);

    // ── Derived lists ────────────────────────────────────────────
    const scannedList = useMemo(() => Object.entries(scanned).map(([code, v]) => ({ code, ...v })), [scanned]);

    // AVAILABLE: barang cabang ini yang sudah ke-scan.
    const availableList = useMemo(
        () => scannedList.filter((s) => s.status === 'AVAILABLE'),
        [scannedList]
    );
    // EXTRA: barang ke-scan tapi bukan milik cabang ini / tidak terdaftar.
    const extraList = useMemo(
        () => scannedList.filter((s) => s.status === 'EXTRA'),
        [scannedList]
    );
    // LOST (preview): barang cabang yang belum ke-scan. Baru final saat finalisasi.
    const lostPreview = useMemo(
        () => branchInventory.filter((inv) => !scanned[inv.inventory_code]),
        [branchInventory, scanned]
    );

    const totalScanned = scannedList.length;
    const totalBranch = branchInventory.length;
    const progress = totalBranch > 0 ? Math.min(100, Math.round((availableList.length / totalBranch) * 100)) : 0;

    const stats = [
        { label: 'Total Item Aktif di System', value: totalBranch, icon: PackageIcon, iconBg: 'bg-primary-50', iconColor: 'text-primary-500' },
        { label: 'Sudah Scan/Input', value: totalScanned, icon: CheckCircleIcon, iconBg: 'bg-success-50', iconColor: 'text-success-600' },
        { label: 'Belum Scan/Input', value: lostPreview.length, icon: ClockCountdownIcon, iconBg: 'bg-warning-50', iconColor: 'text-warning-600' },
        { label: 'Extra Item', value: extraList.length, icon: PlusCircleIcon, iconBg: 'bg-neutral-100', iconColor: 'text-neutral-600' },
    ];

    // ── Verifikasi kode ──────────────────────────────────────────
    const verifyCode = async (rawCode) => {
        const code = String(rawCode || '').trim();
        if (!code) return;

        if (scanned[code]) {
            showAlert({ title: 'Sudah Discan', message: `Kode ${code} sudah pernah diverifikasi.`, icon: 'warning', confirmText: 'OK' });
            return;
        }

        const inv = inventoryMap[code];
        setManualCode('');

        if (inv) {
            // Barang memang ada di inventory cabang ini -> AVAILABLE.
            setScanned((prev) => ({ ...prev, [code]: { status: 'AVAILABLE', inv, waktu: new Date().toISOString() } }));
            return;
        }

        // Barang discan tapi tidak terdaftar di cabang ini -> EXTRA.
        // Minta keterangan dulu (textarea wajib) sebelum item disimpan.
        const { confirmed, value } = await showAlert({
            title: 'Item Extra',
            message: `Kode ${code} tidak terdaftar di cabang ini. Jelaskan kenapa barang ini ada.`,
            icon: 'warning',
            textarea: true,
            placeholder: 'Contoh: titipan dari cabang lain, retur pelanggan, dll.',
            confirmText: 'Simpan',
            cancelText: 'Batal',
        });
        if (!confirmed) return;

        setScanned((prev) => ({
            ...prev,
            [code]: { status: 'EXTRA', inv: null, note: (value || '').trim(), waktu: new Date().toISOString() },
        }));
        setActiveTab('extra');
    };

    const handleScanSuccess = (code) => {
        setIsScanModalOpen(false);
        verifyCode(code);
    };

    const handleManualVerify = () => {
        verifyCode(manualCode);
    };

    // ── Finalisasi ───────────────────────────────────────────────
    const handleFinalize = async () => {
        if (totalScanned === 0) {
            showAlert({ title: 'Belum Ada Item', message: 'Scan / input minimal 1 item sebelum finalisasi.', icon: 'warning', confirmText: 'OK' });
            return;
        }

        const { confirmed } = await showAlert({
            title: 'Finalisasi Opname',
            message: `Sesuai: ${availableList.length}, Lost: ${lostPreview.length}, Extra: ${extraList.length}. Lanjutkan finalisasi?`,
            icon: 'warning',
            confirmText: 'Ya, Finalisasi',
            cancelText: 'Batal',
        });
        if (!confirmed) return;

        // Bangun payload sesuai kontrak BE: item[] { inventory_code, product_id, last_status, opname_status }
        const item = [];

        // AVAILABLE -> INSTOCK
        availableList.forEach((s) => {
            item.push({
                inventory_code: s.code,
                product_id: s.inv?.product_id,
                last_status: s.inv?.status || 'AVAILABLE',
                opname_status: 'INSTOCK',
            });
        });

        // LOST -> MISSING (barang cabang yang tidak pernah ke-scan)
        lostPreview.forEach((inv) => {
            item.push({
                inventory_code: inv.inventory_code,
                product_id: inv.product_id,
                last_status: inv.status || 'AVAILABLE',
                opname_status: 'MISSING',
            });
        });

        // EXTRA -> EXTRA (barang discan tapi bukan milik cabang ini)
        extraList.forEach((s) => {
            item.push({
                inventory_code: s.code,
                product_id: s.inv?.product_id || 0,
                last_status: s.inv?.status || 'AVAILABLE',
                opname_status: 'EXTRA',
                note: s.note || null,
            });
        });

        setIsSubmitting(true);
        try {
            await InventoryApis.PostStockOpname({ branch_id: user.branch_id, item });
            await showAlert({ title: 'Berhasil', message: 'Stock opname berhasil difinalisasi.', icon: 'success', confirmText: 'OK' });
            setCurentState({ view: 'main' });
        } catch (err) {
            console.error(err);
            const msg = err?.response?.data?.message || 'Terjadi kesalahan saat finalisasi.';
            showAlert({ title: 'Gagal', message: msg, icon: 'error', confirmText: 'OK' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const fmtWaktu = (iso) =>
        iso ? new Date(iso).toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

    // Tab "Lost" sengaja tidak ditampilkan saat sesi aktif — lost baru ketahuan
    // saat finalisasi. Tab "Extra" hanya muncul kalau memang ada item extra.
    const tabs = [
        { id: 'sesuai', label: `Sesuai (${availableList.length})` },
        ...(extraList.length > 0 ? [{ id: 'extra', label: `Extra (${extraList.length})` }] : []),
    ];

    return (
        <div className="w-full h-full flex flex-col gap-6 bg-gray-50/50 p-6 min-h-screen">
            <div className="flex flex-col lg:flex-row gap-y-3 lg:items-center justify-between p-4">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[24px] font-semibold text-gray-950">Stock Opname Item</span>
                    <span className="text-[13px] text-gray-500">Lakukan pengecekan stok fisik untuk memastikan data inventory sesuai dengan kondisi aktual.</span>
                </div>
                <button
                    type="button"
                    onClick={handleFinalize}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Memproses...' : 'Finalisasi Opname'}
                </button>
            </div>

            <StatCards stats={stats} />

            {/* SESI AKTIF */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-5">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg font-semibold text-gray-900">Sesi Aktif</h2>
                    <span className="text-sm text-gray-500">
                        {user?.branch?.branch_name || `Cabang #${user?.branch_id ?? '-'}`} · {isLoading ? 'Memuat inventory...' : `${totalBranch} item aktif`}
                    </span>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="text-gray-500">{availableList.length} / {totalBranch} item</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setIsScanModalOpen(true)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border border-primary-500 text-primary-500 bg-white rounded-lg hover:bg-primary-50 transition-colors font-medium text-sm cursor-pointer"
                    >
                        <ScanIcon size={20} />
                        Scan QR Code
                    </button>

                    <span className="text-sm text-gray-400 font-medium text-center">atau</span>

                    <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleManualVerify(); }}
                        placeholder="Masukkan kode.."
                        className="flex-[2] px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-700 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                    />

                    <button
                        type="button"
                        onClick={handleManualVerify}
                        disabled={!manualCode.trim()}
                        className="px-5 py-2.5 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        Verifikasi Barang
                    </button>
                </div>
            </div>

            {/* HASIL VERIFIKASI */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col gap-4">
                <div className="flex flex-col gap-0.5">
                    <h2 className="text-lg font-semibold text-gray-900">Hasil Verifikasi</h2>
                    <span className="text-sm text-gray-500">Hasil pencocokan item hasil scan dengan data inventory sistem.</span>
                </div>

                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 w-fit border border-gray-200">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab !== 'extra' && <InventoryRows rows={availableList.map((s) => ({ ...s.inv, _waktu: s.waktu }))} statusLabel="Available" />}
                {activeTab === 'extra' && extraList.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-900">
                            <thead className="text-xs text-gray-600 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 font-semibold">Kode</th>
                                    <th className="px-4 py-3 font-semibold">Catatan</th>
                                    <th className="px-4 py-3 font-semibold">Waktu Opname</th>
                                </tr>
                            </thead>
                            <tbody>
                                {extraList.map((row) => (
                                    <tr key={row.code} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <CodeBadge>{row.code}</CodeBadge>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{row.note || 'Barcode tidak ditemukan di sistem atau di cabang ini.'}</td>
                                        <td className="px-4 py-3 text-gray-600">{fmtWaktu(row.waktu)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-start mb-8">
                <button
                    type="button"
                    onClick={() => setCurentState({ view: 'main' })}
                    className="btn-outline px-6 py-2.5 rounded-lg font-medium text-sm"
                >
                    Kembali
                </button>
            </div>

            <ModalScanBarcode
                isOpen={isScanModalOpen}
                onClose={() => setIsScanModalOpen(false)}
                onScanSuccess={handleScanSuccess}
            />
        </div>
    );
};

const InventoryRows = ({ rows, statusLabel, lost = false }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-900">
            <thead className="text-xs text-gray-600 border-b border-gray-200">
                <tr>
                    <th className="px-4 py-3 font-semibold">Kode</th>
                    <th className="px-4 py-3 font-semibold">Produk</th>
                    <th className="px-4 py-3 font-semibold">Kategori</th>
                    <th className="px-4 py-3 font-semibold">Berat</th>
                    <th className="px-4 py-3 font-semibold">Karat</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Belum ada item.</td></tr>
                ) : rows.map((row, idx) => (
                    <tr key={row.inventory_code || idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                            <CodeBadge>{row.inventory_code}</CodeBadge>
                        </td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-amber-50 rounded-md border border-gray-100 flex-shrink-0 overflow-hidden">
                                    {row.image_path && <img src={HelperFunctions.getStorageUrl(row.image_path)} alt="" className="w-full h-full object-cover" />}
                                </div>
                                <span className="text-sm font-medium text-gray-800">{row.product?.product_name || row.product?.name || '-'}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{row.category?.category_name || row.category?.name || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{row.berat ? `${row.berat}g` : '-'}</td>
                        <td className="px-4 py-3 text-gray-600">{row.karat ? `${row.karat}K` : '-'}</td>
                        <td className="px-4 py-3">
                            <Badge tone={lost ? 'danger' : 'success'}>
                                {statusLabel}
                            </Badge>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export default FormAdd;
