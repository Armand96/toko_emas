import { createBrowserRouter } from "react-router";
import Login from "../pages/Login/Login";
import { Inventory } from "./inventory";

import { Ui } from "./ui";
import Layout from "../components/layout/Layout";
import Branch from "../pages/administrator/Branch/Page";
import SettingStore from "../pages/administrator/Store/Page";
import { Approval } from "./approval";
import MasterBank from "../pages/administrator/MasterBank/Page";
import Penjualan from "../pages/Penjualan/Page";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
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
                path: "/penjualan",
                element: <Penjualan />
            },
            ...Inventory,
            ...Ui,
            ...Approval
        ]
    }
])

export default router;
