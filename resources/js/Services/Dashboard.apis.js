import Apis from "../utils/Apis";

const bp = (branchId) => (branchId ? `branch_id=${branchId}` : "");

const DashboardApis = {
    GetTakeAction: (branchId) => {
        const q = bp(branchId);
        return Apis.Get(`api/dashboard/take-action-data${q ? `?${q}` : ""}`).then(({ data }) => data?.data ?? data);
    },
    GetDataToday: (branchId) => {
        const q = bp(branchId);
        return Apis.Get(`api/dashboard/data-today${q ? `?${q}` : ""}`).then(({ data }) => data?.data ?? data);
    },
    GetSalesTrend: (days = 7, branchId) => {
        const q = bp(branchId);
        return Apis.Get(`api/dashboard/sales-trend?days=${days}${q ? `&${q}` : ""}`).then(({ data }) => data?.data ?? data);
    },
    GetLatestSales: (branchId) => {
        const q = bp(branchId);
        return Apis.Get(`api/dashboard/sales-latest${q ? `?${q}` : ""}`).then(({ data }) => data?.data ?? data);
    },
    GetSalesStatus: (branchId) => {
        const q = bp(branchId);
        return Apis.Get(`api/dashboard/sales-status${q ? `?${q}` : ""}`).then(({ data }) => data?.data ?? data);
    },
};

export default DashboardApis;
