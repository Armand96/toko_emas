import { createBrowserRouter } from "react-router";
import Login from "../pages/Login/Login";
import { Inventory } from "./inventory";

import { Ui } from "./ui";
import Layout from "../components/layout/Layout";


const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        element: <Layout />,
        children: [
            ...Inventory,
            ...Ui
        ]
    }
])

export default router;
