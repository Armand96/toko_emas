import { useState, useEffect, useMemo } from 'react';
import { FloppyDiskIcon, PlusIcon, TrashIcon, TrendUpIcon, TrendDownIcon, PencilSimpleIcon, DotsSixVerticalIcon } from "@phosphor-icons/react";
import HeaderSection from "../../../components/HeaderSection";
import { showAlert } from '../../../utils/showAlert';
import HelperFunctions from '../../../utils/HelperFunctions';
import LoadingStore from '../../../Store/LoadingStore';
import PermissionStore from '../../../Store/PermissionStore';
import HargaSettingApis from '../../../Services/HargaSetting.apis';

const toNumber = (value) => {
    const parsed = Number(String(value ?? '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
};

// Tampilan saja, meniru Excel: kadar 3 desimal, LB 2 desimal.
// Nilai asli tetap presisi penuh (1,07833333…) dan itu yang dipakai menghitung
// harga — membulatkan nilainya bikin harga meleset ribuan rupiah per gram.
// Nilai tepat di titik tengah dibulatkan ke atas seperti Excel (0,995 -> 1,00);
// toFixed sendiri membulatkannya ke bawah karena representasi floating point.
const displayDecimal = (value, digits = 2) => {
    const num = Number(String(value ?? '').replace(',', '.'));
    if (!Number.isFinite(num) || value === '' || value === null) return '';
    const factor = 10 ** digits;
    return (Math.round((num * factor).toFixed(4)) / factor).toFixed(digits);
};

const newKey = () => crypto.randomUUID();

// Selisih LB Jual terhadap kadar, sesuai formula Excel (=KADAR+0,12).
const MARGIN_LB_JUAL = 0.12;

// Markup harga jual logam mulia terhadap harga dasarnya.
// Harus sama dengan MARGIN_JUAL di App\Models\HargaLogamMulia.
const MARGIN_JUAL_LM = 0.03;


// Formula Excel: kadar = karat/24, lb_jual = kadar + 0,12 — dihitung dari
// karat setiap render supaya presisi tidak pernah hilang karena pembulatan
// tampilan (0,958 + 0,12 = 1,078 menghasilkan harga meleset ~800 rupiah).
// Baris dengan is_override memakai angka yang diketik admin (mis. 24K).
const derivePerhiasan = (row) => {
    if (row.is_override) {
        return { kadar: toNumber(row.kadar), lb_jual: toNumber(row.lb_jual) };
    }
    const karat = toNumber(row.karat);
    if (karat <= 0) return { kadar: 0, lb_jual: 0 };
    const kadar = karat / 24;
    return { kadar, lb_jual: kadar + MARGIN_LB_JUAL };
};

const EmptyRow = ({ cols, text }) => (
    <tr>
        <td colSpan={cols} className="px-4 py-10 text-center text-sm text-gray-400">{text}</td>
    </tr>
);

const TABS = [
    { id: 'jual-perhiasan', label: 'Jual Perhiasan', tone: 'jual' },
    { id: 'beli-perhiasan', label: 'Beli Perhiasan', tone: 'beli' },
    { id: 'jual-lm', label: 'Jual Logam Mulia', tone: 'jual' },
    { id: 'beli-lm', label: 'Beli Logam Mulia', tone: 'beli' },
];

const SettingHarga = () => {
    const setLoading = LoadingStore((state) => state.setLoading);
    const can = PermissionStore((state) => state.can);
    const canEdit = can('update');

    const [activeTab, setActiveTab] = useState('jual-perhiasan');
    const [dragKey, setDragKey] = useState(null);
    const [dasar, setDasar] = useState({
        harga_dasar_jual: '', harga_dasar_beli: '',
        harga_dasar_jual_lm: '', harga_dasar_beli_lm: '',
    });
    const [perhiasan, setPerhiasan] = useState([]);
    const [logamMulia, setLogamMulia] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await HargaSettingApis.GetHargaSetting();
            setDasar({
                harga_dasar_jual: res?.dasar?.harga_dasar_jual ?? 0,
                harga_dasar_beli: res?.dasar?.harga_dasar_beli ?? 0,
                harga_dasar_jual_lm: res?.dasar?.harga_dasar_jual_lm ?? 0,
                harga_dasar_beli_lm: res?.dasar?.harga_dasar_beli_lm ?? 0,
            });
            // Flag override tidak disimpan di DB: baris yang nilainya menyimpang
            // dari rumus (mis. 24K) dikenali dari selisihnya saat dimuat.
            setPerhiasan((res?.perhiasan ?? []).map((row) => {
                const karat = toNumber(row.karat);
                const kadarRumus = karat > 0 ? karat / 24 : 0;
                const menyimpang = Math.abs(toNumber(row.kadar) - kadarRumus) > 1e-6
                    || Math.abs(toNumber(row.lb_jual) - (kadarRumus + MARGIN_LB_JUAL)) > 1e-6;
                return { ...row, key: newKey(), is_override: menyimpang };
            }));
            setLogamMulia((res?.logam_mulia ?? []).map((row) => ({ ...row, key: newKey() })));
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Gagal memuat data harga' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const dasarJual = toNumber(dasar.harga_dasar_jual);
    const dasarBeli = toNumber(dasar.harga_dasar_beli);
    const dasarJualLm = toNumber(dasar.harga_dasar_jual_lm);
    const dasarBeliLm = toNumber(dasar.harga_dasar_beli_lm);

    // Preview mengikuti rumus BE: harga = lb x harga dasar x berat.
    const perhiasanPreview = useMemo(
        () => perhiasan.map((row) => {
            const berat = toNumber(row.berat) || 1;
            const { kadar, lb_jual } = derivePerhiasan(row);
            return {
                ...row,
                kadarValue: kadar,
                lbJualValue: lb_jual,
                harga_jual: Math.round(lb_jual * dasarJual * berat),
                harga_beli: Math.round(toNumber(row.lb_beli) * dasarBeli * berat),
            };
        }),
        [perhiasan, dasarJual, dasarBeli]
    );

    // Logam mulia punya harga dasar sendiri; harga jual kena markup,
    // buyback murni dasar beli x berat.
    const logamMuliaPreview = useMemo(
        () => logamMulia.map((row) => {
            const berat = toNumber(row.berat);
            const hargaDasar = Math.round(dasarJualLm * berat);
            return {
                ...row,
                harga_dasar: hargaDasar,
                harga_jual: Math.round(hargaDasar * (1 + MARGIN_JUAL_LM)),
                harga_buyback: Math.round(dasarBeliLm * berat),
            };
        }),
        [logamMulia, dasarJualLm, dasarBeliLm]
    );

    const updateRow = (setRows, key, name, value) => {
        setRows((prev) => prev.map((row) => (row.key === key ? { ...row, [name]: value } : row)));
    };

    // Urutan baris disimpan dari posisinya di array (kolom `urutan` di BE).
    const handleDrop = (setRows, targetKey) => {
        const dragged = dragKey;
        setDragKey(null);
        if (!dragged || dragged === targetKey) return;

        setRows((prev) => {
            const from = prev.findIndex((row) => row.key === dragged);
            const to = prev.findIndex((row) => row.key === targetKey);
            if (from < 0 || to < 0) return prev;
            const next = [...prev];
            next.splice(to, 0, ...next.splice(from, 1));
            return next;
        });
    };

    const dragProps = (setRows, key) => ({
        draggable: canEdit,
        onDragStart: () => setDragKey(key),
        onDragEnd: () => setDragKey(null),
        onDragOver: (e) => e.preventDefault(),
        onDrop: () => handleDrop(setRows, key),
    });

    const toggleOverride = (key) => {
        setPerhiasan((prev) => prev.map((row) => {
            if (row.key !== key) return row;
            if (row.is_override) return { ...row, is_override: false };
            // Saat override dibuka, isi kotaknya dengan nilai turunan saat ini.
            const { kadar, lb_jual } = derivePerhiasan(row);
            return { ...row, is_override: true, kadar, lb_jual };
        }));
    };

    const removeRow = async (setRows, key, label) => {
        const { confirmed } = await showAlert({
            icon: "warning",
            title: "Hapus Baris",
            isAutoClose: false,
            message: `Anda yakin ingin menghapus baris ${label} ?`,
            confirmText: "Ya",
            cancelText: "Tidak",
        });
        if (!confirmed) return;
        setRows((prev) => prev.filter((row) => row.key !== key));
    };

    const addPerhiasan = () => setPerhiasan((prev) => [...prev, { key: newKey(), id: null, karat: '', kadar: '', lb_jual: '', lb_beli: '', berat: 1 }]);
    const addLogamMulia = () => setLogamMulia((prev) => [...prev, { key: newKey(), id: null, berat: '' }]);

    const handleSubmit = async () => {
        if (!perhiasan.length && !logamMulia.length) {
            showAlert({ icon: 'error', title: 'Gagal', message: 'Minimal satu baris harga harus diisi' });
            return;
        }

        const invalidPerhiasan = perhiasan.some((row) => !String(row.karat).trim() || row.lb_beli === '');
        const invalidLogam = logamMulia.some((row) => !String(row.berat).trim() || toNumber(row.berat) <= 0);
        if (invalidPerhiasan || invalidLogam) {
            showAlert({
                icon: 'error',
                title: 'Gagal',
                message: invalidLogam
                    ? 'Berat logam mulia wajib diisi dan lebih dari 0. Cek tab Logam Mulia.'
                    : 'Lengkapi Karat dan LB Beli pada tabel perhiasan. Cek juga tab lainnya.',
            });
            return;
        }

        setLoading(true);
        try {
            await HargaSettingApis.PostBulkHarga({
                harga_dasar_jual: dasarJual,
                harga_dasar_beli: dasarBeli,
                harga_dasar_jual_lm: dasarJualLm,
                harga_dasar_beli_lm: dasarBeliLm,
                // Kirim hasil derive, bukan teks di input — nilai tampilan sudah
                // dibulatkan dan akan membuat harga meleset dari acuan Excel.
                perhiasan: perhiasan.map((row) => {
                    const { kadar, lb_jual } = derivePerhiasan(row);
                    return {
                        id: row.id,
                        karat: toNumber(row.karat),
                        kadar,
                        lb_jual,
                        lb_beli: toNumber(row.lb_beli),
                        berat: toNumber(row.berat) || 1,
                        is_active: true,
                    };
                }),
                // Harga logam mulia turunan dari harga dasar beli — BE yang hitung.
                logam_mulia: logamMulia.map((row) => ({
                    id: row.id,
                    berat: toNumber(row.berat),
                    is_active: true,
                })),
            });
            showAlert({ icon: 'success', isAutoClose: true, title: 'Berhasil', message: 'Harga berhasil disimpan' });
            fetchData();
        } catch (error) {
            console.error(error);
            showAlert({ icon: 'error', title: 'Gagal', message: 'Gagal menyimpan harga' });
        } finally {
            setLoading(false);
        }
    };

    const input = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 disabled:bg-gray-50 disabled:text-gray-400 transition";
    const th = "px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-neutral-500";
    const money = "px-4 py-3 text-sm text-right font-semibold text-neutral-900 tabular-nums";

    const isJual = activeTab.startsWith('jual');
    const isPerhiasanTab = activeTab.endsWith('perhiasan');
    const activeTone = isJual
        ? { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500' }
        : { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500' };

    const AddButton = ({ onClick, label }) => canEdit && (
        <button type="button" onClick={onClick}
            className="flex items-center gap-1.5 self-start mt-3 px-3 py-2 text-sm text-primary-600 font-medium rounded-lg border border-dashed border-primary-300 hover:bg-primary-50 transition cursor-pointer">
            <PlusIcon size={16} /> {label}
        </button>
    );

    const DeleteCell = ({ onClick }) => canEdit && (
        <td className="px-4 py-3 w-14">
            <button type="button" title="Hapus baris" onClick={onClick}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer">
                <TrashIcon size={18} />
            </button>
        </td>
    );

    return (
        <div className="flex flex-col gap-5 w-full">
            <HeaderSection
                title="Setting Harga"
                description="Kelola harga jual & beli perhiasan dan logam mulia yang tampil di halaman display."
            />

            <div className="flex flex-wrap gap-2 border-b border-gray-200">
                {TABS.map((tab) => {
                    const active = activeTab === tab.id;
                    const activeBorder = tab.tone === 'jual' ? 'border-emerald-500' : 'border-rose-500';
                    return (
                        <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition cursor-pointer ${
                                active
                                    ? `${activeBorder} text-neutral-900`
                                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${tab.tone === 'jual' ? 'bg-emerald-500' : 'bg-rose-500'} ${active ? '' : 'opacity-40'}`} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-5 border border-gray-200 rounded-xl p-5 bg-white">
                {isPerhiasanTab && (
                    <>
                        <div className={`flex flex-col gap-2 p-4 rounded-xl border ${activeTone.border} ${activeTone.bg}`}>
                            <div className="flex items-center gap-2">
                                {isJual ? <TrendUpIcon size={18} className={activeTone.text} /> : <TrendDownIcon size={18} className={activeTone.text} />}
                                <span className={`text-xs font-semibold uppercase tracking-wide ${activeTone.text}`}>
                                    {isJual ? 'Harga Dasar Jual (per gram)' : 'Harga Dasar Beli (per gram)'}
                                </span>
                            </div>
                            <input
                                type="text"
                                inputMode="numeric"
                                disabled={!canEdit}
                                className={`${input} text-lg font-bold tabular-nums`}
                                value={HelperFunctions.formatNumberInput(isJual ? dasar.harga_dasar_jual : dasar.harga_dasar_beli)}
                                onChange={(e) => setDasar((prev) => ({
                                    ...prev,
                                    [isJual ? 'harga_dasar_jual' : 'harga_dasar_beli']: HelperFunctions.unformatNumberInput(e.target.value),
                                }))}
                            />
                            <span className="text-[11px] text-neutral-500">
                                Harga {isJual ? 'jual' : 'beli'} tiap karat dihitung otomatis: LB {isJual ? 'Jual' : 'Beli'} × harga dasar × berat.
                            </span>
                        </div>

                        <div className="overflow-x-auto border border-gray-100 rounded-lg">
                            <table className="w-full min-w-[680px]">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className={th}>Karat</th>
                                        <th className={th}>Kadar</th>
                                        <th className={th}>{isJual ? 'LB Jual' : 'LB Beli'}</th>
                                        <th className={th}>Berat</th>
                                        <th className={`${th} text-right`}>{isJual ? 'Harga Jual' : 'Harga Beli'}</th>
                                        {canEdit && isJual && <th className={th} />}
                                        {canEdit && <th className={th} />}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {perhiasanPreview.map((row) => (
                                        <tr key={row.key} {...dragProps(setPerhiasan, row.key)}
                                            className={`hover:bg-gray-50/60 transition ${dragKey === row.key ? 'opacity-40' : ''}`}>
                                            <td className="px-4 py-3 w-36">
                                                <div className="flex items-center gap-2">
                                                    {canEdit && <DotsSixVerticalIcon size={18} className="text-gray-300 cursor-grab shrink-0" />}
                                                    <input type="text" inputMode="decimal" disabled={!canEdit} className={input}
                                                        value={row.karat ?? ''}
                                                        onChange={(e) => updateRow(setPerhiasan, row.key, 'karat', e.target.value)} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 w-32">
                                                {isJual && !row.is_override ? (
                                                    <span className="block px-3 py-2 text-sm text-neutral-500 tabular-nums" title={row.kadarValue}>
                                                        {displayDecimal(row.kadarValue, 3)}
                                                    </span>
                                                ) : (
                                                    <input type="text" inputMode="decimal" disabled={!canEdit || !isJual} className={input}
                                                        value={isJual ? (row.kadar ?? '') : displayDecimal(row.kadarValue, 3)}
                                                        onChange={(e) => updateRow(setPerhiasan, row.key, 'kadar', e.target.value)} />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 w-36">
                                                {isJual && !row.is_override ? (
                                                    <span className="block px-3 py-2 text-sm text-neutral-500 tabular-nums" title={row.lbJualValue}>
                                                        {displayDecimal(row.lbJualValue)}
                                                    </span>
                                                ) : (
                                                    <input type="text" inputMode="decimal" disabled={!canEdit} className={input}
                                                        value={(isJual ? row.lb_jual : row.lb_beli) ?? ''}
                                                        onChange={(e) => updateRow(setPerhiasan, row.key, isJual ? 'lb_jual' : 'lb_beli', e.target.value)} />
                                                )}
                                            </td>
                                            <td className="px-4 py-3 w-24">
                                                <input type="text" inputMode="decimal" disabled={!canEdit} className={input}
                                                    value={row.berat ?? ''}
                                                    onChange={(e) => updateRow(setPerhiasan, row.key, 'berat', e.target.value)} />
                                            </td>
                                            <td className={money}>{HelperFunctions.formatCurrency(isJual ? row.harga_jual : row.harga_beli)}</td>
                                            {canEdit && isJual && (
                                                <td className="px-2 py-3 w-12">
                                                    <button type="button" onClick={() => toggleOverride(row.key)}
                                                        title={row.is_override ? 'Kembalikan ke rumus otomatis' : 'Isi kadar & LB manual'}
                                                        className={`p-1.5 rounded-lg transition cursor-pointer ${row.is_override ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-neutral-700 hover:bg-gray-100'}`}>
                                                        <PencilSimpleIcon size={18} />
                                                    </button>
                                                </td>
                                            )}
                                            <DeleteCell onClick={() => removeRow(setPerhiasan, row.key, `karat ${row.karat || '-'}`)} />
                                        </tr>
                                    ))}
                                    {!perhiasanPreview.length && <EmptyRow cols={5 + (canEdit ? 1 : 0) + (canEdit && isJual ? 1 : 0)} text="Belum ada baris harga perhiasan" />}
                                </tbody>
                            </table>
                        </div>
                        <AddButton onClick={addPerhiasan} label="Tambah Karat" />
                        <p className="text-[11px] text-neutral-400">
                            {isJual
                                ? 'Kadar (karat ÷ 24) dan LB Jual (kadar + 0,12) dihitung otomatis dengan presisi penuh — cukup isi Karat. Klik ikon pensil untuk mengisinya manual, misal baris 24K.'
                                : 'LB Beli diinput manual per karat — tidak dihitung dari kadar.'}
                            {' '}Baris karat dipakai bersama tab Jual & Beli Perhiasan.
                            {canEdit && ' Tarik baris untuk mengubah urutan tampil.'}
                        </p>
                    </>
                )}

                {!isPerhiasanTab && (
                    <>
                        <div className={`flex flex-col gap-2 p-4 rounded-xl border ${activeTone.border} ${activeTone.bg}`}>
                            <div className="flex items-center gap-2">
                                {isJual ? <TrendUpIcon size={18} className={activeTone.text} /> : <TrendDownIcon size={18} className={activeTone.text} />}
                                <span className={`text-xs font-semibold uppercase tracking-wide ${activeTone.text}`}>
                                    {isJual ? 'Harga Dasar Jual LM (per gram)' : 'Harga Dasar Beli LM (per gram)'}
                                </span>
                            </div>
                            <input
                                type="text"
                                inputMode="numeric"
                                disabled={!canEdit}
                                className={`${input} text-lg font-bold tabular-nums`}
                                value={HelperFunctions.formatNumberInput(isJual ? dasar.harga_dasar_jual_lm : dasar.harga_dasar_beli_lm)}
                                onChange={(e) => setDasar((prev) => ({
                                    ...prev,
                                    [isJual ? 'harga_dasar_jual_lm' : 'harga_dasar_beli_lm']: HelperFunctions.unformatNumberInput(e.target.value),
                                }))}
                            />
                            <span className="text-[11px] text-neutral-500">
                                {isJual
                                    ? `Harga dasar = harga dasar jual LM × berat, lalu harga jual = harga dasar + ${MARGIN_JUAL_LM * 100}%.`
                                    : 'Harga beli = harga dasar beli LM × berat.'}
                                {' '}Terpisah dari harga perhiasan.
                            </span>
                        </div>

                        <div className="overflow-x-auto border border-gray-100 rounded-lg">
                            <table className="w-full min-w-[560px]">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className={th}>Berat (gram)</th>
                                        {isJual && <th className={`${th} text-right`}>Harga Dasar</th>}
                                        <th className={`${th} text-right`}>{isJual ? 'Harga Jual' : 'Harga Beli'}</th>
                                        {canEdit && <th className={th} />}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {logamMuliaPreview.map((row) => (
                                        <tr key={row.key} {...dragProps(setLogamMulia, row.key)}
                                            className={`hover:bg-gray-50/60 transition ${dragKey === row.key ? 'opacity-40' : ''}`}>
                                            <td className="px-4 py-3 w-48">
                                                <div className="flex items-center gap-2">
                                                    {canEdit && <DotsSixVerticalIcon size={18} className="text-gray-300 cursor-grab shrink-0" />}
                                                    <input type="text" inputMode="decimal" disabled={!canEdit} className={input}
                                                        value={row.berat ?? ''}
                                                        onChange={(e) => updateRow(setLogamMulia, row.key, 'berat', e.target.value)} />
                                                </div>
                                            </td>
                                            {isJual && (
                                                <td className={`${money} font-medium text-neutral-500`}>
                                                    {HelperFunctions.formatCurrency(row.harga_dasar)}
                                                </td>
                                            )}
                                            <td className={money}>
                                                {HelperFunctions.formatCurrency(isJual ? row.harga_jual : row.harga_buyback)}
                                            </td>
                                            <DeleteCell onClick={() => removeRow(setLogamMulia, row.key, `${row.berat || '-'} gram`)} />
                                        </tr>
                                    ))}
                                    {!logamMuliaPreview.length && <EmptyRow cols={2 + (isJual ? 1 : 0) + (canEdit ? 1 : 0)} text="Belum ada baris berat logam mulia" />}
                                </tbody>
                            </table>
                        </div>
                        <AddButton onClick={addLogamMulia} label="Tambah Berat" />
                        <p className="text-[11px] text-neutral-400">
                            Cukup isi beratnya — harga dihitung otomatis dari harga dasar LM di atas. Daftar berat dipakai bersama tab Jual & Beli Logam Mulia.
                            {canEdit && ' Tarik baris untuk mengubah urutan tampil.'}
                        </p>
                    </>
                )}
            </div>

            {canEdit && (
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <span className="text-xs text-neutral-500">Simpan berlaku untuk seluruh tab sekaligus.</span>
                    <button type="button" onClick={handleSubmit}
                        className="flex items-center gap-x-2 justify-center px-5 py-2.5 btn-primary rounded-lg hover:bg-[#FDE6D4] transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f3810d]/50">
                        <FloppyDiskIcon size={20} /> Simpan Semua
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingHarga;
