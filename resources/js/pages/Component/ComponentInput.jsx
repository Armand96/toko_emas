import { useState } from "react";
import InputGroup from "../../components/FormElement/InputGroup";

const ComponentInput = () => {
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    jewelryType: "",
    goldPurity: "24k",
    additionalServices: [],
    isMember: false,
    notes: "",
  });

  const [formError, setFormError] = useState({
    customerName: "",
    jewelryType: "",
  });

  const formFields = [
    {
      label: "Nama Pelanggan",
      name: "customerName",
      type: "text",
      placeholder: "Masukkan nama lengkap",
      isRequired: true,
    },
    {
      label: "Email",
      name: "customerEmail",
      type: "email",
      placeholder: "contoh@email.com",
      isRequired: false,
    },
    {
      label: "Jenis Perhiasan",
      name: "jewelryType",
      type: "dropdown",
      placeholder: "Pilih jenis perhiasan",
      isRequired: true,
      options: [
        { value: "cincin", label: "Cincin" },
        { value: "kalung", label: "Kalung" },
        { value: "gelang", label: "Gelang" },
        { value: "anting", label: "Anting" },
      ],
    },
    {
      label: "Kadar Emas",
      name: "goldPurity",
      type: "radio",
      isRequired: true,
      direction: "row",
      options: [
        { value: "24k", label: "24 Karat" },
        { value: "22k", label: "22 Karat" },
        { value: "18k", label: "18 Karat" },
      ],
    },
    {
      label: "Layanan Tambahan",
      name: "additionalServices",
      type: "checklist",
      isRequired: false,
      direction: "row",
      options: [
        { value: "cuci", label: "Cuci Emas" },
        { value: "chrome", label: "Chrome Ulang" },
        { value: "grafir", label: "Grafir Nama" },
      ],
    },
    {
      label: "Status Member Aktif",
      name: "isMember",
      type: "switch",
      isRequired: false,
    },
    {
      label: "Catatan Khusus",
      name: "notes",
      type: "textarea",
      placeholder: "Tambahkan catatan penyesuaian ukuran atau detail grafir di sini...",
      rows: 4,
      isRequired: false,
    },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (formError[name]) {
      setFormError((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let errors = {};
    if (!formData.customerName) errors.customerName = "Nama pelanggan wajib diisi";
    if (!formData.jewelryType) errors.jewelryType = "Silakan pilih jenis perhiasan";

    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      return;
    }

    console.log("Form Data Submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-neutral-bg-white-smk p-6 flex justify-center items-start">
      <div className="w-full max-w-4xl bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-neutral-black">Tambah Transaksi Baru</h1>
          <p className="text-sm text-gray-500 mt-1">Isi detail data pelanggan dan spesifikasi perhiasan emas</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <InputGroup
            fields={formFields}
            formData={formData}
            formError={formError}
            onChange={handleChange}
            cols={2}
            tabCols={1}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors duration-200 shadow-sm"
            >
              Simpan Transaksi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComponentInput;
