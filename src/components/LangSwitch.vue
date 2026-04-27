<template>
  <div class="lang-switch">
    <button
      v-for="lang in langs"
      :key="lang"
      :class="['lang-btn', { active: locale === lang }]"
      @click="setLang(lang)"
    >
      {{ lang.toUpperCase() }}
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const langs = ['en', 'ru']

function setLang(lang) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<style scoped>
.lang-switch { display: flex; gap: 4px; }

.lang-btn {
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.lang-btn:hover:not(.active) { background: rgba(255, 255, 255, 0.12); opacity: 1; }
.lang-btn.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.8);
  opacity: 1;
}
</style>
