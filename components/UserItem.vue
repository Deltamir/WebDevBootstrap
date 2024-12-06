<template>
  <v-window v-model="tab" continuous>
    <v-window-item>
      <LoginItem flavor="login" @switch="handleSwitch" />
    </v-window-item>
    <v-window-item>
      <LoginItem flavor="signup" @switch="handleSwitch" />
    </v-window-item>
  </v-window>
</template>

<script lang="ts" setup>
const tab = ref(0);

function handleSwitch() {
  tab.value = tab.value === 0 ? 1 : 0;
}
</script>
