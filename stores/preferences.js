export const usePreferencesStore = defineStore({
  id: "preferencesStore",
  state: () => ({
    theme: "dark",
  }),
  actions: {},
  persist: true,
});
