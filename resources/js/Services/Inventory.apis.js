import Apis from "../utils/Apis";

const InventoryApis = {
    GetProducts: (params) => {
        return Apis.Get(`/api/products${params}`).then(({ data }) => data);
    },
    PostProducts: (body) => {
        return Apis.Post(`/api/products`, body, );
    },
    GetCategories: (params) => {
        return Apis.Get(`/api/categories${params}`).then(({ data }) => data);
    },
    PostCategories: (body) => {
        return Apis.Post(`api/categories`, body,);
    },
    PutCategories: (id, body) => {
        return Apis.Put(`api/categories/${id}`, body,);
    },
    PutProducts: (id, body) => {
        return Apis.Put(`api/products/${id}`, body, );
    },
      GetPembelian: (params) => {
        return Apis.Get(`api/pembelian${params}`).then(({ data }) => data);
    },
      PostPembelian: (body) => {
        return Apis.Post(`api/pembelian`, body,);
    },
     updatePembelian: ( body) => {
        return Apis.Post(`api/update-pembelian`, body, );
    },
    PostPembelianImage: (body) => {
        return Apis.Post(`api/pembelian-image`, body, {
            headers: { "Content-Type": "multipart/form-data" },
        });
    },
}

export default InventoryApis;
