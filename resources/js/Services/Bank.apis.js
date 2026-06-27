import Apis from "../utils/Apis";

const BankApis = {
     GetBankMaster: (params) => {
        return Apis.Get(`/api/banks${params}`).then(({data}) => data);
    },
    PostBankMaster: (body) => {
        return Apis.Post(`/api/banks`, body, );
    },
    PutBankMaster: (id, body) => {
        return Apis.Put(`/api/banks/${id}`, body, );
    },
    GetBankBranch: (params) => {
        return Apis.Get(`/api/bankCabangs${params}`).then(({data}) => data);
    },
    GetBankBranchSingle: (id) => {
        return Apis.Get(`/api/bankCabangs/${id}`).then(({ data }) => data?.data ?? data);
    },
    PostBankBranch: (body) => {
        return Apis.Post(`/api/bankCabangs`, body, );
    },
    PutBankBranch: (id, body) => {
        return Apis.Put(`/api/bankCabangs/${id}`, body, );
    },
     DeleteBank: (id,) => {
        return Apis.Delete(`/api/bankCabangs/${id}`,);
    }

}

export default BankApis;
