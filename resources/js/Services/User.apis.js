import Apis from "../utils/Apis";

const UsersStore = {
    GetUser: (params) => {
        return Apis.Get(`api/users${params}`).then(({data}) => data);
    },
    GetRole: (params) => {
        return Apis.Get(`/api/roles${params}`).then(({data}) => data);
    },
    GetProfile: (params) => {
        return Apis.Get(`/api/profile${params}`).then(({data}) => data);
    },
    PostUser: (body) => {
        return Apis.Post(`api/users`, body, { headers: { "Content-Type": "multipart/form-data" } });
    },
    PutUser: (id, body) => {
        return Apis.Put(`api/users/${id}`, body, );
    }
}

export default UsersStore;
