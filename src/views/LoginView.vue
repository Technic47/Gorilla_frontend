<template>
  <div class="auth-wrap">
    <div class="lang-pos">
      <LangSwitch />
    </div>

    <div class="auth-card">
      <div class="auth-logo">{{ $t('brand') }}</div>
      <h2>{{ $t('login.title') }}</h2>

      <form @submit.prevent="submit">
        <div class="field">
          <label>{{ $t('form.username') }}</label>
          <input v-model="form.username" type="text" :placeholder="$t('form.usernamePlaceholder')" autocomplete="username" required />
        </div>
        <div class="field">
          <label>{{ $t('form.password') }}</label>
          <input v-model="form.password" type="password" :placeholder="$t('form.passwordPlaceholder')" autocomplete="current-password" required />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <button type="submit" class="btn-primary submit-btn" :disabled="loading">
          {{ loading ? $t('login.submitting') : $t('login.submit') }}
        </button>
      </form>

      <p class="auth-footer">
        {{ $t('login.noAccount') }} <router-link to="/register">{{ $t('login.registerLink') }}</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import LangSwitch from '../components/LangSwitch.vue'

const { t } = useI18n()
const auth = useAuthStore()
const form = reactive({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.username, form.password)
  } catch (e) {
    error.value = e.response?.data?.detail || t('login.errorDefault')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%);
  position: relative;
}

.lang-pos {
  position: absolute;
  top: 16px;
  right: 16px;
}

.auth-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px 36px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 8px 32px rgba(0,0,0,.18);
}

.auth-logo {
  font-size: 22px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 8px;
}

h2 { font-size: 20px; font-weight: 600; margin-bottom: 24px; color: var(--text); }

.field { margin-bottom: 16px; }
.field label { display: block; font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 6px; }

.submit-btn { width: 100%; margin-top: 8px; padding: 11px; font-size: 15px; }

.auth-footer { margin-top: 20px; text-align: center; font-size: 13px; color: var(--text-muted); }
</style>
