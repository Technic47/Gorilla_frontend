<template>
  <div class="auth-wrap">
    <div class="lang-pos">
      <ThemeSwitch />
      <LangSwitch />
    </div>

    <div class="auth-card">
      <div class="auth-logo">{{ $t('brand') }}</div>
      <h2>{{ $t('register.title') }}</h2>

      <form @submit.prevent="submit">
        <div class="field">
          <label>{{ $t('form.username') }}</label>
          <input v-model="form.username" type="text" :placeholder="$t('form.newUsernamePlaceholder')" autocomplete="username" required minlength="3" />
        </div>
        <div class="field">
          <label>{{ $t('form.password') }}</label>
          <input v-model="form.password" type="password" :placeholder="$t('form.newPasswordPlaceholder')" autocomplete="new-password" required minlength="6" />
        </div>
        <div class="field">
          <label>{{ $t('register.confirmPassword') }}</label>
          <input v-model="form.confirm" type="password" :placeholder="$t('register.repeatPlaceholder')" autocomplete="new-password" required />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="success" class="success-msg">{{ $t('register.created') }} <router-link to="/login">{{ $t('register.signInLink') }}</router-link></p>

        <button type="submit" class="btn-primary submit-btn" :disabled="loading || !!success">
          {{ loading ? $t('register.submitting') : $t('register.submit') }}
        </button>
      </form>

      <p class="auth-footer">
        {{ $t('register.haveAccount') }} <router-link to="/login">{{ $t('register.signInLink') }}</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import LangSwitch from '../components/LangSwitch.vue'
import ThemeSwitch from '../components/ThemeSwitch.vue'

const { t } = useI18n()
const auth = useAuthStore()
const form = reactive({ username: '', password: '', confirm: '' })
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function submit() {
  error.value = ''
  if (form.password !== form.confirm) { error.value = t('register.passwordMismatch'); return }

  loading.value = true
  try {
    await auth.register(form.username, form.password)
    success.value = true
  } catch (e) {
    error.value = e.response?.data?.detail || t('register.errorDefault')
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

.auth-logo { font-size: 22px; font-weight: 700; color: var(--primary); margin-bottom: 8px; }
h2 { font-size: 20px; font-weight: 600; margin-bottom: 24px; }

.field { margin-bottom: 16px; }
.field label { display: block; font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 6px; }

.submit-btn { width: 100%; margin-top: 8px; padding: 11px; font-size: 15px; }

.success-msg { color: #2e7d32; font-size: 13px; margin-top: 6px; }
.auth-footer  { margin-top: 20px; text-align: center; font-size: 13px; color: var(--text-muted); }
</style>
