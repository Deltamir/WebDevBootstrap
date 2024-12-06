// // import { defineStore } from 'pinia'

// // export const useMyProvidersStore = defineStore({
// //   id: 'myProvidersStore',
// //   state: () => ({ }),
// //   actions: {}
// // })

// interface Provider {
//   id: string;
//   name: string;
//   color: { r: number; g: number; b: number };
//   icon: string;
// }

// export const useProviderStore = defineStore("providerStore", {
//   state: () => ({
//     providersInfos: [] as Provider[],
//   }),

//   actions: {
//     async fetchProvidersInfos(force = false) {
//       if (this.providersInfos.length && !force) {
//         return;
//       }

//       this.providersInfos = [];

//       const { data: providers } = useFetch<{ name: string; id: string }[]>(
//         "/api/auth/providers"
//       );
//       const { data: providerColorIcon } = useFetch<
//         Record<
//           string,
//           { color: { r: number; g: number; b: number }; icon: string }
//         >
//       >("/api/auth/providers/infos");

//       if (providers.value) {
//         Object.entries(providers.value).forEach(([id, { name }]) => {
//           if (providerColorIcon.value && providerColorIcon.value[id]) {
//             this.providersInfos.push({
//               id,
//               name,
//               color: providerColorIcon.value[id].color,
//               icon: providerColorIcon.value[id].icon,
//             });
//           }
//         });
//       }
//     },
//   },
// });
