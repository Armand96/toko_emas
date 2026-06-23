import ModalCustom from "../../../components/modalCustom";
import InputGroup from "../../../components/FormElement/InputGroup";

export default function Modal({ isOpen, onClose, onSubmit, formData, onChange, formError, isView, parentOptions }) {
    const fieldsModal = [
       {
            label: "Kode Bank",
            name: "bank_code",
            type: "text",
            placeholder: "Masukkan kode bank",
            isRequired: !isView,
            isDisable: isView
        },
        {
            label: "Nama Bank",
            name: "bank_name",
            type: "text",
            placeholder: "Masukkan nama bank",
            isRequired: !isView,
            isDisable: isView
        },
        {
            label: "Status",
            name: "is_active",
            type: "checkbox",
            isDisable: isView,
        },
    ];

    const disableButton = () => {
        if (isView) return true;
        if (!formData?.category_name) return true;
        return formError && Object.values(formError).some(error => error);
    };

    return (
        <ModalCustom title={isView ? "Detail Kategori" : formData?.id ? "Edit Kategori" : "Tambah Kategori"} confirmTextButton={isView ? "Tutup" : formData?.id ? "Simpan Perubahan" : "Tambah"} cancelTextButton={isView ? "Tutup" : "Batal"} handleOnSubmit={() => onSubmit(formData)} isOpen={isOpen} onClose={onClose} footer={!isView} disabledConfirmBtn={disableButton()}>
            <div className="flex flex-col gap-4 py-2">
                <InputGroup cols="1" fields={fieldsModal} formData={formData} onChange={onChange} formError={formError} />
            </div>
        </ModalCustom>
    );
}
