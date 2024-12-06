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
      <template v-for="provider in providerInfos" :key="provider.id">
        <v-btn
          :color="`rgba(${provider.color.r}, ${provider.color.g}, ${provider.color.b}, 0.25)`"
          :icon="provider.icon"
          size="small"
          @click="
            signIn(provider.id, {
              callbackUrl: route.query.callbackUrl?.toString(),
            })
          "
        >
          <template #default>
            <v-icon
              :color="`rgba(${provider.color.r}, ${provider.color.g}, ${provider.color.b}, 1)`"
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
        ><a
          class="text-primary text-body-1 text-right text-decoration-none"
          @click="$emit('switch')"
          >Sign up now <v-icon icon="mdi-chevron-right" /></a
      ></v-btn>
    </v-card-text>
    <v-card-text v-else class="text-center text-body-1">
      Already have an account ?
      <v-btn variant="plain"
        ><a
          class="text-primary text-body-1 text-right text-decoration-none"
          @click="$emit('switch')"
          >Log in <v-icon icon="mdi-chevron-left" /></a
      ></v-btn>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
// const visible = ref(false);
import * as yup from "yup";
import type ProviderInfo from "~/types";

defineProps({
  flavor: { type: String, required: true, default: "login" },
});
defineEmits(["switch"]);

const providerInfos: ProviderInfo[] = inject("providersInfos", []);

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
</script>

<style></style>
