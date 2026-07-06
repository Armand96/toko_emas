import ApprovalPembelian from "../pages/Approval/ApprovalPembelian/Page";
import ApprovalPenjualan from "../pages/Approval/ApprovalPenjualan/Page";
import ApprovalBuyback from "../pages/Approval/ApprovalBuyback/Page";
import ApprovalTransfer from "../pages/Approval/ApprovalTransfer/Page";
import ApprovalRemoveItem from "../pages/Approval/ApprovalRemoveItem/Page";


export const Approval = [
    {
        path: '/approval/pembelian',
        element: <ApprovalPembelian />
    },
      {
        path: '/approval/penjualan',
        element: <ApprovalPenjualan />
    },
      {
        path: '/approval/buyback',
        element: <ApprovalBuyback />
    },
      {
        path: '/approval/transfer',
        element: <ApprovalTransfer />
    },
      {
        path: '/approval/remove-item',
        element: <ApprovalRemoveItem />
    }
];
