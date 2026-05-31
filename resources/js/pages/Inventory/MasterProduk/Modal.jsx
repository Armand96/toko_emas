import ModalCustom from "../../../components/modalCustom";
import InputGroup from "../../../components/FormElement/InputGroup";
import { useEffect, useState } from "react";
import LoadingStore from "../../../Store/LoadingStore";

export default function Modal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onChange,
    formError,
    isView,
}) {
    const setLoading = LoadingStore((state) => state.setLoading);
        const [branchOptions, setBranchOptions] = useState([]);
        const [categoryOptions, setCategoryOptions] = useState([]);

    useEffect(() => {
        setLoading(true);
        fetchData();
        Promise.all([
            InventoryApis.GetCategories('?limit=1000'),
            BranchApis.GetBranch('?limit=1000')
        ]).then(([categoryRes, branchRes]) => {
            setCategoryOptions(HelperFunctions.formatDropdown(categoryRes.data, 'id', 'category_name', true));
            setBranchOptions(HelperFunctions.formatDropdown(branchRes.data, 'id', 'branch_name', true));
        }).catch(error => {
            console.error('Error fetching options:', error);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (formData?.category_id) {
            console.log('Selected category ID:', formData.category_id);
        }
    }, [formData]);



    const fieldsModal = [
        {
            label: "Kode Produk",
            name: "product_code",
            type: "text",
            placeholder: "Masukkan kode produk",
            isRequired: !isView,
            isDisable: isView || formData?.id,
        },
        {
            label: "Nama Produk",
            name: "product_name",
            type: "text",
            placeholder: "Masukkan nama produk",
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Keterangan Produk",
            name: "description",
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
            options: categoryOptions,
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Sub Kategori",
            name: "sub_kategori",
            type: "dropdown",
            placeholder: "Pilih sub kategori",
            options: [],
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Cabang",
            name: "branch_id",
            type: "dropdown",
            placeholder: "Pilih cabang",
            options: branchOptions,
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Status Produk",
            name: "status",
            type: "checkbox",
            options: [{ value: true , label: "Aktif" }],
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
