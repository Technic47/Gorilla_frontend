<template>
  <div class="theme-switch">
    <button
      v-for="opt in options"
      :key="opt.value"
      :class="['theme-btn', { active: theme === opt.value }]"
      :title="opt.label"
      @click="setTheme(opt.value)"
    >{{ opt.icon }}</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const options = [
  { value: 'light',  icon: '☀',  label: 'Light'  },
  { value: 'dark',   icon: '☾',  label: 'Dark'   },
  { value: 'system', icon: '⊙', label: 'System' },
]

const theme = ref(localStorage.getItem('theme') || 'system')
let mq = null
let mqListener = null

function applyTheme(value) {
  const prefersDark = mq ? mq.matches : window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = value === 'dark' || (value === 'system' && prefersDark)
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
}

function setTheme(value) {
  theme.value = value
  localStorage.setItem('theme', value)
  applyTheme(value)

  if (mqListener) {
    mq.removeEventListener('change', mqListener)
    mqListener = null
  }
  if (value === 'system') {
    mqListener = () => applyTheme('system')
    mq.addEventListener('change', mqListener)
  }
}

onMounted(() => {
  mq = window.matchMedia('(prefers-color-scheme: dark)')
  applyTheme(theme.value)
  if (theme.value === 'system') {
    mqListener = () => applyTheme('system')
    mq.addEventListener('change', mqListener)
  }
})

onUnmounted(() => {
  if (mqListener) mq.removeEventListener('change', mqListener)
})
</script>

<style scoped>
.theme-switch { display: flex; gap: 4px; }

.theme-btn {
  padding: 4px 8px;
  font-size: 13px;
  line-height: 1;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: transparent;
  color: #fff;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.theme-btn:hover:not(.active) { background: rgba(255, 255, 255, 0.12); opacity: 1; }
.theme-btn.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.8);
  opacity: 1;
}
</style>
