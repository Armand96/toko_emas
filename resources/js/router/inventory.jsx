import MasterKategori from "../pages/Inventory/MasterKategori/Page";
import MasterProduk from "../pages/Inventory/MasterProduk/Page";
import Pembelian from "../pages/Inventory/Pembelian/Page";


export const Inventory = [
      {
        path: "/inventory/master-kategori",
        element: <MasterKategori />,
    },
    {
        path: "/inventory/master-produk",
        element: <MasterProduk />,
    },
      {
        path: "/inventory/pembelian",
        element: <Pembelian />,
    },
]
