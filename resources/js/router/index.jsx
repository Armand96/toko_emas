import { createBrowserRouter } from "react-router";
import Login from "../pages/Login/Login";
import { Inventory } from "./inventory";
import { Ui } from "./ui";
import Layout from "../components/Layout/Layout";
import Branch from "../pages/administrator/Branch/Page";
import SettingStore from "../pages/administrator/Store/Page";
import { Approval } from "./approval";
import MasterBank from "../pages/administrator/MasterBank/Page";
import Penjualan from "../pages/Penjualan/Page";
import MasterUser from "../pages/administrator/user/Page";
import MasterSupplier from "../pages/administrator/Supplier/Page";
import MasterCustomer from "../pages/administrator/Customer/Page";
import PrintBarcode from "../pages/Inventory/Inventory/PrintBarcode";
import Finance from "../pages/Finance/Page";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        path: "/inventory/print-barcode",
        element: <PrintBarcode />,
    },
    {
        element: <Layout />,
        children: [
            {
                path: "/administrator/cabang",
                element: <Branch />
            },
                {
                path: "/administrator/master-bank",
                element: <MasterBank />
            },
              {
                path: "/administrator/setting",
                element: <SettingStore />
            },
                {
                path: "/administrator/users",
                element: <MasterUser />
            },
            {
                path: "/administrator/supplier",
                element: <MasterSupplier />
            },
            {
                path: "/administrator/customer",
                element: <MasterCustomer />
            },
              {
                path: "/penjualan",
                element: <Penjualan />
            },
            {
                path: "/finance",
                element: <Finance />
            },
            ...Inventory,
            ...Ui,
            ...Approval
        ]
    }
])

export default router;
