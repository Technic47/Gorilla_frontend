<template>
  <div class="layout">
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <header class="topbar">
      <span class="topbar-brand">{{ $t('brand') }}</span>
      <div class="topbar-right">
        <LangSwitch/>
        <button class="btn-secondary logout-btn" @click="auth.logout()">{{ $t('accounts.signOut') }}</button>
      </div>
    </header>

    <!-- ── Toolbar ────────────────────────────────────────────────────────── -->
    <div class="toolbar">
      <button class="btn-primary" @click="openAddModal">{{ $t('accounts.add.button') }}</button>

      <input
          v-model="search"
          class="search-input"
          :placeholder="$t('accounts.searchPlaceholder')"
          @input="onSearch"
      />

      <!-- Column toggle -->
      <div class="col-toggle-wrap" ref="colToggleRef">
        <button class="btn-secondary" @click="colMenuOpen = !colMenuOpen">
          {{ $t('accounts.columnsBtn') }}
        </button>
        <div v-if="colMenuOpen" class="col-menu">
          <label v-for="col in allColumns" :key="col.key" class="col-menu-item">
            <input type="checkbox" v-model="visibleKeys" :value="col.key"/>
            {{ col.label }}
          </label>
        </div>
      </div>

      <label class="hide-blocked-label">
        <input type="checkbox" v-model="hideBlocked"/>
        {{ $t('accounts.hideBlocked') }}
      </label>

      <!-- Legend -->
      <div class="legend">
        <span class="dot white"></span> {{ $t('accounts.legend.none') }}
        <span class="dot yellow"></span> {{ $t('accounts.legend.info') }}
        <span class="dot lightred"></span> {{ $t('accounts.legend.warning') }}
        <span class="dot brightred"></span> {{ $t('accounts.legend.critical') }}
      </div>
    </div>

    <!-- ── Table ──────────────────────────────────────────────────────────── -->
    <div class="table-wrap">
      <div v-if="loading" class="state-msg">{{ $t('accounts.loading') }}</div>
      <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>
      <div v-else-if="filteredRows.length === 0" class="state-msg">{{ $t('accounts.noResults') }}</div>

      <table v-else>
        <thead>
        <tr>
          <th
              v-for="col in visibleColumns"
              :key="col.key"
              @click="toggleSort(col.key)"
              :class="{ sortable: true, active: sortField === col.key }"
          >
            {{ col.label }}
            <span class="sort-icon">
                {{ sortField === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅' }}
              </span>
          </th>
        </tr>
        </thead>
        <tbody>
        <tr
            v-for="row in filteredRows"
            :key="row.id"
            :style="rowStyle(row.warnings)"
            class="clickable-row"
            @click="router.push(`/account/${row.id}`)"
        >
          <td v-for="col in visibleColumns" :key="col.key">
            {{ formatCell(row[col.key], col.key) }}
          </td>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Pagination ─────────────────────────────────────────────────────── -->
    <div class="pagination">
      <span class="page-info">
        {{ $t('accounts.pageInfo', {page: currentPage + 1, total: totalPages, count: totalElements}) }}
      </span>

      <div class="page-controls">
        <button class="btn-secondary" :disabled="currentPage === 0" @click="goPage(currentPage - 1)">
          {{ $t('accounts.prev') }}
        </button>

        <select v-model.number="pageSize" @change="goPage(0)">
          <option v-for="s in [5, 10, 20, 50]" :key="s" :value="s">{{ s }} {{ $t('accounts.perPage') }}</option>
        </select>

        <button class="btn-secondary" :disabled="currentPage >= totalPages - 1" @click="goPage(currentPage + 1)">
          {{ $t('accounts.next') }}
        </button>
      </div>
    </div>
  </div>

  <!-- ── Add account modal ──────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="addModalOpen" class="modal-overlay" @click.self="closeAddModal">
      <div class="modal">
        <h3 class="modal-title">{{ $t('accounts.add.title') }}</h3>

        <div class="field">
          <label>{{ $t('accounts.col.firstName') }}</label>
          <input v-model="addForm.firstName" type="text" required/>
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.secondName') }}</label>
          <input v-model="addForm.secondName" type="text"/>
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.lastName') }}</label>
          <input v-model="addForm.lastName" type="text" required/>
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.cardNumber') }}</label>
          <input v-model="addForm.cardNumber" type="text" required/>
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.paidUntil') }}</label>
          <input v-model="addForm.paidUntil" type="date"/>
        </div>

        <p v-if="addError" class="error-msg">{{ addError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" :disabled="addLoading" @click="closeAddModal">
            {{ $t('accounts.add.cancel') }}
          </button>
          <button class="btn-primary" :disabled="addLoading || !addFormValid" @click="submitAdd">
            {{ addLoading ? '…' : $t('accounts.add.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import {ref, computed, reactive, onMounted, onBeforeUnmount} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useAuthStore} from '../stores/auth'
import api from '../api'
import LangSwitch from '../components/LangSwitch.vue'

const router = useRouter()

const {t} = useI18n()
const auth = useAuthStore()

// ── Add account modal ─────────────────────────────────────────────────────────
const addModalOpen = ref(false)
const addLoading = ref(false)
const addError = ref('')
const addForm = reactive({firstName: '', secondName: '', lastName: '', cardNumber: '', paidUntil: ''})
const addFormValid = computed(() => addForm.firstName.trim() && addForm.lastName.trim() && addForm.cardNumber.trim())

function openAddModal() {
  Object.assign(addForm, {firstName: '', secondName: '', lastName: '', cardNumber: '', paidUntil: ''})
  addError.value = ''
  addModalOpen.value = true
}

function closeAddModal() {
  if (addLoading.value) return
  addModalOpen.value = false
}

async function submitAdd() {
  addLoading.value = true
  addError.value = ''
  try {
    const payload = {
      firstName: addForm.firstName.trim(),
      secondName: addForm.secondName.trim() || null,
      lastName: addForm.lastName.trim(),
      cardNumber: addForm.cardNumber.trim(),
      paidUntil: addForm.paidUntil ? `${addForm.paidUntil}T00:00:00` : null,
      isBlocked: false,
    }
    const {data} = await api.post('/account', payload)
    addModalOpen.value = false
    router.push(`/account/${data.id}`)
  } catch (e) {
    const d = e.response?.data
    addError.value = d?.detail || d?.message || (typeof d === 'string' ? d : null)
        || t('accounts.add.errorDefault')
  } finally {
    addLoading.value = false
  }
}

// ── Column definitions ────────────────────────────────────────────────────────
const allColumns = computed(() => [
  {key: 'id', label: t('accounts.col.id')},
  {key: 'firstName', label: t('accounts.col.firstName')},
  {key: 'secondName', label: t('accounts.col.secondName')},
  {key: 'lastName', label: t('accounts.col.lastName')},
  {key: 'cardNumber', label: t('accounts.col.cardNumber')},
  {key: 'isBlocked', label: t('accounts.col.isBlocked')},
  {key: 'paidUntil', label: t('accounts.col.paidUntil')},
  {key: 'created', label: t('accounts.col.created')},
  {key: 'updated', label: t('accounts.col.updated')},
])
const visibleKeys = ref(['firstName', 'secondName', 'lastName', 'cardNumber', 'isBlocked', 'paidUntil'])
const visibleColumns = computed(() => allColumns.value.filter(c => visibleKeys.value.includes(c.key)))

// ── State ─────────────────────────────────────────────────────────────────────
const rows = ref([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(0)
const pageSize = ref(10)
const totalPages = ref(0)
const totalElements = ref(0)
const sortField = ref('id')
const sortDir = ref('asc')
const search = ref('')
const colMenuOpen = ref(false)
const colToggleRef = ref(null)
const hideBlocked = ref(false)

// ── Filtered rows (client-side search + hide blocked) ────────────────────────
const filteredRows = computed(() => {
  let result = rows.value
  if (hideBlocked.value) result = result.filter(row => !row.isBlocked)
  const q = search.value.trim().toLowerCase()
  if (!q) return result
  return result.filter(row =>
      allColumns.value.some(col => {
        const v = row[col.key]
        return v != null && String(v).toLowerCase().includes(q)
      })
  )
})

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchPage() {
  loading.value = true
  error.value = ''
  try {
    const {data} = await api.get('/account/page', {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        sort: `${sortField.value},${sortDir.value}`
      }
    })
    rows.value = data.content ?? []
    totalPages.value = data.totalPages ?? 0
    totalElements.value = data.totalElements ?? 0
  } catch (e) {
    error.value = e.response?.data?.detail || t('accounts.errorDefault')
  } finally {
    loading.value = false
  }
}

function goPage(n) {
  currentPage.value = n
  fetchPage()
}

function toggleSort(key) {
  if (sortField.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = key
    sortDir.value = 'asc'
  }
  goPage(0)
}

let searchTimer = null

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 0;
    fetchPage()
  }, 350)
}

// ── Row color ─────────────────────────────────────────────────────────────────
function rowStyle(warnings) {
  if (!warnings || warnings.length === 0) return {backgroundColor: '#ffffff'}
  const levels = warnings.map(w => w.level)
  if (levels.some(l => l === 'CRITICAL_WARNING' || l === 'ERROR'))
    return {backgroundColor: '#ef5350', color: '#fff'}
  if (levels.some(l => l === 'WARNING'))
    return {backgroundColor: '#ffcdd2'}
  if (levels.some(l => l === 'INFO'))
    return {backgroundColor: '#fff9c4'}
  return {backgroundColor: '#ffffff'}
}

// ── Cell formatting ───────────────────────────────────────────────────────────
function formatCell(value, key) {
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

// ── Close column menu on outside click ───────────────────────────────────────
function handleOutsideClick(e) {
  if (colToggleRef.value && !colToggleRef.value.contains(e.target)) {
    colMenuOpen.value = false
  }
}

onMounted(() => {
  fetchPage()
  document.addEventListener('click', handleOutsideClick)
})
onBeforeUnmount(() => document.removeEventListener('click', handleOutsideClick))
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Header */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: var(--primary);
  color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, .2);
}

.topbar-brand {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: .3px;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logout-btn {
  color: #fff;
  border-color: rgba(255, 255, 255, .5);
  font-size: 13px;
  padding: 6px 14px;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.search-input {
  max-width: 280px;
}

.hide-blocked-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text);
  cursor: pointer;
  white-space: nowrap;
}

.hide-blocked-label input {
  width: auto;
  cursor: pointer;
}

/* Column toggle */
.col-toggle-wrap {
  position: relative;
}

.col-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 8px 0;
  z-index: 10;
  min-width: 160px;
}

.col-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  cursor: pointer;
  font-size: 13px;
}

.col-menu-item:hover {
  background: var(--bg);
}

.col-menu-item input {
  width: auto;
  cursor: pointer;
}

/* Legend */
.legend {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-muted);
  margin-left: auto;
  flex-wrap: wrap;
}

.dot {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, .12);
  margin-right: 2px;
}

.dot.white {
  background: #ffffff;
}

.dot.yellow {
  background: #fff9c4;
}

.dot.lightred {
  background: #ffcdd2;
}

.dot.brightred {
  background: #ef5350;
}

/* Table */
.table-wrap {
  flex: 1;
  overflow-x: auto;
  padding: 16px 24px 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow);
}

thead tr {
  background: var(--primary);
  color: #fff;
}

th {
  padding: 11px 14px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .4px;
  text-transform: uppercase;
  white-space: nowrap;
  user-select: none;
}

th.sortable {
  cursor: pointer;
}

th.sortable:hover {
  background: var(--primary-light);
}

th.active {
  background: var(--primary-light);
}

.sort-icon {
  margin-left: 4px;
  font-size: 10px;
  opacity: .8;
}

td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  font-size: 13px;
}

tr:last-child td {
  border-bottom: none;
}

tr:hover td {
  filter: brightness(.96);
}

tr.clickable-row {
  cursor: pointer;
}

.state-msg {
  padding: 40px;
  text-align: center;
  color: var(--text-muted);
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.page-info {
  font-size: 13px;
  color: var(--text-muted);
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-controls select {
  width: auto;
  padding: 7px 10px;
}

/* Add account modal */
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
  box-shadow: 0 8px 32px rgba(0, 0, 0, .25);
  padding: 28px 32px;
  width: 100%;
  max-width: 400px;
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 20px;
}

.field {
  margin-bottom: 14px;
}

.field label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 6px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
</style>
