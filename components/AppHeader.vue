<template>
  <v-app-bar :elevation="2" scroll-behavior="elevate">
    <template v-slot:prepend>
      <v-app-bar-nav-icon
        @click.stop="drawer = !drawer"
        class="hidden-lg-and-up"
      ></v-app-bar-nav-icon>
    </template>

    <v-app-bar-title>Name</v-app-bar-title>

    <template v-slot:append>
      <div class="hidden-sm-and-down">
        <v-menu v-for="item in items" open-on-hover>
          <template v-slot:activator="{ props }">
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
            <menu-item v-for="subItem in item.items" :item="subItem" />
          </v-list>
        </v-menu>
      </div>
      <v-divider vertical></v-divider>
      <v-btn color="primary" :icon="themeIcon" @click="toggleTheme"></v-btn>
      <AccountItem />
    </template>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawer"
    :location="$vuetify.display.xs ? 'top' : undefined"
    persistent
  >
    <v-list>
      <div v-for="item in items">
        <v-divider></v-divider>
        <v-list-item v-if="!item.items" @click="navigateTo(item.to)">
          <v-list-item-title>{{ item.title }} </v-list-item-title>
        </v-list-item>
        <v-list-subheader
          v-else
          class="text-uppercase text-caption font-weight-thin text-surface-variant"
          >{{ item.title }}</v-list-subheader
        >

        <div v-for="subItem in item.items" class="pl-2">
          <nav-item :item="subItem" />
        </div>
      </div>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
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
      { title: "Page 7", to: "/page7" },
      { title: "Page 8", to: "/page8" },
    ],
  },
  {
    title: "Menu 5",
    items: [
      { title: "Page 9", to: "/page9" },
      { title: "Page 10", to: "/page10" },
    ],
  },
  {
    title: "Menu 6",
    to: "/page11",
  },
]);

var themeIcon = computed(() =>
  theme.global.current.value.dark ? "mdi-weather-night" : "mdi-weather-sunny"
);
function toggleTheme() {
  store.theme = theme.global.current.value.dark ? "light" : "dark";
  theme.global.name.value = store.theme;
}
</script>
