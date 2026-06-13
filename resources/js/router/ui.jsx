
import Layout from "../components/Layout/Layout";
import ComponentInput from "../pages/Component/ComponentInput";
import TableComponent from "../pages/Component/Table";
import AlertModalPage from "../pages/Component/AlertModal";

export const Ui = [
    { path: "/input", element: <ComponentInput /> },
    { path: "/table", element: <TableComponent /> },
    { path: "/alert-modal", element: <AlertModalPage /> },
]
