<template>
  <div
    class="d-flex flex-row flex-wrap align-self-auto justify-space-around ga-4"
  >
    <v-card class="px-8 py-6 rounded-lg flex-grow-1">
      <v-card-title class="pb-10">Personnal Informations</v-card-title>
      <div class="text-center d-flex flex-row align-center">
        <v-skeleton-loader
          :loading="loadingInfos"
          type="list-item-avatar-two-line"
          class="flex-grow-1"
        >
          <v-avatar :image="userInfos?.image" size="80" />
          <div class="d-flex flex-column align-start">
            <v-list-item-title class="pl-4 text-no-wrap">
              {{ userInfos?.name }}
            </v-list-item-title>
            <v-list-item-subtitle class="pl-4">
              {{ userInfos?.email }}
            </v-list-item-subtitle>
          </div>
        </v-skeleton-loader>
      </div>
      <div class="pt-8">
        <form @submit.prevent="submit">
          <span>Username</span>
          <v-text-field
            id="name"
            v-model="name.value.value"
            class="pt-2"
            density="comfortable"
            :placeholder="userInfos?.name"
            hint="Change your name"
            prepend-inner-icon="mdi-account-outline"
            variant="outlined"
            type="text"
            rounded="lg"
            :error-messages="name.errorMessage.value"
            clearable
          />
          <span>Email</span>
          <v-text-field
            id="email"
            v-model="email.value.value"
            class="pt-2"
            density="comfortable"
            :placeholder="userInfos?.email"
            hint="Change your email adress"
            prepend-inner-icon="mdi-email-outline"
            variant="outlined"
            type="email"
            rounded="lg"
            :error-messages="email.errorMessage.value"
            clearable
          />
          <v-btn
            class="mt-4"
            color="primary"
            type="submit"
            :disabled="!valid"
            :loading="loadingInfos"
          >
            Save
          </v-btn>
        </form>
      </div>
    </v-card>
    <v-card class="px-8 py-6 rounded-lg flex-grow-1">
      <v-card-title class="pb-10">Linking Accounts</v-card-title>
      <div class="d-flex flex-column flex-wrap ga-4">
        <template v-for="provider in providers" :key="provider.id">
          <div class="d-flex flex-row align-center ga-2">
            <v-btn
              :color="`rgba(${providerInfos[provider.id].color.r}, ${
                providerInfos[provider.id].color.g
              }, ${providerInfos[provider.id].color.b}, 0.25)`"
              :prepend-icon="providerInfos[provider.id].icon"
              :disabled="registeredProviders?.includes(provider.id)"
              class="flex-grow-1"
              :loading="loadingAccounts"
              @click="
                signIn(provider.id, {
                  callbackUrl: route.query.callbackUrl?.toString(),
                })
              "
            >
              <template #prepend>
                <v-icon
                  :color="`rgba(${providerInfos[provider.id].color.r}, ${
                    providerInfos[provider.id].color.g
                  }, ${providerInfos[provider.id].color.b}, 1)`"
                />
              </template>
              <template
                v-if="!registeredProviders?.includes(provider.id)"
                #default
              >
                Link with {{ provider.name }} Account
              </template>
              <template v-else #default>
                {{ provider.name }} Account Linked
              </template>
            </v-btn>
            <v-tooltip
              v-if="registeredProviders?.includes(provider.id)"
              activator="parent"
              location="end"
              text="Unlink"
            >
              <template #activator="{ props }">
                <v-btn
                  icon="mdi-link-off"
                  v-bind="props"
                  @click="
                    providerExpands[provider.id] = !providerExpands[provider.id]
                  "
                />
              </template>
            </v-tooltip>
          </div>
          <v-expand-transition v-show="providerExpands[provider.id]">
            <v-card max-width="280" class="align-self-end">
              <v-alert
                class="text-wrap"
                type="warning"
                color="orange-lighten-2"
              >
                Are you sure ? You won't be able to login with this account
                anymore.
                <v-card-actions>
                  <v-spacer />
                  <v-btn
                    prepend-icon="mdi-close-octagon"
                    :loading="loadingAccounts"
                    @click="unlink(provider.id)"
                  >
                    Unlink
                  </v-btn>
                  <v-btn @click="providerExpands[provider.id] = false">
                    Cancel
                  </v-btn>
                </v-card-actions>
              </v-alert>
            </v-card>
          </v-expand-transition>
        </template>
      </div>
    </v-card>
    <v-card class="px-8 py-6 rounded-lg flex-grow-1 d-flex flex-column">
      <v-card-title class="pb-10">Delete my account</v-card-title>
      <v-btn
        color="red-lighten-2"
        prepend-icon="mdi-close-octagon"
        @click="expandDelete = !expandDelete"
      >
        <template #default> Delete account and user data </template>
      </v-btn>
      <v-expand-transition v-show="expandDelete">
        <v-card max-width="280" class="align-self-center mt-2">
          <form @submit.prevent="deleteSubmit">
            <v-alert
              class="text-wrap"
              type="warning"
              color="warning"
              variant="outlined"
            >
              <h4>
                Are you sure ? You won't ever be able to recover your account or
                any of your data. This action is irreversible.
              </h4>
              <div class="text-subtitle-2 mt-2">
                If you want to proceed, please enter <i>delete my account</i> in
                the field below.
              </div>

              <v-text-field
                id="delete"
                v-model="deleteInput.value.value"
                placeholder="delete my account"
                variant="outlined"
                density="compact"
                rounded="lg"
                class="mt-2"
                type="text"
                :error-messages="deleteInput.errorMessage.value"
                clearable
              />

              <v-card-actions>
                <v-spacer />
                <v-btn
                  prepend-icon="mdi-delete-forever"
                  type="submit"
                  variant="tonal"
                  color="red"
                  :disabled="!validDelete"
                >
                  Delete
                </v-btn>
                <v-btn @click="handleCancelDelete"> Cancel </v-btn>
              </v-card-actions>
            </v-alert>
          </form>
        </v-card>
      </v-expand-transition>
    </v-card>
  </div>
</template>

<script lang="ts" setup>
import * as yup from "yup";

const { signIn, signOut } = useAuth();
const route = useRoute();
// eslint-disable-next-line no-undef
const headers = useRequestHeaders(["cookie"]) as HeadersInit;
const {
  data: userInfos,
  refresh: refreshInfos,
  status: statusInfos,
} = await useFetch<{
  name: string;
  email: string;
  image: string;
}>("/api/user/infos", { headers });

const { data: providers } = await useFetch<{ name: string; id: string }[]>(
  "/api/auth/providers"
);
const {
  data: registeredProviders,
  refresh: refreshAccounts,
  status: statusAccounts,
} = await useFetch<string[]>("/api/user/accounts");

const clickedInfos = ref(false);
const clickedAccounts = ref(false);
const loadingInfos = computed(
  () => statusInfos.value === "pending" || clickedInfos.value
);
const loadingAccounts = computed(
  () => statusAccounts.value === "pending" || clickedAccounts.value
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

const expandDelete = ref(false);
const providerExpands: Ref<Record<string, boolean>> = ref({
  github: false,
  facebook: false,
  twitch: false,
  google: false,
});

const { handleSubmit } = await useForm({
  validationSchema: {
    email: yup
      .string()
      .email()
      .nullable()
      .notOneOf(
        [userInfos.value?.email],
        "Cannot be identical to your current email"
      ),
    name: yup
      .string()
      .nullable()
      .min(4)
      .max(20)
      .notOneOf(
        [userInfos.value?.name],
        "Cannot be identical to your current name"
      ),
  },
});

const email = useField("email");
const name = useField("name", (value) => !!value);

const submit = await handleSubmit((values) => {
  clickedInfos.value = true;
  name.resetField();
  email.resetField();
  const { status } = useFetch("/api/user/infos", {
    method: "post",
    body: JSON.stringify(values, null, 2),
  });
  watchEffect(() => {
    clickedInfos.value = false;
    if (status.value === "success") {
      refreshInfos();
    }
  });
});

const unlink = (id: string) => {
  clickedAccounts.value = true;
  const { status } = useFetch(`/api/user/accounts/${id}`, { method: "delete" });
  watchEffect(() => {
    if (status.value === "success") {
      clickedAccounts.value = false;
      refreshAccounts();
      providerExpands.value[id] = false;
    }
  });
};

const valid = computed(
  () =>
    email.meta.valid &&
    name.meta.valid &&
    (email.meta.dirty || name.meta.dirty) &&
    ((email.value.value ? true : false) || (name.value.value ? true : false)) &&
    email.value.value !== userInfos.value?.email &&
    name.value.value !== userInfos.value?.name
);

const { handleSubmit: handleDelete } = await useForm({
  validationSchema: {
    delete: yup
      .string()
      .required()
      .nullable()
      .oneOf(["delete my account"], "Invalid input"),
  },
});
const deleteInput = useField("delete");

const deleteSubmit = await handleDelete(() => {
  const { status } = useFetch("/api/user", { method: "delete" });
  watchEffect(() => {
    if (status.value === "success") {
      signOut();
    }
  });
});

const validDelete = computed(
  () =>
    deleteInput.meta.valid &&
    deleteInput.meta.dirty &&
    deleteInput.value.value === "delete my account"
);

const handleCancelDelete = () => {
  expandDelete.value = false;
  deleteInput.resetField();
  expandDelete.value = false;
};
</script>
