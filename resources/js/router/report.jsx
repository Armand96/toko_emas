import ReportCustomer from "../pages/Report/Customer/Page";
import ReportFinance from "../pages/Report/Finance/Page";

export const Report = [
    {
        path: "/report/customer",
        element: <ReportCustomer />,
    },
    {
        path: "/report/finance",
        element: <ReportFinance />,
    },
];
