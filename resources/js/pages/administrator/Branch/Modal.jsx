import { useEffect, useState } from "react";
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
            isRequired: !isView,
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
            !formData?.address ||
            !formData?.pic ||
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
            </div>
        </ModalCustom>
    );
}
