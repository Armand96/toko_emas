import Apis from "../utils/Apis";

// FE-only: endpoint mengikuti konvensi penamaan modul lain (sales/pembelian).
// BE endpoint `api/buyback` disiapkan menyusul oleh tim backend.
const BuybackApis = {
    GetBuyback: (params) => {
        return Apis.Get(`api/buyback${params}`).then(({ data }) => data);
    },
    GetBuybackDetail: (id) => {
        return Apis.Get(`api/buyback/${id}`).then(({ data }) => data);
    },
    PostBuyback: (body) => {
        return Apis.Post(`api/buyback`, body);
    },
    PutBuybackApproval: (body) => {
        return Apis.Put(`api/update-buyback`, body);
    },
};

export default BuybackApis;
