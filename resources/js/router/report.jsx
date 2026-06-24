import ReportCustomer from "../pages/Report/Customer/Page";
import ReportFinance from "../pages/Report/Finance/Page";
import ReportPenjualan from "../pages/Report/Penjualan/Page";
import ReportPembelian from "../pages/Report/Pembelian/Page";
import ReportInventory from "../pages/Report/Inventory/Page";

export const Report = [
    {
        path: "/report/inventory",
        element: <ReportInventory />,
    },
    {
        path: "/report/customer",
        element: <ReportCustomer />,
    },
    {
        path: "/report/finance",
        element: <ReportFinance />,
    },
    {
        path: "/report/penjualan",
        element: <ReportPenjualan />,
    },
    {
        path: "/report/pembelian",
        element: <ReportPembelian />,
    },
];
