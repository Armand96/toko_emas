import Apis from "../utils/Apis";

const StoreApis = {
    GetSettingsStore: (params) => {
        return Apis.Get(`/api/storeSettings${params}`).then(({data}) => data);
    },
    PostSettingsStore: (body) => {
        return Apis.Post(`api/storeSettings`, body, { headers: { "Content-Type": "multipart/form-data" } });
    },
    PutSettingsStore: (id, body) => {
        return Apis.Put(`api/storeSettings/${id}`, body, );
    }
}

export default StoreApis;
