import React from "react";
import { Clock } from "@phosphor-icons/react";
import ModalCustom from "../../components/modalCustom"; // Sesuaikan path dengan lokasi ModalCustom Anda
import HelperFunctions from "../../utils/HelperFunctions"; // Sesuaikan path jika menggunakan helper format rupiah

const ModalViewPenjualan = ({ isOpen, onClose, data }) => {
    // Jika data kosong/belum di-load, kembalikan null agar tidak error
    if (!data) return null;

    // Destructuring data untuk mempermudah pemanggilan
    const { customer, cart, payment, meta, approval } = data;

    return (
        <ModalCustom
            title="Detail Penjualan"
            isOpen={isOpen}
            onClose={onClose}
            footer={false} // Menghilangkan tombol action di bawah sesuai gambar
        >
            <div className="flex flex-col gap-6 py-2 px-1">

                {/* --- SECTION 1: DATA CUSTOMER --- */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
                            <h3 className="text-sm font-semibold text-gray-800">Data Customer</h3>
                        </div>
                        <span className="px-3 py-1 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 rounded-md">
                            {customer.type}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">ID Customer</span>
                            <span className="text-sm font-medium text-gray-800">{customer.id || '-'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">Nama Customer</span>
                            <span className="text-sm font-medium text-gray-800">{customer.nama}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">No. Handphone</span>
                            <span className="text-sm font-medium text-gray-800">{customer.hp}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500">Alamat</span>
                            <span className="text-sm font-medium text-gray-800 leading-snug">{customer.alamat}</span>
                        </div>
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* --- SECTION 2: KERANJANG PENJUALAN --- */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
                            <h3 className="text-sm font-semibold text-gray-800">Keranjang Penjualan</h3>
                        </div>
                        <span className="px-3 py-1 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 rounded-md">
                            {cart.length} item
                        </span>
                    </div>

                    <div className="flex flex-col gap-3">
                        {cart.map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="px-3 py-1 bg-gray-50 rounded text-xs font-medium text-gray-500 border border-gray-200">
                                        {item.id}
                                    </div>
                                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-md object-cover border border-gray-200" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                                        <span className="text-xs text-gray-500 mt-0.5">{item.specs}</span>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-gray-800">{HelperFunctions.formatCurrency(item.price)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <hr className="border-gray-100" />

                {/* --- SECTION 3: PEMBAYARAN --- */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
                            <h3 className="text-sm font-semibold text-gray-800">Pembayaran</h3>
                        </div>
                        <span className="px-3 py-1 bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 rounded-md">
                            {payment.method}
                        </span>
                    </div>

                    <div className="flex flex-col">
                        <div className="flex justify-between py-2 border-b border-dashed border-gray-200">
                            <span className="text-sm text-gray-500">Sub Total</span>
                            <span className="text-sm font-medium text-gray-800">{HelperFunctions.formatCurrency(payment.subTotal)}</span>
                        </div>
                        <div className="flex justify-between py-3">
                            <span className="text-sm font-bold text-gray-800">Total</span>
                            <span className="text-sm font-bold text-gray-900">{HelperFunctions.formatCurrency(payment.total)}</span>
                        </div>
                    </div>

                    {/* KONDISI JIKA TRANSFER */}
                    {payment.method.toLowerCase() === 'transfer' && (
                        <div className="flex flex-col p-4 border border-gray-200 rounded-lg bg-gray-50/50 gap-4 mt-2">
                            <div className="flex items-center gap-3">
                                {/* Logo Tiruan Bank */}
                                <div className={`w-12 h-12 rounded-md flex items-center justify-center text-white font-extrabold italic text-sm shadow-sm flex-shrink-0 ${payment.bank === 'BCA' ? 'bg-[#005EAA]' : 'bg-[#F05A28]'}`}>
                                    {payment.bank}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">{payment.rekeningName}</span>
                                    <span className="text-xs font-medium text-gray-500 mt-0.5">{payment.rekeningNumber} • {payment.bank}</span>
                                </div>
                            </div>
                            <div className="text-xs text-gray-600 border-t border-dashed border-gray-200 pt-3">
                                Pengirim: <span className="font-bold text-gray-800 uppercase">{payment.pengirim}</span>
                            </div>
                        </div>
                    )}

                    {/* KONDISI JIKA TUNAI */}
                    {payment.method.toLowerCase() === 'tunai' && (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-gray-500">Uang Dibayar</span>
                                <span className="text-sm font-medium text-gray-800">{HelperFunctions.formatCurrency(payment.uangDibayar)}</span>
                            </div>
                            <div className="flex flex-col gap-1 text-right">
                                <span className="text-xs text-gray-500">Kembalian</span>
                                <span className="text-sm font-medium text-gray-800">{HelperFunctions.formatCurrency(payment.kembalian)}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* --- SECTION 4: METADATA TRANSAKSI --- */}
                <div className="flex items-center justify-between p-3 mt-2 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500">Order ID</span>
                        <span className="text-xs font-semibold text-gray-800">{meta.orderId}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-gray-500">Diajukan oleh</span>
                        <span className="text-xs font-semibold text-gray-800">{meta.diajukanOleh}</span>
                    </div>
                    <div className="w-px h-8 bg-gray-200"></div>
                    <div className="flex flex-col gap-1 text-right">
                        <span className="text-[11px] text-gray-500">Tanggal</span>
                        <span className="text-xs font-semibold text-gray-800">{meta.tanggal}</span>
                    </div>
                </div>

                {/* --- SECTION 5: APPROVAL --- */}
                <div className="flex flex-col gap-3 mt-2">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary-500 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-gray-800">Approval</h3>
                    </div>
                    <div className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg bg-white">
                        {approval.status === 'Menunggu Approval' ? (
                            <Clock size={20} weight="fill" className="text-warning-500" />
                        ) : (
                            <div className="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center text-white text-xs">✓</div>
                        )}
                        <p className="text-xs text-gray-800">
                            <span className="font-bold">{approval.status}</span> oleh <span className="text-info-500 font-medium">{approval.role}</span> • <span className="text-gray-500">{approval.tanggal}</span>
                        </p>
                    </div>
                </div>

            </div>
        </ModalCustom>
    );
};

export default ModalViewPenjualan;
