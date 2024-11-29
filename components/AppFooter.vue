<template>
  <v-footer app name="footer">
    <v-container class="text-caption">
      <v-row justify="center">
        <v-col class="text-center">
          <NuxtLink to="/terms-of-service" class="text-decoration-none"
            >Terms of Service</NuxtLink
          >
          |
          <NuxtLink to="/privacy-policy" class="text-decoration-none"
            >Privacy Policy</NuxtLink
          >
        </v-col>
      </v-row>
      <v-row justify="center" class="mt-0">
        <v-col class="text-center">
          <small
            >&copy; {{ new Date().getFullYear() }} Name. All rights
            reserved.</small
          >
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup></script>
