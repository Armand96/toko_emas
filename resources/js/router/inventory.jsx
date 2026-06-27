import MasterInventory from "../pages/Inventory/Inventory/Page";
import MasterKategori from "../pages/Inventory/MasterKategori/Page";
import MasterProduk from "../pages/Inventory/MasterProduk/Page";
import Pembelian from "../pages/Inventory/Pembelian/Page";
import TransferInventory from "../pages/Inventory/transfer/Page";
import RemoveInventory from "../pages/Inventory/Remove/Page";
import InRepairInventory from "../pages/Inventory/InRepair/Page";
import StockOpnameInventory from "../pages/Inventory/StockOpname/Page";


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
        path: "/transaksi/pembelian",
        element: <Pembelian />,
    },
      {
        path: "/inventory/inventory",
        element: <MasterInventory />,
    },
      {
        path: "/inventory/transfer",
        element: <TransferInventory />,
    },
      {
        path: "/inventory/remove",
        element: <RemoveInventory />,
    },
      {
        path: "/inventory/in-repair",
        element: <InRepairInventory />,
    },
      {
        path: "/inventory/stock-opname",
        element: <StockOpnameInventory />,
    },
]
