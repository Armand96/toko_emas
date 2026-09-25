import Apis from "../utils/Apis";

const HargaSettingApis = {
    GetHargaSetting: () => {
        return Apis.Get(`/api/harga-setting`).then(({ data }) => data?.data ?? data);
    },
    PostBulkHarga: (body) => {
        return Apis.Post(`/api/harga-setting/bulk`, body);
    },
};

export default HargaSettingApis;
