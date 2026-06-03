import { useState } from "react";
import { CaretLeftIcon, FloppyDiskIcon, PlusCircleIcon, TrashIcon } from "@phosphor-icons/react";
import InputGroup from "../../../components/FormElement/InputGroup";
import { showAlert } from "../../../utils/showAlert";
import HeaderSection from "../../../components/HeaderSection";
import Dropdown from "../../../components/FormElement/SingleElement/Dropdown";
import Table from "../../../components/Table/Table";

const Form = ({ setCurentState }) => {
    const [formData, setFormData] = useState({
        tanggal: "",
        batch: "",
        kode: "",
        produk: "",
        kategori: null,
        sub_kategori: null,
        deskripsi: "",
        cabang: null,
        is_active: true
    });

    const [listData, setListData] = useState([]);

    const fieldAdd = [
        {
            label: "Produk",
            name: "produk",
            type: "dropdown",
        },
        {
            label: "Foto Item",
            name: "foto",
            helperText: "Foto berformat JPG, JPEG, atau PNG.",
            type: "photoInput",
        },
        {
            label: "Berat (gram)",
            name: "berat",
            type: "number",
        },
        {
            label: "Karat",
            name: "berat",
            type: "number",
        },
        {
            label: "No Seri (Opsional)",
            name: "berat",
            type: "number",
        },
        {
            label: "Cabang",
            name: "berat",
            type: "dropdown",
        },
        {
            label: "Bank Keluar",
            name: "bank_keluar",
            type: "dropdown",
        },
    ]

    const columns = [
        { header: 'Barcode', accessor: 'barcode' },
        { header: 'Produk', accessor: 'produk' },
        { header: 'Berat', accessor: 'Berat' },
        { header: 'Karat', accessor: 'karat' },
        { header: 'No Seri', accessor: 'no_seri' },
        { header: 'Modal', accessor: 'cabang' },
        { header: "Jual", accessor: "jual" },
       { header: "Cabang", accessor: "cabang" },
        { header: "Bank Keluar", accessor: "bank_keluar" },
        {header: 'Aksi', accessor: 'aksi', render: (row) => (
            <button className="btn-secondary p-2 rounded-lg flex items-center justify-center gap-2"><TrashIcon size={20} /></button>
        )}
    ]


    return (
        <div className="flex flex-col">
            <HeaderSection
                title="Tambah Pembelian"
                description="Lengkapi informasi pembelian dan detail item inventory."
            />

            <div className="flex justify-between mb-4 gap-x-2 ">
                <div className="flew flex-col p-6 w-2/5 bg-white rounded-lg">
                    <p className="text-lg font-medium text-gray-750">Item Baru</p>
                    <p className="text-sm text-gray-500">Isi detail, barcode auto-generated</p>

                    <div className="flex flex-col mt-6">
                        <InputGroup fields={fieldAdd} />
                    </div>
                    <button className="btn-primary mt-6 p-2 w-full rounded-lg flex items-center justify-center gap-2"><PlusCircleIcon size={20} /> Simpan</button>
                </div>
                <div className="w-3/5 flex flex-col p-6 bg-white rounded-lg">
                    <div className="flex w-full justify-between">
                        <div className="flex flex-col">
                            <p className="text-lg font-medium text-gray-750">Batch Pembelian (7 item)</p>
                            <p className="text-sm text-gray-500">Periksa item sebelum disimpan</p>
                        </div>
                        <button className="btn-primary p-2 rounded-lg flex items-center justify-center gap-2"><FloppyDiskIcon size={20} /> Simpan Batch</button>
                    </div>
                   <div className="mt-6">
                     <Table
                        columns={columns}
                        data={listData}
                        total={listData.length}
                        pagination={false}
                    />
                   </div>
                </div>
            </div>

        </div>
    );
};

export default Form;
