// Baris filter standar di halaman list: full-width & stack di mobile,
// kembali ke lebar tetap di >= sm. Pakai <FilterBar> sebagai container,
// <FilterBar.Search> untuk input pencarian (fleksibel), dan
// <FilterBar.Item> untuk tiap dropdown/filter berlebar tetap.

const FilterBar = ({ children, className = "" }) => {
    return (
        <div className={`flex flex-wrap items-end gap-3 ${className}`}>
            {children}
        </div>
    );
};

const Search = ({ children, className = "" }) => (
    <div className={`w-full sm:flex-1 sm:min-w-[220px] sm:max-w-xs ${className}`}>
        {children}
    </div>
);

const Item = ({ children, width = "sm:w-[160px]", className = "" }) => (
    <div className={`w-full ${width} ${className}`}>
        {children}
    </div>
);

FilterBar.Search = Search;
FilterBar.Item = Item;

export default FilterBar;
