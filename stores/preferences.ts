export interface ThemeState {
  theme: "light" | "dark";
}

export const usePreferencesStore = defineStore("preferencesStore", {
  state: () =>
    ({
      theme: "dark",
    } as ThemeState),
  actions: {},
  persist: true,
});
