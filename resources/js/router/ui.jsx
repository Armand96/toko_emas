
import Layout from "../components/layout/Layout";
import ComponentInput from "../pages/Component/ComponentInput";
import TableComponent from "../pages/Component/Table";
import AlertModalPage from "../pages/Component/alertModal";

export const Ui = [
    { path: "/input", element: <ComponentInput /> },
    { path: "/table", element: <TableComponent /> },
    { path: "/alert-modal", element: <AlertModalPage /> },
]
