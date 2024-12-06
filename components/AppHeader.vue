<template>
  <v-app-bar :elevation="2" scroll-behavior="elevate">
    <template #prepend>
      <v-app-bar-nav-icon
        class="hidden-lg-and-up"
        @click.stop="drawer = !drawer"
      />
    </template>

    <v-app-bar-title
      ><NuxtLink to="/" class="text-decoration-none text-high-emphasis text-h4"
        >Name</NuxtLink
      ></v-app-bar-title
    >

    <template #append>
      <div class="hidden-sm-and-down">
        <v-menu v-for="item in items" :key="item.title" open-on-hover>
          <template #activator="{ props }">
            <v-btn
              v-if="item.items"
              v-bind="props"
              append-icon="mdi-chevron-down"
            >
              {{ item.title }}
            </v-btn>
            <v-btn v-else v-bind="props" @click="navigateTo(item.to)">
              {{ item.title }}
            </v-btn>
          </template>

          <v-list v-if="item.items">
            <menu-item
              v-for="subItem in item.items"
              :key="subItem.title"
              :item="subItem"
            />
          </v-list>
        </v-menu>
      </div>
      <v-divider vertical />
      <v-btn color="primary" :icon="themeIcon" @click="toggleTheme" />
      <AccountItem />
    </template>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawer"
    :location="$vuetify.display.xs ? 'top' : undefined"
    persistent
  >
    <v-list>
      <div v-for="item in items" :key="item.title">
        <v-divider />
        <v-list-item
          v-if="!item.items"
          @click="navigateTo(item.to)"
          :active="route.path === item.to"
          color="primary"
        >
          <v-list-item-title>{{ item.title }} </v-list-item-title>
        </v-list-item>
        <v-list-subheader
          v-else
          class="text-uppercase text-caption font-weight-thin text-surface-variant"
          >{{ item.title }}</v-list-subheader
        >

        <div v-for="subItem in item.items" :key="subItem.title" class="pl-2">
          <nav-item :item="subItem" />
        </div>
      </div>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
const theme = useTheme();
const store = usePreferencesStore();

theme.global.name.value = store.theme;

const drawer = ref(true);

const items = useState(() => [
  {
    title: "Menu 1",
    items: [
      { title: "Page 1", to: "/page1" },
      { title: "Page 2", to: "/page2" },
      {
        title: "Sub Menu 1",
        items: [
          { title: "Sub Page 1", to: "/sub-page1" },
          { title: "Sub Page 2", to: "/sub-page2" },
          {
            title: "Sub Sub Menu 1",
            items: [{ title: "Sub Sub Page 1", to: "/sub-sub-page1" }],
          },
        ],
      },
    ],
  },
  {
    title: "Menu 2",
    items: [
      { title: "Page 3", to: "/page3" },
      { title: "Page 4", to: "/page4" },
    ],
  },
  {
    title: "Menu 3",
    to: "/page5",
  },
  {
    title: "Menu 4",
    items: [
      { title: "Settings", to: "/settings" },
      { title: "Page 8", to: "/page8" },
    ],
  },
  {
    title: "Menu 5",
    items: [
      { title: "Public", to: "/public" },
      { title: "Login", to: "/login" },
    ],
  },
  {
    title: "Protected",
    to: "/protected",
  },
]);

const route = useRoute();

const themeIcon = computed(() =>
  theme.global.current.value.dark ? "mdi-weather-night" : "mdi-weather-sunny"
);
function toggleTheme() {
  store.theme = theme.global.current.value.dark ? "light" : "dark";
  theme.global.name.value = store.theme;
}
</script>
