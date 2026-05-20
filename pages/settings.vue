<template>
  <v-container class="settings-page py-6 py-md-10" max-width="780">
    <!-- Page header -->
    <div class="d-flex align-center ga-3 mb-8">
      <v-icon icon="mdi-cog-outline" size="26" color="primary" />
      <div>
        <h1 class="text-h5 font-weight-bold lh-tight">Settings</h1>
        <p class="text-caption text-medium-emphasis mt-n1">
          Manage your profile and account preferences
        </p>
      </div>
    </div>

    <!-- Identity card -->
    <v-card class="identity-card mb-6" rounded="xl" variant="flat">
      <v-card-text class="pa-5 pa-sm-6">
        <v-skeleton-loader
          :loading="loadingInfos"
          type="list-item-avatar-two-line"
        >
          <div class="d-flex align-center ga-4">
            <v-avatar
              v-if="userInfos?.image"
              :image="userInfos.image"
              size="72"
              class="avatar-shadow"
            />
            <v-avatar v-else size="72" color="primary" class="avatar-shadow">
              <span class="text-h5 font-weight-bold text-white">
                {{ userInfos?.name?.charAt(0)?.toUpperCase() ?? "?" }}
              </span>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ userInfos?.name }}</div>
              <div class="text-body-2 text-medium-emphasis">
                {{ userInfos?.email }}
              </div>
              <v-chip
                size="x-small"
                variant="tonal"
                color="success"
                prepend-icon="mdi-shield-check-outline"
                class="mt-2"
              >
                Active account
              </v-chip>
            </div>
          </div>
        </v-skeleton-loader>
      </v-card-text>
    </v-card>

    <!-- Settings panels -->
    <v-card rounded="xl" variant="flat">
      <v-tabs
        v-model="activeTab"
        color="primary"
        class="settings-tabs px-2 pt-1"
      >
        <v-tab value="profile" prepend-icon="mdi-account-edit-outline">
          Profile
        </v-tab>
        <v-tab value="connections" prepend-icon="mdi-link-variant">
          Connections
        </v-tab>
        <v-tab value="danger" prepend-icon="mdi-alert-outline" color="error">
          Danger Zone
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-window v-model="activeTab" class="settings-window">
        <!-- ── Profile ──────────────────────────────────────────── -->
        <v-window-item value="profile">
          <div class="pa-5 pa-sm-6">
            <p class="text-body-2 text-medium-emphasis mb-6">
              Update your avatar, display name or email address. Leave a field
              blank to keep it unchanged.
            </p>
            <!-- Skeleton covers the avatar picker + form during load / save. -->
            <v-skeleton-loader
              :loading="loadingInfos"
              type="avatar, list-item-two-line, button"
            >
              <!-- Avatar chooser: current avatar + each linked provider's. -->
              <div class="mb-6">
                <label class="text-subtitle-2 font-weight-medium d-block mb-2">
                  Profile picture
                </label>
                <div
                  v-if="avatarOptions.length"
                  class="d-flex flex-wrap ga-3"
                >
                  <v-avatar
                    v-for="url in avatarOptions"
                    :key="url"
                    :image="url"
                    size="56"
                    :class="[
                      'avatar-option',
                      { 'avatar-option--selected': url === userInfos?.image },
                    ]"
                    @click="selectAvatar(url)"
                  />
                </div>
                <div v-else class="text-caption text-medium-emphasis">
                  Link a social account to choose an avatar.
                </div>
              </div>
              <form @submit.prevent="submit">
                <div class="mb-2">
                  <label
                    class="text-subtitle-2 font-weight-medium d-block mb-2"
                  >
                    Username
                  </label>
                  <v-text-field
                    id="name"
                    v-model="name.value.value"
                    density="comfortable"
                    :placeholder="userInfos?.name"
                    hint="Between 4 and 20 characters"
                    prepend-inner-icon="mdi-account-outline"
                    variant="outlined"
                    type="text"
                    rounded="lg"
                    :error-messages="name.errorMessage.value"
                    clearable
                  />
                </div>
                <div class="mb-6">
                  <label
                    class="text-subtitle-2 font-weight-medium d-block mb-2"
                  >
                    Email address
                  </label>
                  <v-text-field
                    id="email"
                    v-model="email.value.value"
                    density="comfortable"
                    :placeholder="userInfos?.email"
                    hint="A verification link will be sent to the new address. After the change, only providers whose email matches the new one can be linked."
                    persistent-hint
                    prepend-inner-icon="mdi-email-outline"
                    variant="outlined"
                    type="email"
                    rounded="lg"
                    :error-messages="email.errorMessage.value"
                    clearable
                  />
                </div>
                <v-btn
                  color="primary"
                  type="submit"
                  :disabled="!valid"
                  :loading="loadingInfos"
                  rounded="lg"
                  prepend-icon="mdi-content-save-outline"
                >
                  Save changes
                </v-btn>
              </form>
            </v-skeleton-loader>
          </div>
        </v-window-item>

        <!-- ── Connections ─────────────────────────────────────── -->
        <v-window-item value="connections">
          <div class="pa-5 pa-sm-6">
            <p class="text-body-2 text-medium-emphasis mb-6">
              Link external accounts to sign in with additional providers.
            </p>
            <!-- Skeleton stands in for the provider rows while accounts load. -->
            <v-skeleton-loader
              v-if="loadingAccounts"
              type="list-item-avatar@2"
            />
            <div v-else class="d-flex flex-column ga-3">
              <template v-for="provider in providerInfos" :key="provider.id">
                <div
                  class="provider-row d-flex align-center ga-3 rounded-lg pa-3 pa-sm-4"
                >
                  <v-avatar
                    :color="`rgba(${provider.color.r}, ${provider.color.g}, ${provider.color.b}, 0.15)`"
                    size="44"
                    rounded="lg"
                  >
                    <v-icon
                      :icon="provider.icon"
                      :color="`rgba(${provider.color.r}, ${provider.color.g}, ${provider.color.b}, 1)`"
                      size="22"
                    />
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-subtitle-2 font-weight-semibold">
                      {{ provider.name }}
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{
                        registeredProviders?.includes(provider.id)
                          ? "Connected"
                          : "Not connected"
                      }}
                    </div>
                  </div>
                  <!-- Not linked -->
                  <v-btn
                    v-if="!registeredProviders?.includes(provider.id)"
                    size="small"
                    variant="tonal"
                    rounded="lg"
                    :loading="loadingAccounts"
                    @click="connectProvider(provider.id)"
                  >
                    Connect
                  </v-btn>
                  <!-- Linked -->
                  <div v-else class="d-flex align-center ga-2">
                    <v-chip
                      size="small"
                      color="success"
                      variant="tonal"
                      prepend-icon="mdi-check-circle-outline"
                    >
                      Linked
                    </v-chip>
                    <v-btn
                      size="small"
                      variant="text"
                      icon="mdi-link-off"
                      color="error"
                      :loading="loadingAccounts"
                      @click="toggleProviderExpand(provider.id)"
                    />
                  </div>
                </div>
                <v-expand-transition>
                  <v-alert
                    v-if="isProviderExpanded(provider.id)"
                    type="warning"
                    variant="tonal"
                    rounded="lg"
                    class="mb-1"
                  >
                    <div class="text-body-2 mb-3">
                      Unlinking <strong>{{ provider.name }}</strong> means you
                      won't be able to sign in with it anymore.
                    </div>
                    <div class="d-flex ga-2 flex-wrap">
                      <v-btn
                        size="small"
                        color="warning"
                        variant="flat"
                        prepend-icon="mdi-link-off"
                        rounded="lg"
                        :loading="loadingAccounts"
                        @click="unlink(provider.id)"
                      >
                        Unlink
                      </v-btn>
                      <v-btn
                        size="small"
                        variant="text"
                        rounded="lg"
                        @click="collapseProviderExpand(provider.id)"
                      >
                        Cancel
                      </v-btn>
                    </div>
                  </v-alert>
                </v-expand-transition>
              </template>
            </div>
          </div>
        </v-window-item>

        <!-- ── Danger Zone ─────────────────────────────────────── -->
        <v-window-item value="danger">
          <div class="pa-5 pa-sm-6">
            <v-alert
              type="error"
              variant="tonal"
              rounded="lg"
              icon="mdi-alert-circle-outline"
              class="mb-6"
            >
              <div class="text-subtitle-2 font-weight-bold mb-1">
                Irreversible actions
              </div>
              <div class="text-body-2">
                Actions on this page are permanent and cannot be undone. Proceed
                with extreme caution.
              </div>
            </v-alert>

            <v-card
              variant="outlined"
              color="error"
              rounded="xl"
              class="pa-4 pa-sm-5"
            >
              <div class="d-flex align-start ga-4">
                <v-icon
                  icon="mdi-delete-forever-outline"
                  color="error"
                  size="24"
                  class="mt-1 flex-shrink-0"
                />
                <div class="flex-grow-1">
                  <div class="text-subtitle-1 font-weight-bold mb-1">
                    Delete account
                  </div>
                  <div class="text-body-2 text-medium-emphasis mb-4">
                    Permanently delete your account, sessions, and all
                    associated data. This action is irreversible.
                  </div>
                  <v-btn
                    v-if="!expandDelete"
                    color="error"
                    variant="tonal"
                    prepend-icon="mdi-delete-forever"
                    rounded="lg"
                    @click="expandDelete = true"
                  >
                    Delete my account
                  </v-btn>
                  <v-expand-transition>
                    <form v-if="expandDelete" @submit.prevent="deleteSubmit">
                      <div class="text-body-2 mb-3">
                        Type <em>delete my account</em> in the field below to
                        confirm.
                      </div>
                      <v-text-field
                        id="delete"
                        v-model="deleteInput.value.value"
                        placeholder="delete my account"
                        variant="outlined"
                        density="compact"
                        rounded="lg"
                        class="mb-3"
                        type="text"
                        :error-messages="deleteInput.errorMessage.value"
                        clearable
                        style="max-width: 340px"
                      />
                      <div class="d-flex ga-2 flex-wrap">
                        <v-btn
                          prepend-icon="mdi-delete-forever"
                          type="submit"
                          variant="flat"
                          color="error"
                          rounded="lg"
                          :disabled="!validDelete"
                        >
                          Delete permanently
                        </v-btn>
                        <v-btn
                          variant="text"
                          rounded="lg"
                          @click="handleCancelDelete"
                        >
                          Cancel
                        </v-btn>
                      </div>
                    </form>
                  </v-expand-transition>
                </div>
              </div>
            </v-card>
          </div>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Surfaces any failed API action (see the `watch` in the script). -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="5000">
      {{ snackbarMsg }}
      <template #actions>
        <v-btn variant="text" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import * as yup from "yup";
import type ProviderInfo from "~/types";
import { authClient } from "~~/lib/auth-client";

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

const {
  data: registeredProviders,
  refresh: refreshAccounts,
  status: statusAccounts,
} = await useFetch<string[]>("/api/user/accounts", { headers });

// Avatar URLs captured from the user's linked OAuth accounts at link time.
const { data: providerAvatars } = await useFetch<
  { providerId: string; image: string }[]
>("/api/user/avatars", { headers });

// One reusable action per concern — each owns its own `loading` + `error` ref
// (see composables/useApiAction.ts). Replaces the old clicked-flag pattern.
const infosAction = useApiAction();
const accountsAction = useApiAction();
const deleteAction = useApiAction();

const loadingInfos = computed(
  () => statusInfos.value === "pending" || infosAction.loading.value,
);
const loadingAccounts = computed(
  () => statusAccounts.value === "pending" || accountsAction.loading.value,
);

const providerInfos: ProviderInfo[] = inject("providersInfos", []);

const activeTab = ref("profile");
const expandDelete = ref(false);
const providerExpands = ref<string[]>([]);

// Distinct avatar choices offered by the picker: the current avatar plus every
// linked provider's avatar, de-duplicated.
const avatarOptions = computed(() => {
  const urls = new Set<string>();
  if (userInfos.value?.image) urls.add(userInfos.value.image);
  for (const a of providerAvatars.value ?? []) urls.add(a.image);
  return [...urls];
});

const selectAvatar = async (image: string) => {
  if (image === userInfos.value?.image) return;
  const result = await infosAction.execute("/api/user/infos", {
    method: "post",
    body: { image },
  });
  if (result) await refreshInfos();
};

const { handleSubmit } = useForm({
  validationSchema: {
    email: yup
      .string()
      .email()
      .nullable()
      .notOneOf(
        [userInfos.value?.email],
        "Cannot be identical to your current email",
      ),
    name: yup
      .string()
      .nullable()
      .min(4)
      .max(20)
      .notOneOf(
        [userInfos.value?.name],
        "Cannot be identical to your current name",
      ),
  },
});

// No "required" rule here — either field can be changed independently. The
// yup schema above is nullable for both, and the `valid` computed below
// enforces that at least one is filled.
const email = useField("email");
const name = useField("name");

const submit = handleSubmit(async (values) => {
  const { name: newName, email: newEmail } = values as {
    name?: string;
    email?: string;
  };
  name.resetField();
  email.resetField();

  let infosUpdated = false;

  // Name (and other plain fields) go through our own endpoint.
  if (newName) {
    const r = await infosAction.execute("/api/user/infos", {
      method: "post",
      body: { name: newName },
    });
    if (r) infosUpdated = true;
  }

  // Email goes through Better Auth's changeEmail — it sends a verification
  // link to the new address and only updates the column on click. OAuth
  // links are unaffected (Account rows key on providerId, not email).
  if (newEmail) {
    indicator.start();
    const { error: emailErr } = await authClient.changeEmail({
      newEmail,
      callbackURL: "/settings",
    });
    indicator.finish();
    if (emailErr) {
      snackbarMsg.value =
        emailErr.message ?? "Failed to start the email change.";
      snackbarColor.value = "error";
    } else {
      snackbarMsg.value = `Verification link sent to ${newEmail}. Click it to finish the change.`;
      snackbarColor.value = "info";
    }
    snackbar.value = true;
  }

  if (infosUpdated) await refreshInfos();
});

// Top progress bar — also pulsed before the OAuth redirect (Connect button)
// since that path doesn't go through `useApiAction`. The action handlers
// (unlink, profile save, avatar select, delete) get this for free via the
// composable.
const indicator = useLoadingIndicator();

// `linkSocial` (NOT `signIn.social`) is the correct API for "I'm already
// signed in; bind this provider to my account". `signIn.social` runs an
// anonymous OAuth callback and would create a separate user when the
// provider's email differs from `User.email`. `accountLinking` in lib/auth.ts
// also rejects the link if emails don't match — that error surfaces via the
// `linkError` query param the OAuth callback redirects to (see watch below).
const connectProvider = async (id: string) => {
  indicator.start();
  const { error: linkErr } = await authClient.linkSocial({
    provider: id,
    callbackURL: "/settings",
    errorCallbackURL: "/settings?linkError=1",
  });
  // Only reached if the request fails before the OAuth redirect.
  if (linkErr) {
    indicator.finish();
    snackbarMsg.value = linkErr.message ?? "Couldn't start the link flow.";
    snackbarColor.value = "error";
    snackbar.value = true;
  }
};

const unlink = async (id: string) => {
  const result = await accountsAction.execute(`/api/user/accounts/${id}`, {
    method: "delete",
  });
  if (result) {
    await refreshAccounts();
    collapseProviderExpand(id);
  }
};

const isProviderExpanded = (id: string) => providerExpands.value.includes(id);

const toggleProviderExpand = (id: string) => {
  if (isProviderExpanded(id)) {
    collapseProviderExpand(id);
    return;
  }

  providerExpands.value = [...providerExpands.value, id];
};

const collapseProviderExpand = (id: string) => {
  providerExpands.value = providerExpands.value.filter(
    (providerId) => providerId !== id,
  );
};

// Save is enabled when at least one field is filled, the filled fields pass
// validation, and they actually differ from the current values.
const valid = computed(() => {
  const e = email.value.value;
  const n = name.value.value;
  if (!e && !n) return false;
  if (e && !email.meta.valid) return false;
  if (n && !name.meta.valid) return false;
  if (e && e === userInfos.value?.email) return false;
  if (n && n === userInfos.value?.name) return false;
  return true;
});

const { handleSubmit: handleDelete } = useForm({
  validationSchema: {
    delete: yup
      .string()
      .required()
      .nullable()
      .oneOf(["delete my account"], "Invalid input"),
  },
});
const deleteInput = useField("delete");

const deleteSubmit = handleDelete(async () => {
  const result = await deleteAction.execute("/api/user", { method: "delete" });
  if (result) {
    await authClient.signOut();
    // Hard navigation (full page load) wipes Nuxt's useFetch cache —
    // otherwise the auth middleware's cached session and the navbar's
    // cached `/api/user/infos` keep showing the just-deleted user.
    await navigateTo("/", { external: true });
  }
});

const validDelete = computed(
  () =>
    deleteInput.meta.valid &&
    deleteInput.meta.dirty &&
    deleteInput.value.value === "delete my account",
);

const handleCancelDelete = () => {
  expandDelete.value = false;
  deleteInput.resetField();
};

// Snackbar surfaces both failures (color "error") and informational notices
// like "verification email sent" (color "info"). Action errors flow in via
// the watch below; success/info messages are set inline by their handler.
const snackbar = ref(false);
const snackbarMsg = ref("");
const snackbarColor = ref<"error" | "info" | "success">("error");
watch(
  [infosAction.error, accountsAction.error, deleteAction.error],
  ([infosErr, accountsErr, deleteErr]) => {
    const msg = infosErr ?? accountsErr ?? deleteErr;
    if (msg) {
      snackbarMsg.value = msg;
      snackbarColor.value = "error";
      snackbar.value = true;
    }
  },
);

// Surface the linking failure when the OAuth callback redirects back with
// `?linkError=1` (set as `errorCallbackURL` on the link request). Better Auth
// also passes its raw `?error=...` in some configurations — handle either.
if (route.query.linkError || route.query.error) {
  snackbarMsg.value =
    "Couldn't link this provider — its email must match your account email.";
  snackbarColor.value = "error";
  snackbar.value = true;
}
</script>

<style scoped>
.settings-page {
  min-height: calc(100vh - 120px);
}

.identity-card {
  background: rgba(var(--v-theme-surface-light), 0.6) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
}

.avatar-shadow {
  box-shadow:
    0 0 0 3px rgba(var(--v-theme-primary), 0.25),
    0 4px 16px rgba(0, 0, 0, 0.15);
}

.avatar-option {
  cursor: pointer;
  transition:
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.avatar-option:hover {
  transform: scale(1.05);
}

/* Ring marks the avatar currently saved as the user's picture. */
.avatar-option--selected {
  box-shadow: 0 0 0 3px rgb(var(--v-theme-primary));
}

.settings-tabs :deep(.v-tab) {
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0;
  min-width: 100px;
}

.provider-row {
  background: rgba(var(--v-theme-on-surface), 0.03);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.06);
  transition: background 0.15s ease;
}

.provider-row:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
}
</style>
