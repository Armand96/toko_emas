import ModalCustom from "../../../components/modalCustom";
import InputGroup from "../../../components/FormElement/InputGroup";
import { useEffect, useState } from "react";
import LoadingStore from "../../../Store/LoadingStore";
import InventoryApis from "../../../Services/Inventory.apis";
import BranchApis from "../../../Services/Branch.apis";
import HelperFunctions from "../../../utils/HelperFunctions";

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
        const [subCategoriesOptions, setSubCategoriesOptions] = useState([]);

    useEffect(() => {
        setLoading(true);
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


    const handleOnChange = (e) => {
        const { name, value, type } = e.target;
        console.log('Field changed:', name, value);
        if(name === 'category') {
              InventoryApis.GetCategories(`?parent_id=${value}&limit=1000`).then(res => {
                setSubCategoriesOptions(HelperFunctions.formatDropdown(res.data, 'id', 'category_name', ));
            })
            onChange({ target: { name: 'sub_category', value: '' }});
            onChange({ target: { name, value, type } });
        }else{
            onChange({ target: { name, value, type } });
        }
    };




    const fieldsModal = [
        {
            label: "Kode Produk",
            name: "barcode",
            type: "text",
            placeholder: "Masukkan kode produk",
            isDisable: true,
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
            name: "category",
            type: "dropdown",
            placeholder: "Pilih kategori",
            options: categoryOptions,
            isRequired: !isView ,
            isDisable: isView || (formData?.sub_category && formData?.id),
        },
        {
            label: "Sub Kategori",
            name: "sub_category",
            type: "dropdown",
            placeholder: "Pilih sub kategori",
            options: subCategoriesOptions,
            isRequired: !isView && subCategoriesOptions.length > 0,
            isDisable: isView,
        },
        {
            label: "Cabang",
            name: "branch",
            type: "dropdown",
            placeholder: "Pilih cabang",
            options: branchOptions,
            isRequired: !isView,
            isDisable: isView,
        },
        {
            label: "Status Produk",
            name: "is_active",
            type: "checkbox",
            isRequired: !isView,
            isDisable: isView,
        },
    ];

    const disableButton = () => {
        if (isView) return true;
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
                    onChange={handleOnChange}
                    formError={formError}
                />
            </div>
        </ModalCustom>
    );
}
