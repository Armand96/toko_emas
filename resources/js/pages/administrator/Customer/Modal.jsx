import ModalCustom from "../../../components/modalCustom";
import InputGroup from "../../../components/FormElement/InputGroup";

export default function ModalCustomer({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onChange,
    formError,
    isView,
}) {
    const isEdit = !!formData?.id;

    const fieldsModal = [
        {
            label: "Nama Customer",
            name: "customer_name",
            type: "text",
            placeholder: "Masukkan nama lengkap",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "No HP",
            name: "phone_number",
            type: "text",
            placeholder: "Contoh: 08xxxxxxxxxxxx",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Alamat",
            name: "address",
            type: "text",
            placeholder: "Masukkan alamat",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Status",
            name: "is_active",
            type: "checkbox",
            isDisable: isView,
        }
    ];

    const disableButton = () => {
        if (isView) return true;
        const required = ['customer_name', 'phone_number', 'address'];
        const hasEmpty = required.some(f => !formData?.[f]);
        if (hasEmpty) return true;
        return formError && Object.values(formError).some(e => e);
    };

    return (
        <ModalCustom
            title={isView ? "Detail Customer" : isEdit ? "Edit Customer" : "Tambah Customer"}
            confirmTextButton={isView ? "Tutup" : isEdit ? "Simpan Perubahan" : "Tambah"}
            cancelTextButton={isView ? "Tutup" : "Batal"}
            handleOnSubmit={() => onSubmit(formData)}
            isOpen={isOpen}
            onClose={onClose}
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
            </div>
        </ModalCustom>
    );
}
