import { useState } from "react";
import ModalCustom from "../../../components/modalCustom";
import InputGroup from "../../../components/FormElement/InputGroup";

export default function ModalUser({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onChange,
    formError,
    isView,
    branchOptions = [],
    roleOptions = [],
}) {
    const isEdit = !!formData?.id;

    const fieldsModal = [
        {
            label: "Nama Lengkap",
            name: "name",
            type: "text",
            placeholder: "Masukkan nama lengkap",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Username",
            name: "username",
            type: "text",
            placeholder: "Masukkan username",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "No HP Aktif",
            name: "phone",
            type: "text",
            placeholder: "Contoh: 08xxxxxxxxxxxx",
            isRequired: false,
            isDisable: isView,
        },
        {
            label: "Email",
            name: "email",
            type: "text",
            placeholder: "Masukkan email",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Cabang/Penempatan",
            name: "branch_id",
            type: "dropdown",
            placeholder: "Pilih cabang",
            options: branchOptions,
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Role",
            name: "role_id",
            type: "dropdown",
            placeholder: "Pilih role",
            options: roleOptions,
            isRequired: !isView,
            isDisable: isView,
        },
        ...(!isView
            ? [
                {
                    label: "Password",
                    name: "password",
                    type: "password",
                    placeholder: isEdit ? "Kosongkan jika tidak diubah" : "Buat password baru",
                    isRequired: !isEdit,
                    isDisable: false,
                    hint: isEdit
                        ? "Isi hanya jika ingin mengganti password"
                        : "8 karakter · Huruf kapital · Huruf kecil · Angka",
                },
            ]
            : []),
        {
            label: "Status",
            name: "is_active",
            type: "toggle",          // pakai toggle/radio sesuai komponen yang ada di proyekmu
            isRequired: !isView,
            isDisable: isView,
            options: [
                { value: true, label: "Active" },
                { value: false, label: "Inactive" },
            ],
        },
    ];

    const disableButton = () => {
        if (isView) return true;
        const required = ['name', 'username', 'email', 'branch_id', 'role_id'];
        if (!isEdit) required.push('password');
        const hasEmpty = required.some(f => !formData?.[f]);
        if (hasEmpty) return true;
        return formError && Object.values(formError).some(e => e);
    };

    return (
        <ModalCustom
            title={isView ? "Detail User" : isEdit ? "Edit User" : "Tambah User"}
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
