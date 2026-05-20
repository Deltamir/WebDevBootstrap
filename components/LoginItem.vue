<template>
  <v-card
    class="mx-auto pa-8 pb-2 pt-2"
    elevation="8"
    max-width="552"
    rounded="lg"
  >
    <v-card-title v-if="flavor === 'login'" class="pb-8"
      >Log into your account</v-card-title
    >
    <v-card-title v-else-if="flavor === 'signup'" class="pb-8"
      >Create an account</v-card-title
    >

    <!-- After the link is sent, swap the form for a confirmation block.
         Social buttons + the login/signup toggle stay available below. -->
    <div v-if="sent" class="text-center py-6">
      <v-icon
        icon="mdi-email-check-outline"
        size="56"
        color="primary"
        class="mb-3"
      />
      <div class="text-h6 mb-2">Check your inbox</div>
      <div class="text-body-2 text-medium-emphasis">
        We sent a sign-in link to <strong>{{ email.value.value }}</strong
        >. Click it to continue.
      </div>
      <v-btn
        class="mt-4"
        variant="text"
        size="small"
        prepend-icon="mdi-pencil-outline"
        @click="sent = false"
      >
        Use a different email
      </v-btn>
    </div>

    <form v-else @submit.prevent="submit">
      <!-- Sign-up needs a display name; the magic link creates the user with it. -->
      <v-text-field
        v-if="flavor === 'signup'"
        v-model="name.value.value"
        density="compact"
        label="Username"
        placeholder="Choose a username"
        prepend-inner-icon="mdi-account-outline"
        variant="outlined"
        type="text"
        rounded="lg"
        required
        :error-messages="name.errorMessage.value"
      />

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

      <!-- Surfaces a failed magic-link request (e.g. mail transport error). -->
      <v-alert
        v-if="errorMsg"
        type="error"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mb-2"
      >
        {{ errorMsg }}
      </v-alert>

      <v-btn
        class="mt-4"
        color="primary"
        size="large"
        variant="tonal"
        block
        type="submit"
        :loading="loading"
      >
        {{ flavor === "login" ? "Log In" : "Sign Up with Email" }}
      </v-btn>
    </form>

    <div class="d-flex flex-row align-center my-6">
      <v-divider class="mx-2 border-opacity-50" />
      <div
        v-if="flavor === 'login'"
        class="text-body-1 text-center text-medium-emphasis text-no-wrap"
      >
        or sign in with
      </div>
      <div
        v-else
        class="text-body-1 text-center text-medium-emphasis text-no-wrap"
      >
        or sign up with
      </div>
      <v-divider class="mx-2 border-opacity-50" />
    </div>

    <!-- Provider buttons depend on the injected `providersInfos` list; show a
         skeleton row until it has resolved. -->
    <v-skeleton-loader
      v-if="!providerInfos.length"
      type="chip@2"
      class="d-flex justify-space-around"
    />
    <div v-else class="d-flex flex-row align-center justify-space-around">
      <template v-for="provider in providerInfos" :key="provider.id">
        <v-btn
          :color="`rgba(${provider.color.r}, ${provider.color.g}, ${provider.color.b}, 0.25)`"
          :icon="provider.icon"
          size="default"
          rounded="lg"
          @click="onSocialClick(provider.id)"
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
// Login / sign-up card: a passwordless email field (Better Auth magic link)
// plus a row of social-provider buttons.
import * as yup from "yup";
import type ProviderInfo from "~/types";
import { authClient } from "~~/lib/auth-client";

const props = defineProps({
  // "login" | "signup" — always supplied by UserItem.vue; defaults defensively.
  flavor: { type: String, default: "login" },
});
defineEmits(["switch"]);

// `providersInfos` is injected from an ancestor (app.vue) and contains the
// static UI metadata (icon, brand colour, display name) for each provider.
const providerInfos: ProviderInfo[] = inject("providersInfos", []);

const route = useRoute();

// Sign-up collects a username; the magic-link verify step creates the user
// with it. Login only needs the email — same `signIn.magicLink` call serves
// both, Better Auth creates the account on first verify if it doesn't exist.
const isSignup = props.flavor === "signup";
const validationSchema: Record<string, yup.AnySchema> = {
  email: yup.string().email().required(),
};
if (isSignup) {
  validationSchema.name = yup.string().required().min(4).max(20);
}

const { handleSubmit } = useForm({ validationSchema });
const email = useField<string>("email");
const name = useField<string>("name");

const loading = ref(false);
const sent = ref(false);
const errorMsg = ref("");
// Drives the top progress bar in app.vue, mirroring the button spinner.
const indicator = useLoadingIndicator();

const submit = handleSubmit(async (values) => {
  loading.value = true;
  errorMsg.value = "";
  indicator.start();
  const { error } = await authClient.signIn.magicLink({
    email: values.email,
    // `name` is only used when the link verifies into a brand-new account.
    name: isSignup ? values.name : undefined,
    callbackURL: route.query.redirect?.toString() || "/",
  });
  loading.value = false;
  indicator.finish();
  if (error) {
    errorMsg.value =
      error.message || "Something went wrong. Please try again.";
    return;
  }
  sent.value = true;
});

// Social sign-in triggers a full-page redirect to the provider — start the
// indicator so the user gets feedback before the browser navigates away.
const onSocialClick = (providerId: string) => {
  indicator.start();
  return authClient.signIn.social({
    provider: providerId,
    callbackURL: route.query.redirect?.toString() || "/",
  });
};
</script>

<style></style>
