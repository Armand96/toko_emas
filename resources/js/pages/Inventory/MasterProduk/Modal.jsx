import ModalCustom from "../../../components/modalCustom";
import InputGroup from "../../../components/FormElement/InputGroup";

export default function Modal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onChange,
    formError,
    isView,
}) {
    const fieldsModal = [
        {
            label: "Kode Produk",
            name: "kode_produk",
            type: "text",
            placeholder: "Masukkan kode produk",
            isRequired: !isView,
            isDisable: isView || formData?.id,
        },
        {
            label: "Nama Produk",
            name: "nama_produk",
            type: "text",
            placeholder: "Masukkan nama produk",
            isRequired: !isView,
            isDisable: isView,
        },
          {
            label: "Keterangan Produk",
            name: "keterangan_produk",
            type: "text",
            placeholder: "Masukkan keterangan produk",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            type: ""
        },
        {
            label: "Kategori",
            name: "kategori",
            type: "dropdown",
            placeholder: "Pilih kategori",
            options: [
                { value: "perhiasan", label: "Perhiasan" },
                { value: "logam_mulia", label: "Logam Mulia" }
            ],
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Sub Kategori",
            name: "sub_kategori",
            type: "dropdown",
            placeholder: "Pilih sub kategori",
            options: [
                { value: "cincin", label: "Cincin" },
                { value: "kalung", label: "Kalung" }
            ],
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Deskripsi",
            name: "deskripsi",
            type: "textArea",
            placeholder: "Masukkan deskripsi produk",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Cabang",
            name: "cabang",
            type: "dropdown",
            placeholder: "Pilih cabang",
            options: [
                { value: "pusat", label: "Promas Pusat" },
                { value: "bandung", label: "Promas Bandung" }
            ],
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Status Produk",
            name: "status",
            type: "checkbox",
            options: [{ value: "active", label: "Aktif" }],
            isRequired: false,
            isDisable: isView,
        },
    ];

    const disableButton = () => {
        if (isView) return true;
        if (
            !formData?.kode_produk ||
            !formData?.nama_produk ||
            !formData?.kategori ||
            !formData?.sub_kategori ||
            !formData?.cabang
        ) {
            return true;
        }
        if (formError && Object.values(formError).some((error) => error)) {
            return true;
        }
        return false;
    };

    return (
        <ModalCustom
            title={
                isView
                    ? "Detail Produk"
                    : formData?.id
                    ? "Edit Produk"
                    : "Tambah Produk"
            }
            confirmTextButton="Simpan Perubahan"
            cancelTextButton={isView ? "Tutup" : "Batal"}
            handleOnSubmit={() => onSubmit(formData)}
            isOpen={isOpen}
            onClose={() => onClose()}
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
