import Penjualan from "../pages/Penjualan/Page";
import Pembelian from "../pages/Inventory/Pembelian/Page";
import Buyback from "../pages/Buyback/Page";

export const Transaksi = [
    {
        path: "/transaksi/penjualan",
        element: <Penjualan />,
    },
    {
        path: "/transaksi/buyback",
        element: <Buyback />,
    },
    {
        path: "/transaksi/pembelian",
        element: <Pembelian />,
    },
];
