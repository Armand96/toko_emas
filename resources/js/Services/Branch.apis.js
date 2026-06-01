import Apis from "../utils/Apis";

const BranchApis = {
     GetBranch: (params) => {
        return Apis.Get(`api/branches${params}`).then(({data}) => data);
    },
    PostBranch: (body) => {
        return Apis.Post(`api/branches`, body, );
    },
    PutBranch: (id, body) => {
        return Apis.Put(`api/branches/${id}`, body, );
    }
}

export default BranchApis;
