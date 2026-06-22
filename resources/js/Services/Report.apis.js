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
};

export default ReportApis;
