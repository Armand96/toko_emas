import ModalCustom from "../../../components/modalCustom";
import InputGroup from "../../../components/FormElement/InputGroup";
import { useEffect, useState } from "react";
import LoadingStore from "../../../Store/LoadingStore";
import InventoryApis from "../../../Services/Inventory.apis";
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
    const setLoading = LoadingStore((state) => state.setLoading);
    const ensureBranches = OptionsStore((s) => s.ensureBranches);
        const [branchOptions, setBranchOptions] = useState([]);
        const [categoryOptions, setCategoryOptions] = useState([]);
        const [subCategoriesOptions, setSubCategoriesOptions] = useState([]);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            InventoryApis.GetCategories('?only_parent=1&limit=1000'),
            ensureBranches(),
        ]).then(([categoryRes, branchData]) => {
            setCategoryOptions(HelperFunctions.formatDropdown(categoryRes.data, 'id', 'category_name'));
            setBranchOptions(HelperFunctions.formatDropdown(branchData, 'id', 'branch_name'));
        }).catch(error => {
            console.error('Error fetching options:', error);
        }).finally(() => {
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        if (isOpen && formData?.category) {
            InventoryApis.GetCategories(`?parent_id=${formData.category}&limit=1000`).then(res => {
                setSubCategoriesOptions(HelperFunctions.formatDropdown(res.data, 'id', 'category_name'));
            });
        }
        if (!isOpen) {
            setSubCategoriesOptions([]);
        }
    }, [isOpen, formData?.category]);


    const handleOnChange = (e) => {
        const { name, value, type } = e.target;
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
            label: "Kategori",
            name: "category",
            type: "dropdown",
            placeholder: "Pilih kategori",
            options: categoryOptions,
            isRequired: !isView ,
            isDisable: isView || !!formData?.id,
        },
        {
            label: "Sub Kategori",
            name: "sub_category",
            type: "dropdown",
            placeholder: "Pilih sub kategori",
            options: subCategoriesOptions,
            isRequired: !isView && subCategoriesOptions.length > 0,
            isDisable: isView || !!formData?.id,
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
                {formData?.id && formData?.barcode && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-500">Kode Produk</span>
                        <span className="text-sm font-medium text-gray-900">{formData.barcode}</span>
                    </div>
                )}
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
