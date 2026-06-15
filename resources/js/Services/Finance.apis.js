import Apis from "../utils/Apis";

const FinanceApis = {
    GetCategoryFinance: (params) => {
        return Apis.Get(`api/categoryFinance${params}`).then(({ data }) => data);
    },
    PostCategoryFinance: (body) => {
        return Apis.Post(`api/categoryFinance`, body);
    },
    PutCategoryFinance: (id, body) => {
        return Apis.Put(`api/categoryFinance/${id}`, body);
    },

    GetFinance: (params) => {
        return Apis.Get(`api/finances${params}`).then(({ data }) => data);
    },
    GetFinanceDetail: (id) => {
        return Apis.Get(`api/finances/${id}`).then(({ data }) => data);
    },
    PostFinance: (body) => {
        return Apis.Post(`api/finances`, body,  { headers: { "Content-Type": "multipart/form-data" } });
    },
    PutFinance: (id, body) => {
        body.append('_method', 'PUT');
        return Apis.Post(`api/finances/${id}`, body,  { headers: { "Content-Type": "multipart/form-data" } });
    },
    DeleteFinance: (id) => {
        return Apis.Delete(`api/finances/${id}`);
    },
}

export default FinanceApis;
