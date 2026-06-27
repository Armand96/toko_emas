import Apis from "../utils/Apis";

const PenjualanApis = {
    GetPenjualan: (params) => {
        return Apis.Get(`api/sales${params}`).then(({ data }) => data);
    },
    GetPenjualanDetail: (id) => {
        return Apis.Get(`api/sales/${id}`).then(({ data }) => data);
    },
    PostPenjualan: (body) => {
        return Apis.Post(`api/sales`, body);
    },
    PutPenjualanApproval: (body) => {
        return Apis.Put(`api/update-sales`, body);
    },
}

export default PenjualanApis;
