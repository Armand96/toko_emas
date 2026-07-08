import Apis from "../utils/Apis";

const ReportApis = {
      GetCustomerCount: (params = "") => {
        return Apis.Get(`api/report/customer-count${params}`).then(({ data }) => data?.data ?? data);
    },
    GetTopCustomer: (params = "") => {
        return Apis.Get(`api/report/top-customer${params}`).then(({ data }) => data?.data ?? data);
    },
    GetTopCustomerDetail: (params = "") => {
        return Apis.Get(`api/report/top-customer-detail${params}`).then(({ data }) => data);
    },
    // Dibungkus ApiResponse::success → unwrap .data
    // { frequency_transaction: {label:count}, purchase_segment: {label:count} }
    GetCustomerTransaction: (params = "") => {
        return Apis.Get(`api/report/customer-transaction${params}`).then(({ data }) => data?.data ?? data);
    },

    /* ── FINANCE ──────────────────────────────────────────────
       Semua endpoint dibungkus ApiResponse::success → unwrap .data */

    // { total_all, total_cash, total_transfer }
    GetFinanceTotalCount: (params = "") => {
        return Apis.Get(`api/report/total-count${params}`).then(({ data }) => data?.data ?? data);
    },
    // [{ branch_id, bank_cabang_id, balance, branch, bankCabang }]
    GetFinanceGroupByCabang: (params = "") => {
        return Apis.Get(`api/report/total-group-by-cabang${params}`).then(({ data }) => data?.data ?? data);
    },
    // { summary: {opening_balance, cash_in, cash_out, closing_balance},
    //   cash_in_category: [{category_name,total}], cash_out_category: [...] }
    GetFinanceSummary: (params = "") => {
        return Apis.Get(`api/report/finance-summary${params}`).then(({ data }) => data?.data ?? data);
    },
    // paginated → { data, current_page, total, per_page }
    GetFinanceDetail: (params = "") => {
        return Apis.Get(`api/report/finance-detail${params}`).then(({ data }) => data?.data ?? data);
    },

    /* ── PENJUALAN / SALES ────────────────────────────────────
       Semua endpoint dibungkus ApiResponse::success → unwrap .data */

    // { total_penjualan, jumlah_transaksi, laba, emas_terjual }
    GetSalesSummary: (params = "") => {
        return Apis.Get(`api/report/sales-summary${params}`).then(({ data }) => data?.data ?? data);
    },
    // { trend: [{trx_date, total}], top_product: [{product_name, karat, berat, terjual}] }
    GetSalesTrend: (params = "") => {
        return Apis.Get(`api/report/sales-trend${params}`).then(({ data }) => data?.data ?? data);
    },
    // { category: [{category_name, total}], subcategory: [{subcategory_name, total}], karat: [{karat, total}] }
    GetSalesByCategory: (params = "") => {
        return Apis.Get(`api/report/sales-by-category-karat${params}`).then(({ data }) => data?.data ?? data);
    },
    // paginated → { data, current_page, total, per_page }
    GetSalesDetail: (params = "") => {
        return Apis.Get(`api/report/sales-detail${params}`).then(({ data }) => data?.data ?? data);
    },

    /* ── PEMBELIAN ────────────────────────────────────────────
       Semua endpoint dibungkus ApiResponse::success → unwrap .data */

    // { total_item_dibeli, total_berat, total_nilai }
    GetPembelianTotalItem: (params = "") => {
        return Apis.Get(`api/report/pembelian-total-item${params}`).then(({ data }) => data?.data ?? data);
    },
    // { category: [{category_name, total_modal}], subcategory: [{subcategory_name, total_modal}] }
    GetPembelianByCategory: (params = "") => {
        return Apis.Get(`api/report/pembelian-by-category${params}`).then(({ data }) => data?.data ?? data);
    },
    // [{ karat, total_modal }]
    GetPembelianByKarat: (params = "") => {
        return Apis.Get(`api/report/pembelian-by-karat${params}`).then(({ data }) => data?.data ?? data);
    },
    // paginated → { data: [{batch, supplier_id, branch_id, tanggal, total_item, total_berat, total_modal, branch}], current_page, total, per_page }
    GetPembelianDetail: (params = "") => {
        return Apis.Get(`api/report/pembelian-detail${params}`).then(({ data }) => data?.data ?? data);
    },

    /* ── BUYBACK ──────────────────────────────────────────────
       Semua endpoint dibungkus ApiResponse::success → unwrap .data */

    // { jumlah_transaksi, total_item, total_berat, total_nilai }
    GetBuybackSummary: (params = "") => {
        return Apis.Get(`api/report/buyback-summary${params}`).then(({ data }) => data?.data ?? data);
    },
    // { category: [{category_name, total_nilai, total_berat, total_item}], subcategory: [{subcategory_name, ...}] }
    GetBuybackByCategory: (params = "") => {
        return Apis.Get(`api/report/buyback-by-category${params}`).then(({ data }) => data?.data ?? data);
    },
    // [{ karat, total_nilai, total_berat, total_item }]
    GetBuybackByKarat: (params = "") => {
        return Apis.Get(`api/report/buyback-by-karat${params}`).then(({ data }) => data?.data ?? data);
    },
    // paginated → { data, current_page, total, per_page }
    GetBuybackDetail: (params = "") => {
        return Apis.Get(`api/report/buyback-detail${params}`).then(({ data }) => data?.data ?? data);
    },

    /* ── INVENTORY ────────────────────────────────────────────
       Semua endpoint dibungkus ApiResponse::success → unwrap .data */

    // { total_item_active, total_berat_active, total_modal, total_jual, item_repair, item_transit, item_lost, item_sold }
    GetInventorySummary: (params = "") => {
        return Apis.Get(`api/report/inventory-summary${params}`).then(({ data }) => data?.data ?? data);
    },
    // { category: [{category_name, total_item}], subcategory: [{subcategory_name, total_item}], karat: [{karat, total_item}] }
    GetInventoryDistribution: (params = "") => {
        return Apis.Get(`api/report/inventory-distribution${params}`).then(({ data }) => data?.data ?? data);
    },
    // { status: [{status, total}], aging: [{aging_group, total}] }
    GetInventoryStatusAging: (params = "") => {
        return Apis.Get(`api/report/inventory-status-aging${params}`).then(({ data }) => data?.data ?? data);
    },
    // paginated → { data, current_page, total, per_page }
    GetInventoryDetail: (params = "") => {
        return Apis.Get(`api/report/inventory-detail${params}`).then(({ data }) => data?.data ?? data);
    },
    /* ── EXPORT (DOWNLOAD XLSX) ─────────────────────────────── */

    ExportSales: (params = {}) =>
        Apis.Download("api/report/export-sales", "sales-report.xlsx", params),

    ExportPembelian: (params = {}) =>
        Apis.Download("api/report/export-pembelian", "pembelian-report.xlsx", params),

    ExportBuyback: (params = {}) =>
        Apis.Download("api/report/export-buyback", "buyback-report.xlsx", params),

    ExportFinance: (params = {}) =>
        Apis.Download("api/report/export-finance", "finance-report.xlsx", params),

    ExportInventory: (params = {}) =>
        Apis.Download("api/report/export-inventory", "inventory-report.xlsx", params),

    ExportCustomer: (params = {}) =>
        Apis.Download("api/report/export-customer", "customer-report.xlsx", params),
};

export default ReportApis;
