import { useEffect, useState } from "react";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react";
import ModalCustom from "../../../components/modalCustom";
import InputGroup from "../../../components/FormElement/InputGroup";
import HelperFunctions from "../../../utils/HelperFunctions";
import OptionsStore from "../../../Store/OptionsStore";

export default function Modal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onChange,
    formError,
    isView,
}) {
    const ensureUsers = OptionsStore((s) => s.ensureUsers);
    const [userOptions, setUserOptions] = useState([]);

    useEffect(() => {
        ensureUsers()
            .then((data) => setUserOptions(HelperFunctions.formatDropdown(data, "id", "name")));
    }, []);

    // No telepon disimpan sebagai string dipisah koma di formData.phone_numbers
    // (sesuai kolom BE), tapi di UI ditampilkan sebagai beberapa input. Minimal satu baris tampil.
    const phoneList = (() => {
        const raw = formData?.phone_numbers ?? "";
        const parts = String(raw).split(",").map((p) => p.trim());
        return parts.length > 0 ? parts : [""];
    })();

    const emitPhones = (list) => {
        const value = list.join(",");
        onChange({ target: { name: "phone_numbers", value } });
    };

    const handlePhoneChange = (index, value) => {
        const next = [...phoneList];
        next[index] = value;
        emitPhones(next);
    };

    const handleAddPhone = () => {
        emitPhones([...phoneList, ""]);
    };

    const handleRemovePhone = (index) => {
        const next = phoneList.filter((_, i) => i !== index);
        emitPhones(next.length > 0 ? next : [""]);
    };

    const fieldsModal = [
        {
            label: "Kode Cabang",
            name: "branch_code",
            type: "text",
            placeholder: "Masukkan kode cabang",
            isRequired: !isView,
            isDisable: isView || formData?.id,
        },
        {
            label: "Nama Cabang",
            name: "branch_name",
            type: "text",
            placeholder: "Masukkan nama cabang",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "PIC",
            name: "pic",
            type: "dropdown",
            placeholder: "Pilih PIC",
            options: userOptions,
            isDisable: isView,
        },
        {
            label: "Tanggal Buka Cabang",
            name: "branch_open_date",
            type: "date",
            placeholder: "Masukkan tanggal buka cabang",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Lokasi Cabang",
            name: "lokasi_cabang",
            type: "text",
            placeholder: "Masukkan lokasi cabang",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Alamat",
            name: "address",
            type: "text",
            placeholder: "Masukkan alamat lengkap cabang",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Status Cabang",
            name: "is_active",
            type: "checkbox",
            isRequired: false,
            isDisable: isView,
        },
    ];

    const disableButton = () => {
        if (isView) return true;
        if (
            !formData?.branch_code ||
            !formData?.branch_name ||
            !formData?.lokasi_cabang ||
            !formData?.address ||
            // !formData?.pic ||
            !formData?.open_date
        ) {
            return true;
        }
        if (formError && Object.values(formError).some((error) => error)) {
            return true;
        }
        return false;
    };

    console.log(formError)

    return (
        <ModalCustom
            title={
                isView
                    ? "Detail Informasi Cabang"
                    : formData?.id
                        ? "Edit Informasi Cabang"
                        : "Tambah Cabang Baru"
            }
            confirmTextButton="Simpan Perubahan"
            cancelTextButton={isView ? "Tutup" : "Batal"}
            handleOnSubmit={() => onSubmit(formData)}
            isOpen={isOpen}
            onClose={() => onClose("close-add")}
            footer={!isView}
            disabledConfirmBtn={disableButton()}
        >
            <div className="flex flex-col gap-4 py-2">
                <InputGroup
                    cols="2"
                    fields={fieldsModal}
                    formData={formData}
                    onChange={onChange}
                    formError={formError}
                />

                {/* No Telepon — bisa lebih dari satu */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="flex items-center gap-1 text-sm font-medium text-gray-900">
                        No Telepon
                    </label>
                    <div className="flex flex-col gap-2">
                        {phoneList.map((phone, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => handlePhoneChange(index, e.target.value)}
                                    disabled={isView}
                                    placeholder="Contoh: 08xxxxxxxxxxxx"
                                    className={`flex-1 px-3 py-2 text-sm border rounded-lg outline-none transition-all duration-200 ${isView
                                        ? "!bg-[#F3F4F6] border-[#E2E8F0] text-[#45556C] cursor-not-allowed"
                                        : "bg-white border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-neutral-black"
                                        }`}
                                />
                                {!isView && phoneList.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePhone(index)}
                                        title="Hapus nomor"
                                        className="p-2 btn-outline !text-danger-500 !border-danger-200 hover:bg-danger-50 rounded-lg shrink-0"
                                    >
                                        <TrashIcon size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {!isView && (
                        <button
                            type="button"
                            onClick={handleAddPhone}
                            className="mt-1 flex items-center gap-1 self-start text-sm font-medium text-primary-600 hover:text-primary-700"
                        >
                            <PlusIcon size={16} weight="bold" /> Tambah Nomor
                        </button>
                    )}
                </div>
            </div>
        </ModalCustom>
    );
}
