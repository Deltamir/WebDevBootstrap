<template>
  <v-card
    class="mx-auto pa-8 pb-2 pt-2"
    elevation="8"
    max-width="552"
    rounded="lg"
  >
    <v-card-title v-if="flavor === 'login'" class="pb-8"
      >Log into you account</v-card-title
    >
    <v-card-title v-else-if="flavor === 'signup'" class="pb-8"
      >Sign up !</v-card-title
    >
    <form @submit.prevent="submit">
      <v-text-field
        v-model="email.value.value"
        density="compact"
        label="Email address"
        placeholder="Enter your Email address"
        prepend-inner-icon="mdi-email-outline"
        variant="outlined"
        type="email"
        rounded="lg"
        required
        :error-messages="email.errorMessage.value"
      />

      <!-- <v-text-field
      :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye'"
      :type="visible ? 'text' : 'password'"
      density="compact"
      placeholder="Enter your password"
      prepend-inner-icon="mdi-lock-outline"
      label="Password"
      variant="outlined"
      rounded="lg"
      @click:append-inner="visible = !visible"
    /> -->

      <!-- <div class="d-flex flex-row-reverse">
      <v-btn variant="plain" class="text-primary text-body-2 text-right"
        >Forgot password?</v-btn
      >
    </div> -->

      <v-btn
        v-if="flavor === 'login'"
        class="mt-4"
        color="primary"
        size="large"
        variant="tonal"
        block
        type="submit"
      >
        Log In
      </v-btn>

      <v-btn
        v-else-if="flavor === 'signup'"
        class="mt-4"
        color="primary"
        size="large"
        variant="tonal"
        block
        type="submit"
      >
        Sign Up with Email
      </v-btn>
    </form>

    <div class="d-flex flex-row align-center my-6">
      <v-divider class="mx-2 border-opacity-50" />
      <div
        v-if="flavor === 'login'"
        class="text-body-1 text-center text-surface-variant text-no-wrap"
      >
        or sign in with
      </div>
      <div
        v-else
        class="text-body-1 text-center text-surface-variant text-no-wrap"
      >
        or sign up with
      </div>
      <v-divider class="mx-2 border-opacity-50" />
    </div>
    <div class="d-flex flex-row align-center justify-space-around">
      <template v-for="provider in providers" :key="provider.id">
        <v-btn
          :color="`rgba(${providerInfos[provider.id].color.r}, ${
            providerInfos[provider.id].color.g
          }, ${providerInfos[provider.id].color.b}, 0.25)`"
          :icon="providerInfos[provider.id].icon"
          size="small"
          @click="
            signIn(provider.id, {
              callbackUrl: route.query.callbackUrl?.toString(),
            })
          "
        >
          <template #default>
            <v-icon
              :color="`rgba(${providerInfos[provider.id].color.r}, ${
                providerInfos[provider.id].color.g
              }, ${providerInfos[provider.id].color.b}, 1)`"
            />
            <v-tooltip activator="parent" location="left">{{
              provider.name
            }}</v-tooltip>
          </template>
        </v-btn>
      </template>
    </div>
    <v-card-text v-if="flavor === 'login'" class="text-center text-body-1">
      Don't have an account ?
      <v-btn variant="plain"
        ><nuxt-link
          to="/signup"
          class="text-primary text-body-1 text-right text-decoration-none"
          >Sign up now <v-icon icon="mdi-chevron-right" /></nuxt-link
      ></v-btn>
    </v-card-text>
    <v-card-text v-else class="text-center text-body-1">
      Already have an account ?
      <v-btn variant="plain"
        ><nuxt-link
          to="/login"
          class="text-primary text-body-1 text-right text-decoration-none"
          >Log in <v-icon icon="mdi-chevron-right" /></nuxt-link
      ></v-btn>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
// const visible = ref(false);
import * as yup from "yup";
const { signIn } = useAuth();
const route = useRoute();

const { handleSubmit } = useForm({
  validationSchema: {
    email: yup.string().email().required(),
  },
});
const email = useField("email");

const submit = handleSubmit((values) => {
  alert(JSON.stringify(values, null, 2));
});

defineProps({
  flavor: { type: String, required: true, default: "login" },
});

const { data: providers } = await useFetch<{ name: string; id: string }[]>(
  "/api/auth/providers"
);

const providerInfos: Record<
  string,
  { color: { r: number; g: number; b: number }; icon: string }
> = {
  github: { color: { r: 47, g: 79, b: 79 }, icon: "mdi-github" },
  facebook: { color: { r: 24, g: 119, b: 242 }, icon: "mdi-facebook" },
  twitch: { color: { r: 100, g: 65, b: 165 }, icon: "mdi-twitch" },
  google: { color: { r: 24, g: 119, b: 242 }, icon: "mdi-google" },
};
</script>

<style></style>
