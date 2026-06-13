import ApprovalPembelian from "../pages/Approval/ApprovalPembelian/page";
import ApprovalPenjualan from "../pages/Approval/ApprovalPenjualan/Page";
import ApprovalTransfer from "../pages/Approval/ApprovalTransfer/Page";


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
        path: '/approval/transfer',
        element: <ApprovalTransfer />
    }
];
