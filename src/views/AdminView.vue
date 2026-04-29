<template>
  <div class="layout">
    <header class="topbar">
      <span class="topbar-brand" @click="router.push('/')">{{ $t('brand') }}</span>
      <div class="topbar-right">
        <LangSwitch />
        <button class="btn-secondary logout-btn" @click="auth.logout()">{{ $t('accounts.signOut') }}</button>
      </div>
    </header>

    <div class="content">
      <div class="page-header">
        <button class="btn-secondary back-btn" @click="router.back()">{{ $t('detail.back') }}</button>
        <h1 class="page-title">{{ $t('admin.title') }}</h1>
      </div>

      <!-- ── Tab bar ──────────────────────────────────────────────────────── -->
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ 'tab-active': activeTab === 'dbBackup' }"
          @click="activeTab = 'dbBackup'"
        >
          {{ $t('admin.tabs.dbBackup') }}
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-active': activeTab === 'credentials' }"
          @click="activeTab = 'credentials'"
        >
          {{ $t('admin.tabs.credentials') }}
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-active': activeTab === 'demoData' }"
          @click="activeTab = 'demoData'"
        >
          {{ $t('admin.tabs.demoData') }}
        </button>
      </div>

      <!-- ── DB Backup tab ────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'dbBackup'" class="tab-content">
        <div class="admin-layout">

          <!-- Left: action cards -->
          <div class="action-panel">

            <div class="card">
              <h2 class="card-title">{{ $t('admin.backup.title') }}</h2>
              <p class="card-desc">{{ $t('admin.backup.desc') }}</p>
              <button class="btn-primary" :disabled="backupLoading" @click="triggerBackup">
                {{ backupLoading ? $t('admin.backup.triggering') : $t('admin.backup.trigger') }}
              </button>
              <p v-if="backupStatus" :class="['status-msg', backupStatus.ok ? 'status-ok' : 'status-err']">
                {{ backupStatus.msg }}
              </p>
            </div>

            <div class="card">
              <h2 class="card-title">{{ $t('admin.restore.title') }}</h2>
              <p class="card-desc">{{ $t('admin.restore.desc') }}</p>
              <div class="field">
                <label>{{ $t('admin.restore.label') }}</label>
                <input v-model="restoreObjectName" type="text" :placeholder="$t('admin.restore.placeholder')" />
              </div>
              <button
                class="btn-danger"
                :disabled="restoreLoading || !restoreObjectName.trim()"
                @click="restoreConfirmOpen = true"
              >
                {{ $t('admin.restore.button') }}
              </button>
              <p v-if="restoreStatus" :class="['status-msg', restoreStatus.ok ? 'status-ok' : 'status-err']">
                {{ restoreStatus.msg }}
              </p>
            </div>

            <div class="card">
              <h2 class="card-title">{{ $t('admin.cleanup.title') }}</h2>
              <p class="card-desc">{{ $t('admin.cleanup.desc') }}</p>
              <div class="field field-inline">
                <label>{{ $t('admin.cleanup.label') }}</label>
                <input v-model.number="retentionDays" type="number" min="1" max="365" class="input-days" />
              </div>
              <button class="btn-danger" :disabled="cleanupLoading" @click="triggerCleanup">
                {{ cleanupLoading ? $t('admin.cleanup.deleting') : $t('admin.cleanup.button') }}
              </button>
              <p v-if="cleanupStatus" :class="['status-msg', cleanupStatus.ok ? 'status-ok' : 'status-err']">
                {{ cleanupStatus.msg }}
              </p>
            </div>

          </div>

          <!-- Right: backups table -->
          <div class="card backup-panel">
            <div class="panel-title-row">
              <h2 class="card-title">{{ $t('admin.backups.title') }}</h2>
              <button class="btn-secondary refresh-btn" :disabled="backupsLoading" @click="fetchBackups">
                {{ $t('admin.backups.refresh') }}
              </button>
            </div>

            <div v-if="backupsLoading" class="panel-state">{{ $t('admin.backups.loading') }}</div>
            <div v-else-if="backupsError" class="panel-state status-err">{{ backupsError }}</div>
            <div v-else-if="backups.length === 0" class="panel-state muted">{{ $t('admin.backups.empty') }}</div>

            <div v-else class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{{ $t('admin.backups.col.date') }}</th>
                    <th>{{ $t('admin.backups.col.name') }}</th>
                    <th>{{ $t('admin.backups.col.size') }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="b in backups" :key="b.objectName">
                    <td class="col-date">{{ formatBackupDate(b.createdAt) }}</td>
                    <td class="col-name" :title="b.objectName">{{ b.objectName }}</td>
                    <td class="col-size">{{ formatSize(b.size) }}</td>
                    <td class="col-actions">
                      <button class="btn-secondary btn-sm" @click="selectRestore(b.objectName)">
                        {{ $t('admin.backups.restoreBtn') }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <!-- ── Credentials tab ─────────────────────────────────────────────── -->
      <div v-if="activeTab === 'credentials'" class="tab-content">
        <div class="card credentials-card">
          <h2 class="card-title">{{ $t('admin.credentials.title') }}</h2>
          <p class="card-desc">{{ $t('admin.credentials.desc') }}</p>

          <div class="field">
            <label>{{ $t('admin.credentials.currentPassword') }}</label>
            <input v-model="credForm.currentPassword" type="password" autocomplete="current-password" />
          </div>
          <div class="field">
            <label>{{ $t('admin.credentials.newUsername') }}</label>
            <input v-model="credForm.newUsername" type="text" autocomplete="username" />
          </div>
          <div class="field">
            <label>{{ $t('admin.credentials.newPassword') }}</label>
            <input v-model="credForm.newPassword" type="password" autocomplete="new-password" />
          </div>
          <div class="field">
            <label>{{ $t('admin.credentials.confirmPassword') }}</label>
            <input v-model="credForm.confirmPassword" type="password" autocomplete="new-password" />
          </div>

          <p v-if="credError" class="status-msg status-err">{{ credError }}</p>
          <p v-if="credSuccess" class="status-msg status-ok">{{ credSuccess }}</p>

          <button
            class="btn-primary cred-submit"
            :disabled="credLoading || !credForm.currentPassword.trim()"
            @click="submitCredentials"
          >
            {{ credLoading ? $t('admin.credentials.submitting') : $t('admin.credentials.submit') }}
          </button>
        </div>
      </div>

      <!-- ── Demo data tab ───────────────────────────────────────────────── -->
      <div v-if="activeTab === 'demoData'" class="tab-content">
        <div class="demo-layout">

          <div class="card credentials-card">
            <h2 class="card-title">{{ $t('admin.demo.title') }}</h2>
            <p class="card-desc">{{ $t('admin.demo.desc') }}</p>

            <div class="field field-inline">
              <label>{{ $t('admin.demo.amountLabel') }}</label>
              <input v-model.number="demoAmount" type="number" min="1" max="10000" class="input-days" />
            </div>

            <p v-if="demoError"   class="status-msg status-err">{{ demoError }}</p>
            <p v-if="demoSuccess" class="status-msg status-ok">{{ demoSuccess }}</p>

            <button
              class="btn-primary cred-submit"
              :disabled="demoLoading || !demoAmount || demoAmount < 1"
              @click="generateDemo"
            >
              {{ demoLoading ? $t('admin.demo.generating') : $t('admin.demo.generate') }}
            </button>
          </div>

          <div class="card credentials-card">
            <h2 class="card-title">{{ $t('admin.demo.deleteTitle') }}</h2>
            <p class="card-desc">{{ $t('admin.demo.deleteDesc') }}</p>

            <p v-if="demoDeleteError"   class="status-msg status-err">{{ demoDeleteError }}</p>
            <p v-if="demoDeleteSuccess" class="status-msg status-ok">{{ demoDeleteSuccess }}</p>

            <button
              class="btn-danger cred-submit"
              :disabled="demoDeleteLoading"
              @click="demoDeleteConfirmOpen = true"
            >
              {{ demoDeleteLoading ? $t('admin.demo.deleting') : $t('admin.demo.deleteButton') }}
            </button>
          </div>

        </div>
      </div>

    </div>
  </div>

  <!-- ── Delete demo data confirmation modal ──────────────────────────────── -->
  <Teleport to="body">
    <div v-if="demoDeleteConfirmOpen" class="modal-overlay" @click.self="demoDeleteConfirmOpen = false">
      <div class="modal">
        <h3 class="modal-title">{{ $t('admin.demo.deleteConfirmTitle') }}</h3>
        <p class="confirm-msg">{{ $t('admin.demo.deleteConfirmMsg') }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" :disabled="demoDeleteLoading" @click="demoDeleteConfirmOpen = false">
            {{ $t('admin.restore.cancelBtn') }}
          </button>
          <button class="btn-danger" :disabled="demoDeleteLoading" @click="deleteAllDemo">
            {{ demoDeleteLoading ? $t('admin.demo.deleting') : $t('admin.demo.deleteConfirmBtn') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Restore confirmation modal ───────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="restoreConfirmOpen" class="modal-overlay" @click.self="restoreConfirmOpen = false">
      <div class="modal">
        <h3 class="modal-title">{{ $t('admin.restore.confirmTitle') }}</h3>
        <p class="confirm-msg">{{ $t('admin.restore.confirmMsg', { name: restoreObjectName }) }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" :disabled="restoreLoading" @click="restoreConfirmOpen = false">
            {{ $t('admin.restore.cancelBtn') }}
          </button>
          <button class="btn-danger" :disabled="restoreLoading" @click="triggerRestore">
            {{ restoreLoading ? $t('admin.restore.restoring') : $t('admin.restore.confirmBtn') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import LangSwitch from '../components/LangSwitch.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const auth   = useAuthStore()
const { t }  = useI18n()

const activeTab = ref('dbBackup')

// ── Credentials ───────────────────────────────────────────────────────────────
const credForm    = ref({ currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' })
const credLoading = ref(false)
const credError   = ref('')
const credSuccess = ref('')

async function submitCredentials() {
  credError.value   = ''
  credSuccess.value = ''

  const { currentPassword, newUsername, newPassword, confirmPassword } = credForm.value
  const trimmedUser = newUsername.trim()
  const hasNewUser  = !!trimmedUser
  const hasNewPass  = !!newPassword

  if (!hasNewUser && !hasNewPass) {
    credError.value = t('admin.credentials.errorEmpty')
    return
  }
  if (hasNewPass && newPassword !== confirmPassword) {
    credError.value = t('admin.credentials.errorMismatch')
    return
  }

  credLoading.value = true
  try {
    const payload = {
      currentPassword,
      newUsername: hasNewUser ? trimmedUser : null,
      newPassword: hasNewPass ? newPassword : null,
    }
    const { data } = await api.patch('/users/me/credentials', payload)
    auth.token = data.token
    localStorage.setItem('token', data.token)
    credSuccess.value = t('admin.credentials.success')
    credForm.value = { currentPassword: '', newUsername: '', newPassword: '', confirmPassword: '' }
  } catch (e) {
    const status = e.response?.status
    const detail = e.response?.data?.detail || e.response?.data?.message
    if (status === 401) credError.value = t('admin.credentials.errorWrongPassword')
    else if (status === 409) credError.value = t('admin.credentials.errorUsernameTaken')
    else credError.value = detail || t('admin.credentials.errorDefault')
  } finally {
    credLoading.value = false
  }
}

// ── Backups list ──────────────────────────────────────────────────────────────
const backups        = ref([])
const backupsLoading = ref(false)
const backupsError   = ref('')

async function fetchBackups() {
  backupsLoading.value = true
  backupsError.value   = ''
  try {
    const { data } = await api.get('/db-backup')
    backups.value = data
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    backupsError.value = detail || t('admin.backups.error')
  } finally {
    backupsLoading.value = false
  }
}

onMounted(fetchBackups)

// ── Backup ────────────────────────────────────────────────────────────────────
const backupLoading = ref(false)
const backupStatus  = ref(null)

async function triggerBackup() {
  backupLoading.value = true
  backupStatus.value  = null
  try {
    await api.post('/db-backup/backup')
    backupStatus.value = { ok: true, msg: t('admin.backup.success') }
    fetchBackups()
    setTimeout(fetchBackups, 3000)
    setTimeout(fetchBackups, 7000)
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    backupStatus.value = { ok: false, msg: detail || t('admin.backup.error') }
  } finally {
    backupLoading.value = false
  }
}

// ── Restore ───────────────────────────────────────────────────────────────────
const restoreObjectName  = ref('')
const restoreLoading     = ref(false)
const restoreStatus      = ref(null)
const restoreConfirmOpen = ref(false)

function selectRestore(objectName) {
  restoreObjectName.value  = objectName
  restoreStatus.value      = null
  restoreConfirmOpen.value = true
}

async function triggerRestore() {
  restoreLoading.value = true
  restoreStatus.value  = null
  try {
    await api.post('/db-backup/restore', null, { params: { objectName: restoreObjectName.value.trim() } })
    restoreStatus.value      = { ok: true, msg: t('admin.restore.success') }
    restoreConfirmOpen.value = false
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    restoreStatus.value      = { ok: false, msg: detail || t('admin.restore.error') }
    restoreConfirmOpen.value = false
  } finally {
    restoreLoading.value = false
  }
}

// ── Cleanup ───────────────────────────────────────────────────────────────────
const retentionDays  = ref(7)
const cleanupLoading = ref(false)
const cleanupStatus  = ref(null)

async function triggerCleanup() {
  cleanupLoading.value = true
  cleanupStatus.value  = null
  try {
    await api.delete('/db-backup/old-backups', { params: { retentionDays: retentionDays.value } })
    cleanupStatus.value = { ok: true, msg: t('admin.cleanup.success') }
    fetchBackups()
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    cleanupStatus.value = { ok: false, msg: detail || t('admin.cleanup.error') }
  } finally {
    cleanupLoading.value = false
  }
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const demoAmount  = ref(50)
const demoLoading = ref(false)
const demoError   = ref('')
const demoSuccess = ref('')

async function generateDemo() {
  demoLoading.value = true
  demoError.value   = ''
  demoSuccess.value = ''
  try {
    const { data } = await api.post('/demo/accounts', null, { params: { amount: demoAmount.value } })
    demoSuccess.value = t('admin.demo.success', { n: data })
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    demoError.value = detail || t('admin.demo.error')
  } finally {
    demoLoading.value = false
  }
}

const demoDeleteLoading     = ref(false)
const demoDeleteError       = ref('')
const demoDeleteSuccess     = ref('')
const demoDeleteConfirmOpen = ref(false)

async function deleteAllDemo() {
  demoDeleteLoading.value     = true
  demoDeleteError.value       = ''
  demoDeleteSuccess.value     = ''
  demoDeleteConfirmOpen.value = false
  try {
    const { data } = await api.delete('/demo/accounts')
    demoDeleteSuccess.value = t('admin.demo.deleteSuccess', { n: data })
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    demoDeleteError.value = detail || t('admin.demo.deleteError')
  } finally {
    demoDeleteLoading.value = false
  }
}

// ── Formatting ────────────────────────────────────────────────────────────────
function formatBackupDate(value) {
  if (!value) return '—'
  const d = Array.isArray(value)
    ? new Date(Date.UTC(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0, value[5] ?? 0))
    : new Date(value)
  return isNaN(d) ? '—' : d.toLocaleString()
}

function formatSize(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}
</script>

<style scoped>
.layout { display: flex; flex-direction: column; min-height: 100vh; }

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
.topbar-brand { font-size: 18px; font-weight: 700; letter-spacing: .3px; cursor: pointer; }
.topbar-right { display: flex; align-items: center; gap: 12px; }
.logout-btn { color: #fff; border-color: rgba(255,255,255,.5); font-size: 13px; padding: 6px 14px; }

.content { flex: 1; padding: 24px; }

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  max-width: 1400px;
}
.back-btn { flex-shrink: 0; }
.page-title { font-size: 20px; font-weight: 700; color: var(--text); flex: 1; }

/* Tabs */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid var(--border);
  margin-bottom: 24px;
  max-width: 1400px;
}

.tab-btn {
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 0;
  transition: color .15s, border-color .15s;
}

.tab-btn:hover:not(:disabled) { color: var(--text); opacity: 1; }

.tab-active {
  color: var(--primary);
  border-bottom-color: var(--primary);
}

/* Tab content */
.tab-content { max-width: 1400px; }

/* Two-column layout */
.admin-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.action-panel {
  width: 420px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.backup-panel {
  flex: 1;
  min-width: 0;
}

.credentials-card {
  max-width: 420px;
}

.demo-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.cred-submit {
  align-self: flex-start;
}

/* Cards */
.card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 24px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.card-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--primary);
  padding-bottom: 10px;
  border-bottom: 2px solid var(--primary);
  text-transform: uppercase;
  letter-spacing: .4px;
  margin: 0;
}

.card-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0; }

.panel-title-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
}
.panel-title-row .card-title { flex: 1; }
.refresh-btn { font-size: 12px; padding: 5px 12px; flex-shrink: 0; align-self: flex-start; }

.panel-state { padding: 24px; text-align: center; font-size: 13px; }
.muted { color: var(--text-muted); }

/* Table */
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead tr { background: var(--primary); color: #fff; }
th {
  padding: 9px 12px;
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .4px;
  text-transform: uppercase;
  white-space: nowrap;
}
td { padding: 9px 12px; border-bottom: 1px solid var(--border); font-size: 13px; vertical-align: middle; }
tr:last-child td { border-bottom: none; }
tr:hover td { filter: brightness(.97); }

.col-date    { white-space: nowrap; }
.col-name    { font-family: monospace; font-size: 12px; }
.col-size    { white-space: nowrap; color: var(--text-muted); }
.col-actions { text-align: right; }
.btn-sm      { font-size: 12px; padding: 5px 10px; }

/* Form */
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--text-muted); }
.field-inline { flex-direction: row; align-items: center; gap: 12px; }
.field-inline label { white-space: nowrap; }
.input-days { width: 80px; }

.status-msg { font-size: 13px; margin: 0; }
.status-ok  { color: #2e7d32; }
.status-err { color: var(--danger); }

/* Modal */
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: 0 8px 32px rgba(0,0,0,.25);
  padding: 28px 32px;
  width: 100%; max-width: 420px;
}
.modal-title { font-size: 16px; font-weight: 700; color: var(--primary); margin-bottom: 12px; }
.confirm-msg { font-size: 14px; color: var(--text); line-height: 1.5; word-break: break-all; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
</style>
