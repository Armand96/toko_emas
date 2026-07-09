import Apis from "../utils/Apis";

// Endpoint sesuai routes/api.php (BuybackController).
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
    PostBuybackImage: (body) => {
        return Apis.Post(`api/buyback-image`, body, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
    PutBuybackApproval: (body) => {
        return Apis.Put(`api/update-buyback`, body);
    },
};

export default BuybackApis;
