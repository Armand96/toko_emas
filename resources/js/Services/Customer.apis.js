import Apis from "../utils/Apis";

const CustomerApis = {
     GetCustomer: (params) => {
        return Apis.Get(`api/customers${params}`).then(({data}) => data);
    },
    PostCustomer: (body) => {
        return Apis.Post(`api/customers`, body, );
    },
    PutCustomer: (id, body) => {
        return Apis.Put(`api/customers/${id}`, body, );
    }
}

export default CustomerApis;
