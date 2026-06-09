import ApprovalPembelian from "../pages/Approval/ApprovalPembelian/page";
import ApprovalPenjualan from "../pages/Approval/ApprovalPenjualan/Page";


export const Approval = [
    {
        path: '/approval/pembelian',
        element: <ApprovalPembelian />
    },
      {
        path: '/approval/penjualan',
        element: <ApprovalPenjualan />
    }
];
