const HelperFunctions = {
    formatDropdown: (data = [], valueKey = 'id', labelKey = 'name', isNull = false) => {
        if (!Array.isArray(data)) return [];
        let formattedData = data.map(item => ({
            value: item[valueKey],
            label: item[labelKey],
            details: item,
        }));
        if (isNull) {
            formattedData = [{ value: '', label: 'Pilih' }, ...formattedData];
        }
        return formattedData;
    },
    formatDropdownWithCode: (data = [], valueKey = 'id', labelCode = 'code', labelKey = 'name', isNull = false) => {
        if (!Array.isArray(data)) return [];
        let formattedData = data.map(item => ({
            value: item[valueKey],
            label: `${item[labelCode]} - ${item[labelKey]}`,
            details: item,
        }));
        if (isNull) {
            formattedData = [{ value: '', label: 'Pilih' }, ...formattedData];
        }
        return formattedData;
    },
    formatCurrency: (price) => {
         return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0
        }).format(price);
    }
};

export default HelperFunctions;
