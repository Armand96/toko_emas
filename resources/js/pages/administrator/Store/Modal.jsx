import ModalCustom from "../../../components/modalCustom";
import InputGroup from "../../../components/FormElement/InputGroup";

export default function Modal({
    isOpen,
    onClose,
    onSubmit,
    mode,
    formData,
    onChange,
    formError
}) {
    const fieldsModal = [
        {
            label: "Logo Toko",
            name: "logo",
            type: "photoInput",
            placeholder: "Upload",
            helperText: "Logo Anda berukuran min. 512 x 512 piksel, kurang dari 2 MB, dan berformat JPG, JPEG, atau PNG",
            isRequired: true,
        },
        {
            label: "Nama Toko",
            name: "nama_toko",
            type: "text",
            placeholder: "Masukkan nama toko",
            isRequired: true,
            colSpan: "2"
        },
        {
            label: "Website",
            name: "website",
            type: "text",
            placeholder: "Masukkan url website",
            isRequired: true,
        },
        {
            label: "Email",
            name: "email",
            type: "email",
            placeholder: "Masukkan email toko",
            isRequired: true,
        },
    ];

    const disableButton = () => {
        if (!formData?.nama_toko || !formData?.website || !formData?.email) {
            return true;
        }
        if (formError && Object.values(formError).some((error) => error)) {
            return true;
        }
        return false;
    };

    return (
        <ModalCustom
            title={mode === 'edit' ? "Edit Toko" : "Tambah Setting Toko"}
            confirmTextButton="Simpan"
            cancelTextButton="Batal"
            handleOnSubmit={() => onSubmit(formData)}
            isOpen={isOpen}
            onClose={onClose}
            footer={true}
            disabledConfirmBtn={disableButton()}
        >
            <div className="flex flex-col py-2">
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
