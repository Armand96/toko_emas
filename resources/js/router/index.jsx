import { createBrowserRouter, Navigate } from "react-router";
import Login from "../pages/Login/Login";
import { Inventory } from "./inventory";
import { Ui } from "./ui";
import Layout from "../components/Layout/Layout";
import Branch from "../pages/administrator/Branch/Page";
import SettingStore from "../pages/administrator/Store/Page";
import { Approval } from "./approval";
import { Report } from "./report";
import MasterBank from "../pages/administrator/MasterBank/Page";
import Penjualan from "../pages/Penjualan/Page";
import MasterUser from "../pages/administrator/user/Page";
import MasterSupplier from "../pages/administrator/Supplier/Page";
import MasterCustomer from "../pages/administrator/Customer/Page";
import MasterCategoryFinance from "../pages/administrator/MasterCategoryFinance/Page";
import PrintBarcode from "../components/Utils/PrintBarcode";
import PrintKwitansi from "../pages/Penjualan/PrintKwitansi";
import Finance from "../pages/Finance/Page";
import ProtectedRoute from "../components/ProtectedRoute";
import PublicRoute from "../components/PublicRoute";
import Dashboard from "../pages/Dashboard/Page";

const router = createBrowserRouter([
    // ── PUBLIC ───────────────────────────────────────────────
    // Kalau sudah login, /login otomatis dialihkan ke /dashboard.
    {
        element: <PublicRoute />,
        children: [
            { path: "/login", element: <Login /> },
        ],
    },
    { path: "/", element: <Navigate to="/login" replace /> },

    // ── PUBLIC (print) ────────────────────────────────────────
    { path: "/inventory/print-barcode", element: <PrintBarcode /> },
    { path: "/penjualan/print-kwitansi", element: <PrintKwitansi /> },

    // ── PROTECTED ────────────────────────────────────────────
    {
        element: <ProtectedRoute />,
        children: [
            {
                element: <Layout />,
                children: [
                    { path: "/dashboard", element: <Dashboard /> },
                    { path: "/administrator/cabang", element: <Branch /> },
                    { path: "/administrator/master-bank", element: <MasterBank /> },
                    { path: "/administrator/setting", element: <SettingStore /> },
                    { path: "/administrator/users", element: <MasterUser /> },
                    { path: "/administrator/supplier", element: <MasterSupplier /> },
                    { path: "/administrator/customer", element: <MasterCustomer /> },
                    { path: "/administrator/master-category-finance", element: <MasterCategoryFinance /> },
                    { path: "/transaksi/penjualan", element: <Penjualan /> },
                    { path: "/finance", element: <Finance /> },
                    ...Inventory,
                    ...Ui,
                    ...Approval,
                    ...Report,
                ],
            },
        ],
    },

    // ── FALLBACK ─────────────────────────────────────────────
    { path: "*", element: <Navigate to="/login" replace /> },
]);

export default router;
