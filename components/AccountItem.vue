<template>
  <v-menu :close-on-content-click="false" location="bottom">
    <template v-slot:activator="{ props }">
      <v-btn icon="mdi-account-circle-outline" v-bind="props"></v-btn>
    </template>
    <v-list v-if="connected">
      <v-list-item title="John Leider"> </v-list-item>
      <v-list-item>
        <v-btn prepend-icon="mdi-account-edit-outline">Edit</v-btn>
        <v-btn prepend-icon="mdi-logout">Logout</v-btn>
      </v-list-item>
    </v-list>

    <div v-else>
      <v-card
        class="mx-auto pa-8 pb-2 pt-2"
        elevation="8"
        max-width="552"
        rounded="lg"
      >
        <v-card-title class="pb-8">Log into you account</v-card-title>

        <v-text-field
          density="compact"
          label="Email address"
          placeholder="Enter your Email address"
          prepend-inner-icon="mdi-email-outline"
          variant="outlined"
          type="email"
          rounded="lg"
        ></v-text-field>

        <v-text-field
          :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
          :type="visible ? 'text' : 'password'"
          density="compact"
          placeholder="Enter your password"
          prepend-inner-icon="mdi-lock-outline"
          label="Password"
          variant="outlined"
          rounded="lg"
          @click:append-inner="visible = !visible"
        ></v-text-field>

        <div class="d-flex flex-row-reverse">
          <v-btn variant="plain" class="text-primary text-body-2 text-right"
            >Forgot password?</v-btn
          >
        </div>

        <v-btn class="mt-4" color="primary" size="large" variant="tonal" block>
          Log In
        </v-btn>

        <div class="d-flex flex-row align-center my-6">
          <v-divider class="mx-2 border-opacity-50"></v-divider>
          <div
            class="text-body-2 text-center text-surface-variant text-no-wrap"
          >
            or sign in with
          </div>
          <v-divider class="mx-2 border-opacity-50"></v-divider>
        </div>
        <div class="d-flex flex-row align-center justify-space-around">
          <v-btn color="rgba(234, 67, 53, 0.25)" icon="mdi-google" size="small">
            <template v-slot:default>
              <v-icon color="rgba(234, 67, 53, 1)"></v-icon>
            </template>
          </v-btn>
          <v-btn
            color="rgba(24, 119, 242, 0.25)"
            icon="mdi-facebook"
            size="small"
          >
            <template v-slot:default>
              <v-icon color="rgba(24, 119, 242, 1)"></v-icon>
            </template>
          </v-btn>
        </div>
        <v-card-text class="text-center text-body-1">
          Don't have an account ?
          <v-btn variant="plain" class="text-primary text-body-1 text-right"
            >Sign up now <v-icon icon="mdi-chevron-right"></v-icon
          ></v-btn>
        </v-card-text>
      </v-card>
    </div>
  </v-menu>
</template>

<script setup>
const connected = ref(false);
let visible = ref(false);
</script>
