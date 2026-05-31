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
    }
};

export default HelperFunctions;
