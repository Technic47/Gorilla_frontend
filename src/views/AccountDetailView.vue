<template>
  <div class="layout">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <header class="topbar">
      <span class="topbar-brand">{{ $t('brand') }}</span>
      <div class="topbar-right">
        <LangSwitch />
        <button class="btn-secondary logout-btn" @click="auth.logout()">{{ $t('accounts.signOut') }}</button>
      </div>
    </header>

    <!-- ── Content ─────────────────────────────────────────────────────────── -->
    <div class="content">
      <div class="page-header">
        <button class="btn-secondary back-btn" @click="router.back()">{{ $t('detail.back') }}</button>
        <h1 class="page-title">{{ $t('detail.title') }}</h1>
        <button v-if="account" class="btn-secondary" @click="openUpdateModal">
          {{ $t('detail.update.button') }}
        </button>
        <button v-if="account" class="btn-primary pay-btn" @click="openModal">
          {{ $t('detail.updatePayment') }}
        </button>
        <button
          v-if="account"
          :class="account.isBlocked ? 'btn-unblock' : 'btn-danger'"
          :disabled="blockLoading"
          @click="toggleBlock"
        >
          {{ blockLoading ? '…' : (account.isBlocked ? $t('detail.unblock') : $t('detail.block')) }}
        </button>
      </div>
      <p v-if="blockError" class="error-msg block-error">{{ blockError }}</p>

      <div v-if="loading" class="state-msg">{{ $t('accounts.loading') }}</div>
      <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>
      <div v-else-if="!account" class="state-msg">{{ $t('detail.notFound') }}</div>

      <template v-else>
        <!-- ── Personal info card ─────────────────────────────────────────── -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">{{ $t('detail.personalInfo') }}</h2>
            <img
              v-if="account.avatar?.objectKey"
              :src="`/storage/avatars/${account.avatar.objectKey}`"
              class="account-avatar"
              alt="avatar"
              @click="lightboxUrl = `/storage/avatars/${account.avatar.objectKey}`"
            />
          </div>
          <div class="info-grid">
            <div class="info-item" v-for="field in infoFields" :key="field.key">
              <span class="info-label">{{ field.label }}</span>
              <span class="info-value" :class="{ 'badge-blocked': field.key === 'isBlocked' && account.isBlocked }">
                {{ formatField(account[field.key], field.key) }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Warnings card ──────────────────────────────────────────────── -->
        <div class="card">
          <h2 class="card-title">{{ $t('detail.warnings') }}</h2>

          <p v-if="!account.warnings || account.warnings.length === 0" class="no-warn">
            {{ $t('detail.noWarnings') }}
          </p>

          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ $t('detail.warnCol.level') }}</th>
                  <th>{{ $t('detail.warnCol.message') }}</th>
                  <th>{{ $t('detail.warnCol.type') }}</th>
                  <th>{{ $t('detail.warnCol.created') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(w, i) in account.warnings" :key="i">
                  <td><span :class="['level-badge', levelClass(w.level)]">{{ w.level }}</span></td>
                  <td>{{ w.message ?? '—' }}</td>
                  <td>{{ w.type ?? '—' }}</td>
                  <td>{{ w.created ? formatDate(w.created) : '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- ── Edit account modal ────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="updateModalOpen" class="modal-overlay" @click.self="closeUpdateModal">
      <div class="modal">
        <h3 class="modal-title">{{ $t('detail.update.title') }}</h3>

        <div class="field">
          <label>{{ $t('accounts.col.firstName') }}</label>
          <input v-model="updateForm.firstName" type="text" required />
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.secondName') }}</label>
          <input v-model="updateForm.secondName" type="text" />
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.lastName') }}</label>
          <input v-model="updateForm.lastName" type="text" required />
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.cardNumber') }}</label>
          <input v-model="updateForm.cardNumber" type="text" required />
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.paidUntil') }}</label>
          <input v-model="updateForm.paidUntil" type="date" />
        </div>
        <div class="field field-checkbox">
          <label>
            <input v-model="updateForm.isBlocked" type="checkbox" />
            {{ $t('accounts.col.isBlocked') }}
          </label>
        </div>

        <p v-if="updateError" class="error-msg">{{ updateError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" :disabled="updateLoading" @click="closeUpdateModal">
            {{ $t('detail.update.cancel') }}
          </button>
          <button class="btn-primary" :disabled="updateLoading || !updateFormValid" @click="submitUpdate">
            {{ updateLoading ? '…' : $t('detail.update.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Payment modal ──────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3 class="modal-title">{{ $t('detail.modal.title') }}</h3>

        <div class="field">
          <label>{{ $t('detail.modal.paidUntil') }}</label>
          <input type="date" v-model="modalDate" />
        </div>

        <div class="presets">
          <button type="button" class="btn-preset" @click="applyPreset(1)">{{ $t('detail.modal.month1') }}</button>
          <button type="button" class="btn-preset" @click="applyPreset(3)">{{ $t('detail.modal.month3') }}</button>
          <button type="button" class="btn-preset" @click="applyPreset(6)">{{ $t('detail.modal.halfYear') }}</button>
          <button type="button" class="btn-preset" @click="applyPreset(12)">{{ $t('detail.modal.year1') }}</button>
        </div>

        <p v-if="modalError" class="error-msg">{{ modalError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" :disabled="modalLoading" @click="closeModal">
            {{ $t('detail.modal.cancel') }}
          </button>
          <button class="btn-primary" :disabled="modalLoading || !modalDate" @click="submitPayment">
            {{ modalLoading ? '…' : $t('detail.modal.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Avatar lightbox ───────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="lightboxUrl" class="lightbox" @click="lightboxUrl = ''" @keydown.esc="lightboxUrl = ''">
      <img :src="lightboxUrl" class="lightbox-img" alt="avatar" @click.stop/>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import LangSwitch from '../components/LangSwitch.vue'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()
const auth   = useAuthStore()

const lightboxUrl  = ref('')
const account      = ref(null)
const loading      = ref(false)
const error        = ref('')

const modalOpen    = ref(false)
const modalDate    = ref('')
const modalLoading = ref(false)
const modalError   = ref('')

const blockLoading = ref(false)
const blockError   = ref('')

const updateModalOpen = ref(false)
const updateLoading   = ref(false)
const updateError     = ref('')
const updateForm      = reactive({ firstName: '', secondName: '', lastName: '', cardNumber: '', paidUntil: '', isBlocked: false })
const updateFormValid = computed(() => updateForm.firstName.trim() && updateForm.lastName.trim() && updateForm.cardNumber.trim())

// ── Field definitions ─────────────────────────────────────────────────────────
const infoFields = computed(() => [
  { key: 'firstName',  label: t('accounts.col.firstName') },
  { key: 'secondName', label: t('accounts.col.secondName') },
  { key: 'lastName',   label: t('accounts.col.lastName') },
  { key: 'id',         label: t('accounts.col.id') },
  { key: 'cardNumber', label: t('accounts.col.cardNumber') },
  { key: 'isBlocked',  label: t('accounts.col.isBlocked') },
  { key: 'paidUntil',  label: t('accounts.col.paidUntil') },
  { key: 'created',    label: t('accounts.col.created') },
  { key: 'updated',    label: t('accounts.col.updated') },
])

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchAccount() {
  loading.value = true
  error.value   = ''
  try {
    const { data } = await api.get(`/account/${route.params.id}`)
    account.value = data
  } catch (e) {
    error.value = e.response?.data?.detail || t('detail.errorDefault')
  } finally {
    loading.value = false
  }
}

function onKeyDown(e) { if (e.key === 'Escape') lightboxUrl.value = '' }

onMounted(() => {
  fetchAccount()
  document.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeyDown))

// ── Edit account ─────────────────────────────────────────────────────────────
function openUpdateModal() {
  const a = account.value
  Object.assign(updateForm, {
    firstName:  a.firstName  ?? '',
    secondName: a.secondName ?? '',
    lastName:   a.lastName   ?? '',
    cardNumber: a.cardNumber ?? '',
    paidUntil:  toDateInputValue(a.paidUntil),
    isBlocked:  a.isBlocked  ?? false,
  })
  updateError.value    = ''
  updateModalOpen.value = true
}

function closeUpdateModal() {
  if (updateLoading.value) return
  updateModalOpen.value = false
}

async function submitUpdate() {
  updateLoading.value = true
  updateError.value   = ''
  try {
    const payload = {
      firstName:  updateForm.firstName.trim(),
      secondName: updateForm.secondName.trim() || null,
      lastName:   updateForm.lastName.trim(),
      cardNumber: updateForm.cardNumber.trim(),
      paidUntil:  updateForm.paidUntil ? `${updateForm.paidUntil}T00:00:00` : null,
      isBlocked:  updateForm.isBlocked,
    }
    await api.put(`/account/${route.params.id}`, payload)
    updateModalOpen.value = false
    await fetchAccount()
  } catch (e) {
    const d = e.response?.data
    updateError.value = d?.detail || d?.message || (typeof d === 'string' ? d : null)
      || t('detail.update.errorDefault')
  } finally {
    updateLoading.value = false
  }
}

// ── Block / Unblock ───────────────────────────────────────────────────────────
async function toggleBlock() {
  blockLoading.value = true
  blockError.value   = ''
  try {
    await api.patch(`/account/${route.params.id}`, { isBlocked: !account.value.isBlocked })
    await fetchAccount()
  } catch (e) {
    const data = e.response?.data
    blockError.value = data?.detail || data?.message || (typeof data === 'string' ? data : null)
      || t('detail.blockError')
  } finally {
    blockLoading.value = false
  }
}

// ── Payment modal ─────────────────────────────────────────────────────────────
function openModal() {
  modalDate.value    = toDateInputValue(account.value?.paidUntil)
  modalError.value   = ''
  modalOpen.value    = true
}

function closeModal() {
  if (modalLoading.value) return
  modalOpen.value = false
}

async function submitPayment() {
  modalLoading.value = true
  modalError.value   = ''
  try {
    await api.patch(`/account/${route.params.id}/paid-until`, null, {
      params: { newDate: `${modalDate.value}T00:00:00` }
    })
    modalOpen.value = false
    await fetchAccount()
  } catch (e) {
    const data = e.response?.data
    const msg  = data?.detail || data?.message || (typeof data === 'string' ? data : null)
    modalError.value = msg || `${t('detail.modal.errorDefault')} (HTTP ${e.response?.status ?? 'network error'})`
  } finally {
    modalLoading.value = false
  }
}

function applyPreset(months) {
  // Extend from paidUntil if it's in the future, otherwise from today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const base = new Date(Math.max(today, new Date(toDateInputValue(account.value?.paidUntil) || today)))
  base.setMonth(base.getMonth() + months)
  modalDate.value = toDateInputValue([base.getFullYear(), base.getMonth() + 1, base.getDate()])
}

function toDateInputValue(value) {
  if (!value) return ''
  if (Array.isArray(value)) {
    const [y, m, d] = value
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return String(value).slice(0, 10)
}

// ── Formatting ────────────────────────────────────────────────────────────────
function formatField(value, key) {
  if (value == null || value === '') return '—'
  if (key === 'isBlocked') return value ? t('accounts.yes') : t('accounts.no')
  if (key === 'paidUntil') return formatDate(value, true)
  if (key === 'created' || key === 'updated') return formatDate(value, false)
  return value
}

function formatDate(value, dateOnly = false) {
  if (!value) return '—'
  const d = Array.isArray(value)
    ? new Date(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0, value[5] ?? 0)
    : new Date(value)
  if (isNaN(d)) return String(value)
  return dateOnly ? d.toLocaleDateString() : d.toLocaleString()
}

function levelClass(level) {
  if (!level) return ''
  if (level === 'CRITICAL_WARNING' || level === 'ERROR') return 'level-critical'
  if (level === 'WARNING') return 'level-warning'
  if (level === 'INFO')    return 'level-info'
  return ''
}
</script>

<style scoped>
.layout { display: flex; flex-direction: column; min-height: 100vh; }

/* Header */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: var(--primary);
  color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,.2);
}
.topbar-brand { font-size: 18px; font-weight: 700; letter-spacing: .3px; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.logout-btn { color: #fff; border-color: rgba(255,255,255,.5); font-size: 13px; padding: 6px 14px; }

/* Content */
.content { flex: 1; padding: 24px; max-width: 960px; width: 100%; margin: 0 auto; }

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.back-btn { flex-shrink: 0; }
.page-title { font-size: 20px; font-weight: 700; color: var(--text); flex: 1; }
.pay-btn { flex-shrink: 0; }
.btn-unblock {
  flex-shrink: 0;
  background: #2e7d32;
  color: #fff;
  border: none;
  border-radius: var(--radius);
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity .15s;
}
.btn-unblock:hover:not(:disabled) { opacity: .88; }
.btn-unblock:disabled { opacity: .5; cursor: not-allowed; }
.block-error { margin-top: -12px; margin-bottom: 8px; }

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: 0 8px 32px rgba(0,0,0,.25);
  padding: 28px 32px;
  width: 100%;
  max-width: 360px;
}
.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 20px;
}
.field { margin-bottom: 16px; }
.field label { display: block; font-size: 13px; font-weight: 500; color: var(--text-muted); margin-bottom: 6px; }
.presets { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.btn-preset {
  flex: 1;
  min-width: 80px;
  padding: 6px 8px;
  font-size: 12px;
  font-weight: 600;
  border-radius: var(--radius);
  border: 1px solid var(--primary);
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.btn-preset:hover { background: var(--primary); color: #fff; opacity: 1; }

.field-checkbox label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: var(--text); }
.field-checkbox input { width: auto; cursor: pointer; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

/* State */
.state-msg { padding: 40px; text-align: center; color: var(--text-muted); background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }

/* Cards */
.card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 24px;
  margin-bottom: 20px;
}
.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--primary);
  text-transform: uppercase;
  letter-spacing: .4px;
}

/* Card header with avatar */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.card-header .card-title {
  margin-bottom: 0;
}

.account-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border);
  flex-shrink: 0;
  cursor: zoom-in;
  transition: opacity .15s;
}

.account-avatar:hover { opacity: .85; }

.lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  cursor: zoom-out;
}

.lightbox-img {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: var(--radius);
  box-shadow: 0 8px 40px rgba(0, 0, 0, .6);
  cursor: default;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px 24px;
}
.info-item { display: flex; flex-direction: column; gap: 4px; }
.info-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--text-muted); }
.info-value { font-size: 14px; font-weight: 500; color: var(--text); word-break: break-word; }
.badge-blocked { color: var(--danger); font-weight: 700; }

/* Warnings table */
.no-warn { color: var(--text-muted); font-size: 13px; padding: 16px 0 0; }
.table-wrap { overflow-x: auto; }

table { width: 100%; border-collapse: collapse; }
thead tr { background: var(--primary); color: #fff; }
th {
  padding: 10px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .4px;
  text-transform: uppercase;
  white-space: nowrap;
}
td { padding: 10px 14px; border-bottom: 1px solid var(--border); font-size: 13px; vertical-align: middle; }
tr:last-child td { border-bottom: none; }

/* Level badges */
.level-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .4px;
  white-space: nowrap;
}
.level-critical { background: #ef5350; color: #fff; }
.level-warning  { background: #ffcdd2; color: #b71c1c; }
.level-info     { background: #fff9c4; color: #795548; }
</style>
