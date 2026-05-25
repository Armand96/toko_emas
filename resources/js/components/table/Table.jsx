import React, { useState } from 'react';
import { CaretUpIcon, CaretDownIcon, CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

const Table = ({
  columns,
  data = [],
  page = 1,
  pageSize = 10,
  total = 0,
  onPageChange,
  onPageSizeChange,
  onSort,
  selectable = false,
  onSelectionChange,
  itemsPerPageOptions = [10, 25, 50]
}) => {
  const [sortConfig, setSortConfig] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startEntry = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, total);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    if (onSort) {
      onSort({ key, direction });
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const newSelected = data?.map((_, index) => index);
      setSelectedRows(newSelected);
      if (onSelectionChange) onSelectionChange(data);
    } else {
      setSelectedRows([]);
      if (onSelectionChange) onSelectionChange([]);
    }
  };

  const handleSelectRow = (index) => {
    const selectedIndex = selectedRows.indexOf(index);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedRows, index);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedRows.slice(1));
    } else if (selectedIndex === selectedRows?.length - 1) {
      newSelected = newSelected.concat(selectedRows.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedRows.slice(0, selectedIndex),
        selectedRows.slice(selectedIndex + 1)
      );
    }

    setSelectedRows(newSelected);
    if (onSelectionChange) onSelectionChange(newSelected?.map(i => data[i]));
  };

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        pages.push(i);
      } else if (i === page - 2 || i === page + 2) {
        pages.push('...');
      }
    }
    return pages.filter((p, index, self) => self.indexOf(p) === index);
  };

  return (
    <div className="w-full flex flex-col bg-neutral-white rounded-lg shadow-sm border border-gray-200">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-sm text-left text-gray-900">
          <thead className="text-xs text-gray-900 bg-neutral-bg-white-smk border-b border-gray-200 uppercase font-semibold">
            <tr>
              {selectable && (
                <th scope="col" className="p-4 w-12">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 bg-neutral-white border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={selectedRows?.length === data?.length && data?.length > 0}
                    />
                  </div>
                </th>
              )}
              {columns?.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`px-6 py-4 whitespace-nowrap ${column.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
                  onClick={() => column.sortable && handleSort(column.accessor)}
                >
                  <div className="flex items-center gap-2">
                    {column.header}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <CaretUpIcon
                          weight={sortConfig?.key === column.accessor && sortConfig.direction === 'asc' ? 'fill' : 'regular'}
                          className={`w-3 h-3 ${sortConfig?.key === column.accessor && sortConfig.direction === 'asc' ? 'text-primary-600' : 'text-gray-400'}`}
                        />
                        <CaretDownIcon
                          weight={sortConfig?.key === column.accessor && sortConfig.direction === 'desc' ? 'fill' : 'regular'}
                          className={`w-3 h-3 -mt-1 ${sortConfig?.key === column.accessor && sortConfig.direction === 'desc' ? 'text-primary-600' : 'text-gray-400'}`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((row, rowIndex) => (
              <tr key={rowIndex} className="bg-neutral-white border-b border-gray-200 hover:bg-neutral-bg-white-smk transition-colors">
                {selectable && (
                  <td className="p-4 w-12">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary-600 bg-neutral-white border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                        checked={selectedRows.indexOf(rowIndex) !== -1}
                        onChange={() => handleSelectRow(rowIndex)}
                      />
                    </div>
                  </td>
                )}
                {columns?.map((column, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td colSpan={selectable ? columns?.length + 1 : columns?.length} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data tersedia
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between p-4 gap-4">
        <div className="flex items-center text-sm text-gray-500">
          Showing <span className="font-semibold text-gray-900 mx-1">{startEntry}</span> -
          <span className="font-semibold text-gray-900 mx-1">{endEntry}</span> of
          <span className="font-semibold text-gray-900 mx-1">{total}</span> entries
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Row per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                if (onPageSizeChange) onPageSizeChange(Number(e.target.value));
              }}
              className="bg-neutral-white border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block py-1.5 px-3 cursor-pointer outline-none"
            >
              {itemsPerPageOptions?.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(page - 1, 1))}
              disabled={page === 1}
              className="p-1.5 border border-gray-200 rounded-md bg-neutral-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CaretLeftIcon className="w-4 h-4" />
            </button>

            {getPageNumbers()?.map((p, index) => (
              <button
                key={index}
                onClick={() => typeof p === 'number' && onPageChange && onPageChange(p)}
                disabled={p === '...'}
                className={`px-3 py-1 text-sm border rounded-md transition-colors ${
                  page === p
                    ? 'bg-primary-500 text-neutral-white border-primary-500'
                    : 'bg-neutral-white text-gray-700 border-gray-200 hover:bg-gray-50'
                } ${p === '...' ? 'border-none bg-transparent hover:bg-transparent cursor-default' : ''}`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => onPageChange && onPageChange(Math.min(page + 1, totalPages))}
              disabled={page === totalPages || total === 0}
              className="p-1.5 border border-gray-200 rounded-md bg-neutral-white text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CaretRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Table;
