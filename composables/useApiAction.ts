// Reusable wrapper for one-shot, user-triggered API calls (form submits,
// deletes, …). Replaces the repeated `useFetch` + manual `clicked` flag +
// `watchEffect` block previously copy-pasted across pages/settings.vue.
//
// `useFetch` is designed for setup-time data loading, not event handlers — this
// composable uses `$fetch` instead and adds the error handling those handlers
// were missing.
//
// Usage:
//   const action = useApiAction();
//   const result = await action.execute("/api/user/infos", { method: "post", body });
//   if (result) await refresh();   // null === the call failed
//   // `action.loading` drives :loading / skeletons, `action.error` the message

// Minimal request-options surface. We deliberately don't reuse `$fetch`'s own
// option type: its route-aware generics explode into "excessive stack depth"
// when the URL is a plain runtime string.
interface ApiActionOptions {
  method?: "get" | "post" | "put" | "patch" | "delete";
  body?: unknown;
}

// `$fetch` re-typed as a plain function for the same reason — bypasses the
// per-route response-type inference we don't need here.
const rawFetch = $fetch as unknown as (
  url: string,
  options?: ApiActionOptions,
) => Promise<unknown>;

export function useApiAction() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  // Drives the top progress bar (`<NuxtLoadingIndicator>` in app.vue) so every
  // user-triggered API action gets visible page-level feedback "for free".
  const indicator = useLoadingIndicator();

  async function execute<T>(
    url: string,
    options?: ApiActionOptions,
  ): Promise<T | null> {
    loading.value = true;
    error.value = null;
    indicator.start();
    try {
      return (await rawFetch(url, options)) as T;
    } catch (e) {
      // Nitro errors expose `statusMessage`; fall back to the generic message.
      error.value =
        (e as { statusMessage?: string })?.statusMessage ??
        (e as Error)?.message ??
        "Something went wrong. Please try again.";
      return null;
    } finally {
      loading.value = false;
      indicator.finish();
    }
  }

  return { loading, error, execute };
}
