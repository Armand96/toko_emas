import Apis from "../utils/Apis";

const InventoryApis = {
    GetProducts: (params) => {
        return Apis.Get(`/api/products${params}`).then(({ data }) => data);
    },
    PostProducts: (body) => {
        return Apis.Post(`/api/products`, body, { headers: { "Content-Type": "multipart/form-data" } });
    },
    GetCategories: (params) => {
        return Apis.Get(`/api/categories${params}`).then(({ data }) => data);
    },
    PostCategories: (body) => {
        return Apis.Post(`api/categories`, body, { headers: { "Content-Type": "multipart/form-data" } });
    },
}

export default InventoryApis;
