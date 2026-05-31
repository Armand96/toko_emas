const HelperFunctions = {
    formatDropdown: (data = [], valueKey = 'id', labelKey = 'name') => {
        if (!Array.isArray(data)) return [];
        return data.map(item => ({
            value: item[valueKey],
            label: item[labelKey]
        }));
    }
};

export default HelperFunctions;
