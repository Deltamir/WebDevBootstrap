<template>
  <v-app-bar :elevation="0" scroll-behavior="elevate" class="glass-bar">
    <template #prepend>
      <!-- Hamburger visible on md and below only; lg+ uses header nav -->
      <v-app-bar-nav-icon
        class="hidden-lg-and-up"
        @click.stop="drawer = !drawer"
      />
    </template>

    <v-app-bar-title>
      <NuxtLink to="/" class="text-decoration-none text-high-emphasis d-flex align-center ga-2">
        <span class="brand-mark">N</span>
        <span class="text-h6 font-weight-bold">Name</span>
      </NuxtLink>
    </v-app-bar-title>

    <template #append>
      <!-- Header nav visible on lg+ only; md and below use the drawer -->
      <div class="hidden-md-and-down">
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

      <v-tooltip
        :text="theme.global.current.value.dark ? 'Light mode' : 'Dark mode'"
        location="bottom"
      >
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" :icon="themeIcon" @click="toggleTheme" />
        </template>
      </v-tooltip>

      <AccountItem />
    </template>
  </v-app-bar>

  <!-- Drawer only rendered on md and below; not shown at all on lg+ -->
  <v-navigation-drawer v-if="!lgAndUp" v-model="drawer" location="left">
    <v-list nav>
      <template v-for="item in items" :key="item.title">
        <!-- Direct link item -->
        <v-list-item
          v-if="!item.items"
          :prepend-icon="item.icon"
          :title="item.title"
          :active="route.path === item.to"
          color="primary"
          @click="navigateTo(item.to)"
        />
        <!-- Collapsible group -->
        <v-list-group v-else :value="item.title">
          <template #activator="{ props: activatorProps }">
            <v-list-item
              v-bind="activatorProps"
              :prepend-icon="item.icon"
              :title="item.title"
            />
          </template>
          <nav-item
            v-for="subItem in item.items"
            :key="subItem.title"
            :item="subItem"
          />
        </v-list-group>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
const theme = useTheme();
const store = usePreferencesStore();
const { lgAndUp } = useDisplay();
const route = useRoute();

theme.global.name.value = store.theme;

// Start closed; user opens it via the hamburger on md and below
const drawer = ref(false);

// Close the drawer after any navigation
watch(
  () => route.path,
  () => {
    drawer.value = false;
  }
);

const items = useState('appHeaderItems', () => [
  {
    title: "Menu 1",
    icon: "mdi-view-dashboard-outline",
    items: [
      { title: "Page 1", to: "/page1", icon: "mdi-file-outline" },
      { title: "Page 2", to: "/page2", icon: "mdi-file-document-outline" },
      {
        title: "Sub Menu 1",
        icon: "mdi-folder-outline",
        items: [
          { title: "Sub Page 1", to: "/sub-page1", icon: "mdi-file-outline" },
          { title: "Sub Page 2", to: "/sub-page2", icon: "mdi-file-document-outline" },
          {
            title: "Sub Sub Menu 1",
            icon: "mdi-folder-open-outline",
            items: [{ title: "Sub Sub Page 1", to: "/sub-sub-page1", icon: "mdi-file-outline" }],
          },
        ],
      },
    ],
  },
  {
    title: "Menu 2",
    icon: "mdi-layers-outline",
    items: [
      { title: "Page 3", to: "/page3", icon: "mdi-file-outline" },
      { title: "Page 4", to: "/page4", icon: "mdi-file-document-outline" },
    ],
  },
  {
    title: "Menu 3",
    to: "/page5",
    icon: "mdi-link-variant",
  },
  {
    title: "Menu 4",
    icon: "mdi-wrench-outline",
    items: [
      { title: "Settings", to: "/settings", icon: "mdi-cog-outline" },
      { title: "Page 8", to: "/page8", icon: "mdi-file-outline" },
    ],
  },
  {
    title: "Menu 5",
    icon: "mdi-compass-outline",
    items: [
      { title: "Public", to: "/public", icon: "mdi-earth" },
      { title: "Login", to: "/login", icon: "mdi-login-variant" },
    ],
  },
  {
    title: "Protected",
    to: "/protected",
    icon: "mdi-shield-lock-outline",
  },
]);

const themeIcon = computed(() =>
  theme.global.current.value.dark ? "mdi-weather-night" : "mdi-weather-sunny"
);
function toggleTheme() {
  store.theme = theme.global.current.value.dark ? "light" : "dark";
  theme.global.name.value = store.theme;
}
</script>

<style scoped>
.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgb(var(--v-theme-primary));
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  flex-shrink: 0;
  letter-spacing: 0;
}
</style>
