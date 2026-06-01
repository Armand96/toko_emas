import { useState } from "react";
import { CaretLeftIcon, FloppyDiskIcon } from "@phosphor-icons/react";
import InputGroup from "../../../components/FormElement/InputGroup";
import { showAlert } from "../../../utils/showAlert";

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

    const [formError, setFormError] = useState({});

    const fields = [
        { name: 'tanggal', label: 'Tanggal', type: 'date', isRequired: true },
        { name: 'batch', label: 'Batch', type: 'text', isRequired: true },
        { name: 'kode', label: 'Kode', type: 'text', isRequired: true },
        { name: 'produk', label: 'Produk', type: 'text', isRequired: true },
        { name: 'kategori', label: 'Kategori', type: 'dropdown', options: [], isRequired: true },
        { name: 'sub_kategori', label: 'Sub Kategori', type: 'dropdown', options: [] },
        { name: 'cabang', label: 'Cabang', type: 'dropdown', options: [], isRequired: true },
        { name: 'deskripsi', label: 'Deskripsi', type: 'text' },
        { name: 'is_active', label: 'Status', type: 'switch' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formError[name]) {
            setFormError(prev => ({ ...prev, [name]: "" }));
        }
    };

    const handleSubmit = () => {
        const newErrors = {};
        if (!formData.tanggal) newErrors.tanggal = "Tanggal wajib diisi";
        if (!formData.batch) newErrors.batch = "Batch wajib diisi";
        if (!formData.kode) newErrors.kode = "Kode wajib diisi";
        if (!formData.produk) newErrors.produk = "Produk wajib diisi";
        if (!formData.kategori) newErrors.kategori = "Kategori wajib diisi";
        if (!formData.cabang) newErrors.cabang = "Cabang wajib diisi";

        if (Object.keys(newErrors).length > 0) {
            setFormError(newErrors);
            showAlert('error', 'Gagal', 'Lengkapi data yang wajib diisi');
            return;
        }

        console.log(formData);
        showAlert('success', 'Berhasil', 'Data pembelian berhasil disimpan');
        setCurentState('main');
    };

    return (
        <div>test</div>
    );
};

export default Form;
