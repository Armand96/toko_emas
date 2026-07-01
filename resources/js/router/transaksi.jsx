import Penjualan from "../pages/Penjualan/Page";
import Pembelian from "../pages/Inventory/Pembelian/Page";

export const Transaksi = [
    {
        path: "/transaksi/penjualan",
        element: <Penjualan />,
    },
    {
        path: "/transaksi/pembelian",
        element: <Pembelian />,
    },
];
