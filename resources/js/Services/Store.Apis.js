import Apis from "../utils/Apis";

const StoreApis = {
    GetSettingsStore: (params) => {
        return Apis.Get(`/api/settings-store${params}`).then(({data}) => data);
    },
    PostSettingsStore: (body) => {
        return Apis.Post(`api/settings-store`, body, { headers: { "Content-Type": "multipart/form-data" } });
    },
}

export default StoreApis;
