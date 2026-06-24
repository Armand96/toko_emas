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
      // detail 1 pembelian (dibungkus ApiResponse::success → unwrap .data)
      GetPembelianSingle: (id) => {
        return Apis.Get(`api/pembelian/${id}`).then(({ data }) => data?.data ?? data);
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
    GetInventory: (params) => {
        return Apis.Get(`api/inventory${params}`).then(({ data }) => data);
    },
    GetInventorySingle: (id) => {
        return Apis.Get(`api/inventory/${id}`).then(({ data }) => data);
    },
    PutInventory: (id, body) => {
        return Apis.Put(`api/inventory/${id}`, body);
    },
    GetRemoveItem: (params) => {
        return Apis.Get(`api/remove-item${params}`).then(({ data }) => data);
    },
    GetRemoveItemSingle: (id) => {
        return Apis.Get(`api/remove-item/${id}`).then(({ data }) => data);
    },
    PostRemoveItem: (body) => {
        return Apis.Post(`api/remove-item`, body);
    },
    UpdateRemoveItem: (body) => {
        return Apis.Put(`api/update-remove-item`, body);
    },
    GetTransferItem: (params) => {
        return Apis.Get(`api/transfer-item${params}`).then(({ data }) => data);
    },
    GetTransferItemSingle: (id) => {
        return Apis.Get(`api/transfer-item/${id}`).then(({ data }) => data);
    },
    PostTransferItem: (body) => {
        return Apis.Post(`api/transfer-item`, body);
    },
    UpdateTransferItem: (body) => {
        return Apis.Put(`api/update-transfer-item`, body);
    },
    GetStockOpname: (params) => {
        return Apis.Get(`api/stock-opname${params}`).then(({ data }) => data);
    },
    GetStockOpnameSingle: (id) => {
        return Apis.Get(`api/stock-opname/${id}`).then(({ data }) => data);
    },
    PostStockOpname: (body) => {
        return Apis.Post(`api/stock-opname`, body);
    },
}

export default InventoryApis;
