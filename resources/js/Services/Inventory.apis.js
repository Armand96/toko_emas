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
    PutCategories: (id, body) => {
        return Apis.Put(`api/categories/${id}`, body, { headers: { "Content-Type": "multipart/form-data" } });
    },
    PutProducts: (id, body) => {
        return Apis.Put(`api/products/${id}`, body, { headers: { "Content-Type": "multipart/form-data" } });
    }
}

export default InventoryApis;
