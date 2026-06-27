import Apis from "../utils/Apis";

const SupplierApis = {
    GetSupplier: (params) => {
        return Apis.Get(`api/suppliers${params}`).then(({ data }) => data);
    },
    PostSupplier: (body) => {
        return Apis.Post(`api/suppliers`, body,);
    },
    PutSupplier: (id, body) => {
        return Apis.Put(`api/suppliers/${id}`, body,);
    }
}

export default SupplierApis;
