<template>
  <div class="auth-layout">
    <!-- Left branding panel — visible lg+ only -->
    <div class="auth-brand hidden-md-and-down">
      <div class="auth-brand__decor-top" />
      <div class="auth-brand__decor-bottom" />
      <div class="auth-brand__content">
        <NuxtLink to="/" class="text-decoration-none">
          <div class="text-h3 font-weight-bold text-white">Name</div>
        </NuxtLink>
        <p class="text-white mt-3" style="opacity: 0.7; max-width: 260px">
          Your modern app template — ready to bootstrap your next project.
        </p>
      </div>
    </div>

    <!-- Right form panel -->
    <div class="auth-form">
      <!-- Inline logo for mobile/tablet -->
      <div class="hidden-lg-and-up mb-8">
        <NuxtLink to="/" class="text-decoration-none text-high-emphasis text-h5 font-weight-bold">
          Name
        </NuxtLink>
      </div>

      <slot />

      <div class="text-caption text-medium-emphasis text-center mt-8">
        <NuxtLink to="/terms-of-service" class="text-medium-emphasis text-decoration-none">Terms of Service</NuxtLink>
        &nbsp;·&nbsp;
        <NuxtLink to="/privacy-policy" class="text-medium-emphasis text-decoration-none">Privacy Policy</NuxtLink>
        <div class="mt-1">© {{ new Date().getFullYear() }} Name</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  display: flex;
  min-height: 100dvh;
  background: rgb(var(--v-theme-background));
}

/* ─── Left branding panel ─────────────────────────────────────────────────── */

.auth-brand {
  width: 42%;
  flex-shrink: 0;
  min-height: 100dvh;
  background: linear-gradient(
    145deg,
    rgb(var(--v-theme-primary)) 0%,
    rgb(var(--v-theme-secondary)) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

/* Decorative blobs */
.auth-brand__decor-top {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.07);
  top: -100px;
  right: -100px;
  pointer-events: none;
}

.auth-brand__decor-bottom {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  bottom: -60px;
  left: -60px;
  pointer-events: none;
}

.auth-brand__content {
  position: relative;
  z-index: 1;
  padding: 2rem;
}

/* ─── Right form panel ────────────────────────────────────────────────────── */

.auth-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 100dvh;
  background: rgb(var(--v-theme-surface));
}
</style>
