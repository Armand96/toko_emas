import { create } from 'zustand';
import StoreApis from '../Services/Store.apis';

const StoreSettingStore = create((set) => ({
    storeSetting: null,
    fetched: false,

    fetchStoreSetting: async () => {
        try {
            const data = await StoreApis.GetSettingsStore('');
            const setting = data?.data?.[0] || null;
            set({ storeSetting: setting, fetched: true });
        } catch {
            set({ fetched: true });
        }
    },

    setStoreSetting: (setting) => set({ storeSetting: setting }),
}));

export default StoreSettingStore;
