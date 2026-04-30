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
          :class="{ 'tab-active': activeTab === 'analytics' }"
          @click="activeTab = 'analytics'"
        >
          {{ $t('admin.tabs.analytics') }}
        </button>
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

      <!-- ── Analytics tab ───────────────────────────────────────────────── -->
      <div v-if="activeTab === 'analytics'" class="tab-content">
        <div class="card analytics-header-card">
          <div class="panel-title-row">
            <h2 class="card-title">{{ $t('admin.analytics.summaryTitle') }}</h2>
            <button class="btn-secondary refresh-btn" :disabled="summaryLoading" @click="fetchSummary">
              {{ $t('admin.backups.refresh') }}
            </button>
          </div>

          <div v-if="summaryLoading" class="panel-state">{{ $t('admin.backups.loading') }}</div>
          <div v-else-if="summaryError" class="panel-state status-err">{{ summaryError }}</div>
          <div v-else-if="summary" class="metrics-grid">
            <div class="metric-tile metric-total">
              <div class="metric-label">{{ $t('admin.analytics.accountsTotal') }}</div>
              <div class="metric-value">{{ summary.accountsTotal }}</div>
            </div>

            <div class="metric-group">
              <div class="metric-group-title">{{ $t('admin.analytics.registrations') }}</div>
              <div class="metric-row">
                <div class="metric-tile">
                  <div class="metric-label">{{ $t('admin.analytics.week') }}</div>
                  <div class="metric-value">{{ summary.registrationsWeek }}</div>
                </div>
                <div class="metric-tile">
                  <div class="metric-label">{{ $t('admin.analytics.month') }}</div>
                  <div class="metric-value">{{ summary.registrationsMonth }}</div>
                </div>
                <div class="metric-tile">
                  <div class="metric-label">{{ $t('admin.analytics.year') }}</div>
                  <div class="metric-value">{{ summary.registrationsYear }}</div>
                </div>
              </div>
            </div>

            <div class="metric-group">
              <div class="metric-group-title">{{ $t('admin.analytics.payments') }}</div>
              <div class="metric-row">
                <div class="metric-tile">
                  <div class="metric-label">{{ $t('admin.analytics.week') }}</div>
                  <div class="metric-value">{{ summary.paymentsWeek }}</div>
                </div>
                <div class="metric-tile">
                  <div class="metric-label">{{ $t('admin.analytics.month') }}</div>
                  <div class="metric-value">{{ summary.paymentsMonth }}</div>
                </div>
                <div class="metric-tile">
                  <div class="metric-label">{{ $t('admin.analytics.year') }}</div>
                  <div class="metric-value">{{ summary.paymentsYear }}</div>
                </div>
              </div>
            </div>
          </div>

          <p v-if="summary?.generatedAt" class="generated-at">
            {{ $t('admin.analytics.generatedAt') }}: {{ formatBackupDate(summary.generatedAt) }}
          </p>
        </div>

        <div class="card chart-card">
          <h2 class="card-title">{{ $t('admin.analytics.chartTitle') }}</h2>

          <div class="chart-controls">
            <div class="control-group">
              <span class="control-label">{{ $t('admin.analytics.metric') }}:</span>
              <button
                v-for="m in ['registrations', 'payments']"
                :key="m"
                class="toggle-btn"
                :class="{ 'toggle-active': chartMetric === m }"
                @click="chartMetric = m"
              >
                {{ $t(`admin.analytics.${m}`) }}
              </button>
            </div>
            <div class="control-group">
              <span class="control-label">{{ $t('admin.analytics.range') }}:</span>
              <button
                v-for="r in ['week', 'month', 'year']"
                :key="r"
                class="toggle-btn"
                :class="{ 'toggle-active': chartRange === r }"
                @click="chartRange = r"
              >
                {{ $t(`admin.analytics.${r}`) }}
              </button>
            </div>
          </div>

          <div v-if="chartLoading" class="panel-state">{{ $t('admin.backups.loading') }}</div>
          <div v-else-if="chartError" class="panel-state status-err">{{ chartError }}</div>
          <div v-else-if="!chartData.length" class="panel-state muted">{{ $t('admin.analytics.noData') }}</div>

          <div v-else class="chart-wrap">
            <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="chart-svg" preserveAspectRatio="none">
              <!-- y-axis grid lines -->
              <g class="grid">
                <line
                  v-for="i in 4"
                  :key="i"
                  :x1="chartPadL"
                  :x2="chartW - chartPadR"
                  :y1="chartPadT + (i - 1) * (chartH - chartPadT - chartPadB) / 4"
                  :y2="chartPadT + (i - 1) * (chartH - chartPadT - chartPadB) / 4"
                />
              </g>
              <!-- y-axis labels -->
              <g class="axis-text">
                <text
                  v-for="i in 5"
                  :key="i"
                  :x="chartPadL - 6"
                  :y="chartPadT + (i - 1) * (chartH - chartPadT - chartPadB) / 4 + 4"
                  text-anchor="end"
                >
                  {{ Math.round(chartMaxValue * (4 - (i - 1)) / 4) }}
                </text>
              </g>
              <!-- bars -->
              <g>
                <rect
                  v-for="(bar, idx) in chartBars"
                  :key="idx"
                  :x="bar.x"
                  :y="bar.y"
                  :width="bar.w"
                  :height="bar.h"
                  class="chart-bar"
                >
                  <title>{{ bar.label }}: {{ bar.value }}</title>
                </rect>
              </g>
              <!-- x-axis labels -->
              <g class="axis-text">
                <text
                  v-for="(bar, idx) in chartBars"
                  v-show="shouldShowTick(idx)"
                  :key="`x${idx}`"
                  :x="bar.x + bar.w / 2"
                  :y="chartH - chartPadB + 16"
                  text-anchor="middle"
                >
                  {{ bar.tick }}
                </text>
              </g>
              <!-- baseline -->
              <line
                :x1="chartPadL"
                :x2="chartW - chartPadR"
                :y1="chartH - chartPadB"
                :y2="chartH - chartPadB"
                class="axis-line"
              />
            </svg>
          </div>
        </div>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import LangSwitch from '../components/LangSwitch.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const auth   = useAuthStore()
const { t, locale } = useI18n()

const activeTab = ref('analytics')

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

onMounted(() => {
  fetchBackups()
  fetchSummary()
  fetchChart()
})

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

// ── Analytics ─────────────────────────────────────────────────────────────────
const summary        = ref(null)
const summaryLoading = ref(false)
const summaryError   = ref('')

const chartMetric  = ref('registrations')
const chartRange   = ref('week')
const chartData    = ref([])
const chartLoading = ref(false)
const chartError   = ref('')

const chartW     = 800
const chartH     = 300
const chartPadL  = 40
const chartPadR  = 12
const chartPadT  = 12
const chartPadB  = 36

async function fetchSummary() {
  summaryLoading.value = true
  summaryError.value   = ''
  try {
    const { data } = await api.get('/metrics/summary')
    summary.value = data
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    summaryError.value = detail || t('admin.analytics.error')
  } finally {
    summaryLoading.value = false
  }
}

function pad2(n) { return String(n).padStart(2, '0') }

function formatLocalDateTime(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T` +
         `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

function rangeParams(range) {
  const now = new Date()
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  if (range === 'week') {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    return { granularity: 'day', from, to }
  }
  if (range === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
    return { granularity: 'day', from, to }
  }
  // year
  const from = new Date(now.getFullYear(), now.getMonth() - 11, 1)
  return { granularity: 'month', from, to }
}

async function fetchChart() {
  chartLoading.value = true
  chartError.value   = ''
  try {
    const { granularity, from, to } = rangeParams(chartRange.value)
    const { data } = await api.get('/metrics/series', {
      params: {
        metric: chartMetric.value,
        granularity,
        from: formatLocalDateTime(from),
        to:   formatLocalDateTime(to),
      },
    })
    chartData.value = data.map(b => ({
      bucket: parseBackendDate(b.bucket),
      value:  b.value,
    }))
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    chartError.value = detail || t('admin.analytics.error')
    chartData.value  = []
  } finally {
    chartLoading.value = false
  }
}

function parseBackendDate(value) {
  if (!value) return null
  if (Array.isArray(value)) {
    return new Date(value[0], (value[1] ?? 1) - 1, value[2] ?? 1, value[3] ?? 0, value[4] ?? 0, value[5] ?? 0)
  }
  return new Date(value)
}

const chartMaxValue = computed(() => {
  const max = chartData.value.reduce((m, b) => Math.max(m, b.value), 0)
  return max > 0 ? max : 1
})

function formatTick(date, range) {
  if (!date) return ''
  if (range === 'year') {
    return date.toLocaleDateString(locale.value, { month: 'short' })
  }
  return date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric' })
}

function formatTooltip(date, range) {
  if (!date) return ''
  if (range === 'year') {
    return date.toLocaleDateString(locale.value, { month: 'long', year: 'numeric' })
  }
  return date.toLocaleDateString(locale.value, { month: 'short', day: 'numeric', year: 'numeric' })
}

const chartBars = computed(() => {
  const data = chartData.value
  if (!data.length) return []
  const innerW = chartW - chartPadL - chartPadR
  const innerH = chartH - chartPadT - chartPadB
  const slot = innerW / data.length
  const barW = Math.max(2, slot * 0.7)
  const max = chartMaxValue.value
  return data.map((b, i) => {
    const h = (b.value / max) * innerH
    return {
      x: chartPadL + i * slot + (slot - barW) / 2,
      y: chartH - chartPadB - h,
      w: barW,
      h,
      value: b.value,
      tick: formatTick(b.bucket, chartRange.value),
      label: formatTooltip(b.bucket, chartRange.value),
    }
  })
})

function shouldShowTick(idx) {
  const total = chartBars.value.length
  if (total <= 12) return true
  // Roughly cap to 12 visible labels.
  const step = Math.ceil(total / 12)
  return idx % step === 0 || idx === total - 1
}

watch([chartMetric, chartRange], fetchChart)

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

/* Analytics */
.analytics-header-card { gap: 18px; }
.metrics-grid {
  display: grid;
  grid-template-columns: minmax(180px, 220px) 1fr 1fr;
  gap: 18px;
  align-items: stretch;
}
.metric-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.metric-group-title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .4px;
  text-transform: uppercase;
  color: var(--text-muted);
}
.metric-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.metric-tile {
  background: var(--bg, #f7f7f8);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.metric-total {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
  justify-content: center;
}
.metric-total .metric-label { color: rgba(255,255,255,.85); }
.metric-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: var(--text-muted);
}
.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}
.metric-total .metric-value { color: #fff; font-size: 32px; }
.generated-at { font-size: 12px; color: var(--text-muted); margin: 0; }

.chart-card { gap: 16px; }
.chart-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
}
.control-group { display: flex; align-items: center; gap: 6px; }
.control-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: var(--text-muted);
  margin-right: 4px;
}
.toggle-btn {
  background: none;
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: color .15s, border-color .15s, background .15s;
}
.toggle-btn:hover { color: var(--text); }
.toggle-active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}
.toggle-active:hover { color: #fff; }

.chart-wrap { width: 100%; overflow-x: auto; }
.chart-svg {
  width: 100%;
  height: 320px;
  display: block;
}
.chart-bar { fill: var(--primary); transition: opacity .15s; }
.chart-bar:hover { opacity: .75; }
.grid line { stroke: var(--border); stroke-width: 1; }
.axis-line { stroke: var(--border); stroke-width: 1; }
.axis-text { font-size: 11px; fill: var(--text-muted); }

@media (max-width: 900px) {
  .metrics-grid { grid-template-columns: 1fr; }
}
</style>
