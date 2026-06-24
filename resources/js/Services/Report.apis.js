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
};

export default ReportApis;
