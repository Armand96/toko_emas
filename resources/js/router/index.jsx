import { createBrowserRouter } from "react-router";
import Login from "../pages/Login/Login";
import { Inventory } from "./inventory";

import { Ui } from "./ui";
import Layout from "../components/layout/Layout";
import BranchPage from "../pages/Branch/Branch";


const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        element: <Layout />,
        children: [
            {
                path: "/branch",
                element: <BranchPage />
            },
            ...Inventory,
            ...Ui
        ]
    }
])

export default router;
