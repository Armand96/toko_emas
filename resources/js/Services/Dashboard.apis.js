import Apis from "../utils/Apis";

const DashboardApis = {
    GetTakeAction: () => {
        return Apis.Get("api/dashboard/take-action-data").then(({ data }) => data?.data ?? data);
    },
    GetDataToday: () => {
        return Apis.Get("api/dashboard/data-today").then(({ data }) => data?.data ?? data);
    },
    GetSalesTrend: (days = 7) => {
        return Apis.Get(`api/dashboard/sales-trend?days=${days}`).then(({ data }) => data?.data ?? data);
    },
    GetLatestSales: () => {
        return Apis.Get("api/dashboard/sales-latest").then(({ data }) => data?.data ?? data);
    },
    GetSalesStatus: () => {
        return Apis.Get("api/dashboard/sales-status").then(({ data }) => data?.data ?? data);
    },
};

export default DashboardApis;
