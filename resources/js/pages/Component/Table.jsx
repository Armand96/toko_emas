import React, { useEffect, useState } from 'react';
import { EyeIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import Table from '../../components/Table/Table';

const DUMMY_DB = Array.from({ length: 45 }).map((_, index) => ({
  id: index + 1,
  tanggal: '11/05/2026',
  kode: `OPN-BL1-2605-${String(index + 1).padStart(3, '0')}`,
  cabang: 'BLOK M 1',
  total: 500 + index,
  sesuai: 500,
  missing: index,
  extra: 0,
  modal: 'Rp 5.460.000',
  jual: 'Rp 6.440.000',
  status: index % 3 === 0 ? 'Selisih' : 'Sesuai'
}));

const TableComponent = () => {
  const [pagination, setPagination] = useState({
    data: DUMMY_DB.slice(0, 10),
    page: 1,
    page_size: 10,
    total: DUMMY_DB.length
  });

  const handlePageChange = (newPage) => {
    const start = (newPage - 1) * pagination.page_size;
    const end = start + pagination.page_size;

    setPagination(prev => ({
      ...prev,
      page: newPage,
      data: DUMMY_DB.slice(start, end)
    }));
  };

  const handlePageSizeChange = (newPageSize) => {
    const end = newPageSize;

    setPagination({
      page: 1,
      page_size: newPageSize,
      total: DUMMY_DB.length,
      data: DUMMY_DB.slice(0, end)
    });
  };

  const handleSortChange = (sortConfig) => {
    console.log('Trigger sort to API:', sortConfig);
  };

  const handleSelectionChange = (selectedRows) => {
    console.log('Selected Data:', selectedRows);
  };

  const columns = [
    { header: 'Tanggal Sesi', accessor: 'tanggal', sortable: true },
    { header: 'Kode Sesi', accessor: 'kode', sortable: true },
    { header: 'Cabang', accessor: 'cabang', sortable: true },
    { header: 'Total Item', accessor: 'total', sortable: true },
    { header: 'Sesuai', accessor: 'sesuai', sortable: true },
    { header: 'Missing', accessor: 'missing', sortable: true },
    { header: 'Extra', accessor: 'extra', sortable: true },
    { header: 'Modal', accessor: 'modal', sortable: true },
    { header: 'Jual', accessor: 'jual', sortable: true },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const isSesuai = row.status === 'Sesuai';
        return (
          <span className={`px-3 py-1 rounded-md text-xs font-medium border ${
            isSesuai
              ? 'bg-success-50 text-success-700 border-success-200'
              : 'bg-danger-50 text-danger-700 border-danger-200'
          }`}>
            {row.status}
          </span>
        );
      }
    },
    {
      header: 'Aksi',
      accessor: 'aksi',
      render: () => (
        <div className="flex items-center gap-2">
          <button className="p-1.5 border border-primary-200 rounded-md text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
            <EyeIcon className="w-4 h-4" />
          </button>
          <button className="p-1.5 border border-primary-200 rounded-md text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer">
            <PencilSimpleIcon className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];


  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <Table
        columns={columns}
        data={pagination.data}
        page={pagination.page}
        pageSize={pagination.page_size}
        total={pagination.total}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onSort={handleSortChange}
        onSelectionChange={handleSelectionChange}
      />
    </div>
  );
};

export default TableComponent;
