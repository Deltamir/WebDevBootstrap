<template>
  <v-list-item>
    <v-btn v-if="item.items" append-icon='mdi-chevron-right'>
      <v-list-item-title>{{ item.title }}</v-list-item-title>
      <v-menu :open-on-focus="false" activator="parent" open-on-hover submenu>
        <v-list v-if="item.items">
          <menu-item v-for="subItem in item.items" :item="subItem" />
        </v-list>
      </v-menu></v-btn>
    <v-btn v-else>
      <v-list-item-title @click="navigateTo(item.to)">{{ item.title }}</v-list-item-title>
    </v-btn>
  </v-list-item>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
  },
});
</script>