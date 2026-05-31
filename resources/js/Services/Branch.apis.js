import Apis from "../utils/Apis";

const BranchApis = {
     GetBranch: (params) => {
        return Apis.Get(`api/branches${params}`).then(({data}) => data);
    },
    PostBranch: (body) => {
        return Apis.Post(`api/branches`, body, { headers: { "Content-Type": "multipart/form-data" } });
    },
}

export default BranchApis;
