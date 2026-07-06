// Baris filter standar di halaman list: <FilterBar fields={[...]} value={search} onChange={setSearch} />
// - Field dengan type "search" melebar (flex-1); tipe lain berlebar tetap (default 160px, override via field.width).
// - Entry falsy di-skip (mis. `!isKasir() && {...}`), untuk filter kondisional.
// - field.onChange / field.formData override default, kalau state field itu terpisah dari `value`
//   (mis. dropdown yang fetch langsung tanpa debounce, beda dari search box yang pakai `value`).
import InputGroup from "./FormElement/InputGroup";

const wrapperWidth = (field) => {
    if (field.width) return field.width;
    return field.type === "search"
        ? "sm:flex-1 sm:min-w-[220px] sm:max-w-xs"
        : "sm:w-[160px]";
};

const FilterBar = ({ fields, value, onChange, className = "" }) => (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
        {fields.filter(Boolean).map((field, index) => {
            const handleFieldChange = field.onChange ?? ((e) => onChange({ ...value, [e.target.name]: e.target.value }));

            return (
                <div key={field.name ?? index} className={`w-full ${wrapperWidth(field)}`}>
                    <InputGroup fields={[field]} formData={field.formData ?? value} cols="1" onChange={handleFieldChange} />
                </div>
            );
        })}
    </div>
);

export default FilterBar;
