import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { PrinterIcon } from "@phosphor-icons/react";
import HelperFunctions from "../../utils/HelperFunctions";
import LogoKwintansi from "../../assets/images/logo_kwintansi.png";

// ============================================================
// FAKTUR JUAL & BELI
// Data diambil dari sessionStorage("print_kwitansi_data"),
// di-set saat approval penjualan.
// ============================================================

const PERHATIAN = [
    "Barang yang sudah kami jual, apabila dijual kembali ke toko kami, diterima sesuai harga pasar dan disertakan dengan faktur toko",
    "Upah pembuatan dan pajak penjualan tidak dihitung",
    "Barang telah sesuai, diperiksa dan disaksikan oleh customer. Kami tidak menerima komplain setelah barang keluar dari toko kami",
    "Kami tidak menerima barang dari hasil tindak kejahatan dan barang bermasalah/sengketa lainnya yang melawan hukum",
    "Dengan menerima faktur ini konsumen setuju dengan syarat dan ketentuan yang berlaku",
];

const PrintKwitansi = () => {
    const [data, setData] = useState(null);

    useEffect(() => {
        const raw = sessionStorage.getItem("print_kwitansi_data");
        if (!raw) return;
        try {
            setData(JSON.parse(raw));
        } catch (error) {
            console.error(error);
        }
    }, []);


    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
                <p className="text-sm text-gray-500">Tidak ada data faktur untuk dicetak.</p>
            </div>
        );
    }

    const { customer, user, details = [], branch, order_id, grand_total, created_at } = data;

    const tanggal = created_at ? dayjs(created_at) : dayjs();
    const kota = branch?.lokasi_cabang || branch?.branch_name || "-";

    console.log(data)

    const store = {
        tagline: "Jewellery design, Wedding Ring, Custom, Fashion, Jual Beli Emas",
        tagline2: "Perhiasan, LM ANTAM, Cukim, Leburan, Perak, Palladium",
        address: branch?.address || "Jl. Yos Sudarso",
        phone: "Wa : 0813 1829 0055 / 0852 1051 3501",
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center gap-4 print:bg-white print:p-0">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Text:ital@0;1&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=Poppins:wght@400;500;600;700;800&display=swap');
                @media print {
                    @page { size: A4 portrait; margin: 6mm; }
                    .fk-wm { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>

            {/* Toolbar (tidak ikut cetak) */}
            <div className="w-full max-w-[700px] flex justify-between items-center print:hidden">
                <div>
                    <h1 className="text-lg font-semibold text-gray-900">Cetak Faktur</h1>
                    <p className="text-sm text-gray-500">Order ID {order_id}</p>
                </div>
                <button
                    onClick={() => window.print()}
                    className="btn-primary py-2 px-4 rounded-lg flex items-center gap-2"
                >
                    <PrinterIcon size={20} /> Cetak
                </button>
            </div>

            {/* ===== LEMBAR FAKTUR ===== */}
            <div
                className="relative overflow-hidden w-[700px] max-w-full bg-white text-[#111] text-[11px] box-border px-[18px] py-4 print:w-full print:px-2"
                style={{ fontFamily: "'Open Sans', system-ui, -apple-system, 'Segoe UI', sans-serif" }}
            >
                {/* WATERMARK */}
                <div className="fk-wm pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 opacity-10">
                    <img src={LogoKwintansi} alt="watermark" className="w-[220px] h-auto" />
                </div>

                {/* HEADER */}
                <div className="relative z-10 flex justify-between items-start gap-2.5 pb-1">
                    <div className="flex gap-2.5 items-start">
                        <img src={LogoKwintansi} alt="logo" className="w-14 h-14 object-contain shrink-0" />
                        <div>
                            <div className="text-[16px] font-medium text-[#C75633] leading-[1.1]" style={{ fontFamily: "'Poppins', sans-serif" }}>Arrazaq Gold &amp; Jewellery</div>
                            <div className="text-[9px] italic text-[#444] leading-[1.3]">{store.tagline}</div>
                            <div className="text-[9px] italic text-[#444] leading-[1.3]">{store.tagline2}</div>
                            <div className="text-[9px] italic  text-[#000000] font-semibold leading-[1.3]">{store.address}</div>
                            <div className="text-[9px] italic text-[#000000] font-semibold mt-px">{store.phone}</div>
                        </div>
                    </div>

                    <div className="text-right text-[10px] leading-[1.9] min-w-[180px]">
                        <div>
                            <span className="font-semibold">{kota}</span>, <span className="inline-block border-b border-[#999] min-w-[60px]">{tanggal.format("DD")}</span>
                            {" / "}<span className="inline-block border-b border-[#999] min-w-[40px]">{tanggal.format("MM")}</span>
                            {" / "}<span className="inline-block border-b border-[#999] min-w-[50px]">{tanggal.format("YYYY")}</span>
                        </div>
                        <div>
                           <span className="font-semibold"> Kepada Yth,</span> <span className="inline-block pl-1 border-b border-[#999] text-left  min-w-[145px]">{customer?.customer_name ?? ""}</span>
                        </div>
                    </div>
                </div>

                {/* TITLE BAR */}
                <div className="relative z-10 flex justify-between items-end border-b-[1.5px] border-black pb-[3px] mt-1">
                    <span className="text-[14px] font-extrabold tracking-[0.3px]">FAKTUR JUAL &amp; BELI</span>
                    <span className="text-[11px]">No : <strong>{order_id ?? "-"}</strong></span>
                </div>

                {/* TABLE */}
                <table className="relative z-10 w-full border-collapse table-fixed mt-1.5">
                    <colgroup>
                        <col className="w-[70px]" />
                        <col />
                        <col className="w-[60px]" />
                        <col className="w-[70px]" />
                        <col className="w-[110px]" />
                    </colgroup>
                    <thead>
                        <tr>
                            <th className="border border-black  py-[5px] text-[10px] font-bold text-center">BANYAKNYA</th>
                            <th className="border border-black px-[7px] py-[5px] text-[10px] font-bold text-center">KETERANGAN BARANG</th>
                            <th className="border border-black px-[7px] py-[5px] text-[10px] font-bold text-center">KARAT</th>
                            <th className="border border-black px-[7px] py-[5px] text-[10px] font-bold text-center">BERAT</th>
                            <th className="border border-black px-[7px] py-[5px] text-[10px] font-bold text-center">HARGA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {details.map((item, i) => (
                            <tr key={i} >
                                <td className="border-x border-black px-[7px] py-[5px] text-[10px] text-center align-top">1</td>
                                <td className="border-x border-black px-[7px] py-[5px] text-[10px] text-left align-top break-words">
                                    {item.product?.product_name ?? "-"}
                                    {item.inventory_code ? ` (${item.inventory_code})` : ""}
                                </td>
                                <td className="border-x border-black px-[7px] py-[5px] text-[10px] text-center align-top">{item.inventory?.karat ? `${item.inventory.karat}K` : "-"}</td>
                                <td className="border-x border-black px-[7px] py-[5px] text-[10px] text-center align-top">{item.inventory?.berat ? `${item.inventory.berat}gr` : "-"}</td>
                                <td className="border-x border-black px-[7px] py-[5px] text-[10px] text-right align-top">{HelperFunctions.formatCurrency(item.price)}</td>
                            </tr>
                        ))}
                        {/* AREA KOSONG: tinggi dinamis berdasarkan jumlah item */}
                        {(() => {
                            const spacerH = Math.max(20, 70 - (details.length - 1) * 15);
                            return (
                                <tr>
                                    <td className="border-x border-b border-black" style={{ height: spacerH }} />
                                    <td className="border-x border-b border-black" style={{ height: spacerH }} />
                                    <td className="border-x border-b border-black" style={{ height: spacerH }} />
                                    <td className="border-x border-b border-black" style={{ height: spacerH }} />
                                    <td className="border-x border-b border-black" style={{ height: spacerH }} />
                                </tr>
                            );
                        })()}
                    </tbody>
                </table>

                {/* ── DI LUAR TABEL: PERHATIAN (kiri) + TOTAL & TTD (kanan) ── */}
                <div className="relative z-10 flex items-start gap-4">
                    {/* PERHATIAN */}
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-[9px] mb-[3px]">PERHATIAN :</div>
                        <ul className="m-0 pl-4 list-none">
                            {PERHATIAN.map((p, i) => (
                                <li
                                    key={i}
                                    className="relative text-[8px] text-[#28292B] leading-[1.4]  before:content-['-'] before:absolute before:-left-3"
                                >
                                    {p}
                                </li>
                            ))}
                        </ul>
                        <div className="text-[8.5px] italic font-bold mt-1">
                            Terimakasih Atas Kepercayaan Anda, Kepuasan Konsumen Adalah Prioritas Kami
                        </div>
                    </div>

                    {/* TOTAL + TTD */}
                    <div className="w-[180px] shrink-0">
                        <div className="flex border border-black -ml-[1px]" style={{ borderTop: "none"}}>
                            <span className="w-[70px] shrink-0 box-border px-2 py-1.5 border-r  border-black font-semibold text-[12px] italic text-center">Total</span>
                            <span className="flex-1 box-border px-2 py-1.5 text-right font-semibold text-[12px]">{HelperFunctions.formatCurrency(grand_total)}</span>
                        </div>
                        <div className="flex mt-1.5">
                            <div className="flex-1 text-center px-1">
                                <span className="block text-[9px]">Ttd Customer</span>
                                <span className="block text-[9px] mt-7">( {customer?.customer_name ?? "................"} )</span>
                            </div>
                            <div className="flex-1 text-center px-1">
                                <span className="block text-[9px]">Hormat Kami</span>
                                <span className="block text-[9px] mt-7">( {user?.name ?? "................"} )</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintKwitansi;
