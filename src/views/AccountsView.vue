<template>
  <div class="layout">
    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <header class="topbar">
      <span class="topbar-brand" @click="router.push('/')">{{ $t('brand') }}</span>
      <div class="topbar-right">
        <LangSwitch/>
        <button class="btn-secondary admin-btn" @click="router.push('/admin')">{{ $t('admin.button') }}</button>
        <button class="btn-secondary logout-btn" @click="auth.logout()">{{ $t('accounts.signOut') }}</button>
      </div>
    </header>

    <!-- ── Toolbar ────────────────────────────────────────────────────────── -->
    <div class="toolbar">
      <button class="btn-primary" @click="openAddModal">{{ $t('accounts.add.button') }}</button>

      <div class="search-wrap">
        <input
            v-model="search"
            class="search-input"
            :placeholder="$t('accounts.searchPlaceholder')"
            @input="onSearch"
        />
        <button v-if="search" class="search-clear" @click="clearSearch" tabindex="-1">✕</button>
      </div>

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

    <!-- ── Content area: table + detail panel ────────────────────────────── -->
    <div class="content-area">

      <!-- Left: table + pagination -->
      <div class="left-section">
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
                :class="{ 'clickable-row': true, 'selected-row': selectedId === row.id }"
                @click="selectAccount(row.id)"
            >
              <td v-for="col in visibleColumns" :key="col.key">
                {{ formatCell(row[col.key], col.key) }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <span class="page-info">
            {{ $t('accounts.pageInfo', {page: currentPage + 1, total: totalPages, count: totalElements}) }}
          </span>
          <div class="page-controls">
            <button class="btn-secondary" :disabled="currentPage === 0" @click="goPage(currentPage - 1)">
              {{ $t('accounts.prev') }}
            </button>
            <select v-model.number="pageSize" @change="goPage(0)">
              <option v-for="s in [5, 10, 15, 20, 25, 30, 40, 50]" :key="s" :value="s">{{ s }} {{ $t('accounts.perPage') }}</option>
            </select>
            <button class="btn-secondary" :disabled="currentPage >= totalPages - 1" @click="goPage(currentPage + 1)">
              {{ $t('accounts.next') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Right: detail panel -->
      <div class="detail-panel">
        <div class="panel-header">
          <span class="panel-title">{{ $t('detail.title') }}</span>
          <button
            v-if="selectedId"
            class="panel-open-btn"
            :title="$t('detail.openFull')"
            @click="router.push(`/account/${selectedId}`)"
          >ℹ</button>
        </div>

        <div v-if="!selectedId && !detailLoading" class="panel-empty">
          {{ $t('accounts.selectHint') }}
        </div>
        <div v-else-if="detailLoading" class="panel-state">{{ $t('accounts.loading') }}</div>
        <div v-else-if="detailError" class="panel-state error-msg">{{ detailError }}</div>

        <div v-else-if="selectedAccount" class="panel-body">

          <!-- Left: personal data + warnings -->
          <div class="panel-left">
            <div class="panel-section-title">{{ $t('detail.personalInfo') }}</div>
            <table class="detail-table">
              <tbody>
              <tr v-for="field in infoFields" :key="field.key">
                <td class="detail-label">{{ field.label }}</td>
                <td
                    class="detail-value"
                    :class="{ 'badge-blocked': field.key === 'isBlocked' && selectedAccount.isBlocked }"
                >
                  {{ formatField(selectedAccount[field.key], field.key) }}
                </td>
              </tr>
              </tbody>
            </table>

            <div class="panel-section-title">{{ $t('detail.warnings') }}</div>
            <p v-if="!selectedAccount.warnings?.length" class="no-warn">{{ $t('detail.noWarnings') }}</p>
            <div v-else class="warn-table-wrap">
              <table class="warn-table">
                <thead>
                <tr>
                  <th>{{ $t('detail.warnCol.level') }}</th>
                  <th>{{ $t('detail.warnCol.message') }}</th>
                  <th>{{ $t('detail.warnCol.type') }}</th>
                  <th>{{ $t('detail.warnCol.created') }}</th>
                </tr>
                </thead>
                <tbody>
                <tr v-for="(w, i) in selectedAccount.warnings" :key="i">
                  <td><span :class="['level-badge', levelClass(w.level)]">{{ w.level }}</span></td>
                  <td>{{ w.message ?? '—' }}</td>
                  <td>{{ w.type ?? '—' }}</td>
                  <td>{{ w.created ? formatDate(w.created) : '—' }}</td>
                </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Right: avatar + buttons -->
          <div class="panel-right">
            <div class="panel-avatar-wrap">
              <img
                  v-if="selectedAccount.avatar?.objectKey"
                  :src="avatarUrl(selectedAccount.avatar.objectKey)"
                  class="panel-avatar"
                  alt="avatar"
                  @click="lightboxUrl = avatarUrl(selectedAccount.avatar.objectKey)"
              />
              <div v-else class="panel-avatar-placeholder">?</div>
            </div>

            <div class="panel-actions">
              <div class="panel-btn-group">
                <button class="btn-secondary" @click="openUpdateModal">{{ $t('detail.update.button') }}</button>
                <button class="btn-primary" @click="openPayModal">{{ $t('detail.updatePayment') }}</button>
              </div>
              <div class="panel-btn-group">
                <button
                    :class="selectedAccount.isBlocked ? 'btn-unblock' : 'btn-danger'"
                    :disabled="blockLoading"
                    @click="toggleBlock"
                >
                  {{ blockLoading ? '…' : (selectedAccount.isBlocked ? $t('detail.unblock') : $t('detail.block')) }}
                </button>
                <button class="btn-secondary" @click="openAvatarModal">{{ $t('accounts.avatar.button') }}</button>
              </div>
            </div>
            <p v-if="blockError" class="error-msg panel-block-error">{{ blockError }}</p>
            <p v-if="avatarUploadError" class="error-msg panel-block-error">{{ avatarUploadError }}</p>
          </div>

        </div>
      </div>

    </div>
  </div>

  <!-- ── Avatar upload modal ───────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="avatarModalOpen" class="modal-overlay" @click.self="closeAvatarModal">
      <div class="modal modal-camera" :class="{ 'modal-camera--active': cameraMode }">
        <h3 class="modal-title">{{ $t('accounts.avatar.title') }}</h3>

        <!-- ── Camera mode ── -->
        <template v-if="cameraMode">
          <div class="camera-wrap">
            <video ref="videoRef" autoplay playsinline muted class="camera-video"/>
          </div>
          <p v-if="cameraError" class="error-msg">{{ cameraError }}</p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="exitCameraMode">{{ $t('accounts.avatar.cameraBack') }}</button>
            <button class="btn-primary" :disabled="!!cameraError" @click="capturePhoto">{{ $t('accounts.avatar.takePhoto') }}</button>
          </div>
        </template>

        <!-- ── File select mode ── -->
        <template v-else>
          <div class="avatar-drop" @click="avatarInputRef.click()">
            <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" class="avatar-preview" alt="preview"/>
            <template v-else>
              <div class="avatar-drop-icon">🖼</div>
              <p class="avatar-hint">{{ $t('accounts.avatar.hint') }}</p>
            </template>
            <p v-if="avatarFile" class="avatar-file-info">
              {{ avatarFile.name }} · {{ (avatarFile.size / 1024 / 1024).toFixed(2) }} MB
            </p>
          </div>

          <input
              ref="avatarInputRef"
              type="file"
              accept="image/*"
              style="display:none"
              @change="onAvatarFileSelected"
          />

          <p v-if="avatarError" class="error-msg">{{ avatarError }}</p>

          <div class="modal-actions">
            <button class="btn-secondary" @click="enterCameraMode">{{ $t('accounts.avatar.useCamera') }}</button>
            <button class="btn-secondary" :disabled="avatarLoading" @click="closeAvatarModal">{{ $t('detail.modal.cancel') }}</button>
            <button class="btn-primary" :disabled="avatarLoading || !avatarFile || !!avatarError" @click="submitAvatarUpload">
              {{ avatarLoading ? '…' : $t('accounts.avatar.button') }}
            </button>
          </div>
        </template>

      </div>
    </div>
  </Teleport>

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
          <div class="input-with-btn">
            <input v-model="addForm.cardNumber" type="text" required/>
            <button type="button" class="btn-secondary btn-scan" @click="openScanner">{{ $t('accounts.scan.button') }}</button>
          </div>
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

  <!-- ── Payment modal ────────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="payModalOpen" class="modal-overlay" @click.self="closePayModal">
      <div class="modal">
        <h3 class="modal-title">{{ $t('detail.modal.title') }}</h3>

        <div class="field">
          <label>{{ $t('detail.modal.paidUntilInfo') }}</label>
          <span class="info-val">{{ formatCell(selectedAccount?.paidUntil, 'paidUntil') }}</span>
        </div>

        <div class="field">
          <label>{{ $t('detail.modal.productSelect') }}</label>
          <div v-if="payProductsLoading" class="modal-hint">{{ $t('accounts.loading') }}</div>
          <p v-else-if="payProducts.length === 0" class="modal-hint muted">{{ $t('detail.modal.noProducts') }}</p>
          <div v-else class="presets">
            <button
              v-for="p in payProducts"
              :key="p.id"
              type="button"
              class="btn-preset"
              :class="{ 'btn-preset--active': paySelectedProductId === p.id }"
              @click="paySelectedProductId = p.id"
            >
              {{ p.name }}
            </button>
          </div>
        </div>

        <p v-if="payModalError" class="error-msg">{{ payModalError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" :disabled="payModalLoading" @click="closePayModal">
            {{ $t('detail.modal.cancel') }}
          </button>
          <button class="btn-primary" :disabled="payModalLoading || !paySelectedProductId" @click="submitPayment">
            {{ payModalLoading ? '…' : $t('detail.modal.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Edit account modal ──────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="updateModalOpen" class="modal-overlay" @click.self="closeUpdateModal">
      <div class="modal">
        <h3 class="modal-title">{{ $t('detail.update.title') }}</h3>

        <div class="field">
          <label>{{ $t('accounts.col.firstName') }}</label>
          <input v-model="updateForm.firstName" type="text" required/>
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.secondName') }}</label>
          <input v-model="updateForm.secondName" type="text"/>
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.lastName') }}</label>
          <input v-model="updateForm.lastName" type="text" required/>
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.cardNumber') }}</label>
          <input v-model="updateForm.cardNumber" type="text" required/>
        </div>
        <div class="field">
          <label>{{ $t('accounts.col.paidUntil') }}</label>
          <input v-model="updateForm.paidUntil" type="date"/>
        </div>
        <div class="field field-checkbox">
          <label>
            <input v-model="updateForm.isBlocked" type="checkbox"/>
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

  <!-- ── Avatar lightbox ───────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="lightboxUrl" class="lightbox" @click="lightboxUrl = ''">
      <img :src="lightboxUrl" class="lightbox-img" alt="avatar" @click.stop/>
    </div>
  </Teleport>

  <!-- ── Barcode scanner modal ──────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="scannerOpen" class="modal-overlay" @click.self="closeScanner">
      <div class="modal modal-scanner">
        <h3 class="modal-title">{{ $t('accounts.scan.title') }}</h3>
        <div class="camera-wrap">
          <video ref="scanVideoRef" autoplay playsinline muted class="camera-video"/>
        </div>
        <p class="scan-status">{{ scanStatus }}</p>
        <p v-if="scanError" class="error-msg">{{ scanError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeScanner">{{ $t('accounts.scan.cancel') }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import {ref, computed, reactive, onMounted, onBeforeUnmount, watch} from 'vue'
import {useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import {useAuthStore} from '../stores/auth'
import api from '../api'
import LangSwitch from '../components/LangSwitch.vue'
import {BarcodeDetector} from 'barcode-detector/pure'

const router = useRouter()

const {t} = useI18n()
const auth = useAuthStore()

// ── Add account modal ─────────────────────────────────────────────────────────
const addModalOpen = ref(false)
const addLoading = ref(false)
const addError = ref('')
const addForm = reactive({firstName: '', secondName: '', lastName: '', cardNumber: ''})
const addFormValid = computed(() => addForm.firstName.trim() && addForm.lastName.trim() && addForm.cardNumber.trim())

function openAddModal() {
  Object.assign(addForm, {firstName: '', secondName: '', lastName: '', cardNumber: ''})
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

// ── Detail panel fields ───────────────────────────────────────────────────────
const infoFields = computed(() => [
  {key: 'firstName', label: t('accounts.col.firstName')},
  {key: 'secondName', label: t('accounts.col.secondName')},
  {key: 'lastName', label: t('accounts.col.lastName')},
  {key: 'id', label: t('accounts.col.id')},
  {key: 'cardNumber', label: t('accounts.col.cardNumber')},
  {key: 'isBlocked', label: t('accounts.col.isBlocked')},
  {key: 'paidUntil', label: t('accounts.col.paidUntil')},
  {key: 'created', label: t('accounts.col.created')},
  {key: 'updated', label: t('accounts.col.updated')},
])

// ── State ─────────────────────────────────────────────────────────────────────
const rows = ref([])
const loading = ref(false)
const error = ref('')
const currentPage = ref(0)
const pageSize = ref(15)
const totalPages = ref(0)
const totalElements = ref(0)
const sortField = ref('id')
const sortDir = ref('asc')
const search = ref('')
const colMenuOpen = ref(false)
const colToggleRef = ref(null)
const hideBlocked = ref(false)

// ── Detail panel state ────────────────────────────────────────────────────────
const selectedId = ref(null)
const selectedAccount = ref(null)
const detailLoading = ref(false)
const detailError = ref('')

// ── Edit account ──────────────────────────────────────────────────────────────
const updateModalOpen = ref(false)
const updateLoading = ref(false)
const updateError = ref('')
const updateForm = reactive({firstName: '', secondName: '', lastName: '', cardNumber: '', paidUntil: '', isBlocked: false})
const updateFormValid = computed(() => updateForm.firstName.trim() && updateForm.lastName.trim() && updateForm.cardNumber.trim())

function openUpdateModal() {
  const a = selectedAccount.value
  Object.assign(updateForm, {
    firstName: a.firstName ?? '',
    secondName: a.secondName ?? '',
    lastName: a.lastName ?? '',
    cardNumber: a.cardNumber ?? '',
    paidUntil: toDateInputValue(a.paidUntil),
    isBlocked: a.isBlocked ?? false,
  })
  updateError.value = ''
  updateModalOpen.value = true
}

function closeUpdateModal() {
  if (updateLoading.value) return
  updateModalOpen.value = false
}

async function submitUpdate() {
  updateLoading.value = true
  updateError.value = ''
  try {
    const payload = {
      ...selectedAccount.value,
      firstName: updateForm.firstName.trim(),
      secondName: updateForm.secondName.trim() || null,
      lastName: updateForm.lastName.trim(),
      cardNumber: updateForm.cardNumber.trim(),
      paidUntil: updateForm.paidUntil ? `${updateForm.paidUntil}T00:00:00` : null,
      isBlocked: updateForm.isBlocked,
    }
    await api.put(`/account/${selectedAccount.value.id}`, payload)
    updateModalOpen.value = false
    await refreshSelected()
    await fetchPage()
  } catch (e) {
    const d = e.response?.data
    updateError.value = d?.detail || d?.message || (typeof d === 'string' ? d : null)
        || t('detail.update.errorDefault')
  } finally {
    updateLoading.value = false
  }
}

// ── Block / Unblock ───────────────────────────────────────────────────────────
const blockLoading = ref(false)
const blockError = ref('')

async function toggleBlock() {
  blockLoading.value = true
  blockError.value = ''
  try {
    await api.patch(`/account/${selectedAccount.value.id}`, {isBlocked: !selectedAccount.value.isBlocked})
    await refreshSelected()
    await fetchPage()
  } catch (e) {
    const d = e.response?.data
    blockError.value = d?.detail || d?.message || (typeof d === 'string' ? d : null)
        || t('detail.blockError')
  } finally {
    blockLoading.value = false
  }
}

// ── Payment modal ─────────────────────────────────────────────────────────────
const payModalOpen    = ref(false)
const payModalLoading = ref(false)
const payModalError   = ref('')

const payProducts          = ref([])
const payProductsLoading   = ref(false)
const paySelectedProductId = ref(null)

async function fetchPayProducts() {
  payProductsLoading.value = true
  try {
    const { data } = await api.get('/product')
    payProducts.value = data
  } catch {
    payProducts.value = []
  } finally {
    payProductsLoading.value = false
  }
}

function openPayModal() {
  paySelectedProductId.value = null
  payModalError.value        = ''
  payModalOpen.value         = true
  fetchPayProducts()
}

function closePayModal() {
  if (payModalLoading.value) return
  payModalOpen.value = false
}

async function submitPayment() {
  payModalLoading.value = true
  payModalError.value   = ''
  try {
    await api.post('/payment', {
      accountId: selectedAccount.value.id,
      productId: paySelectedProductId.value,
    })
    payModalOpen.value = false
    await refreshSelected()
    await fetchPage()
  } catch (e) {
    const d = e.response?.data
    const msg = d?.detail || d?.message || (typeof d === 'string' ? d : null)
    payModalError.value = msg || `${t('detail.modal.errorDefault')} (HTTP ${e.response?.status ?? 'network error'})`
  } finally {
    payModalLoading.value = false
  }
}

// ── Avatar upload ─────────────────────────────────────────────────────────────
const avatarModalOpen = ref(false)
const avatarFile = ref(null)
const avatarPreviewUrl = ref('')
const avatarLoading = ref(false)
const avatarError = ref('')
const avatarUploadError = ref('')
const avatarInputRef = ref(null)
const lightboxUrl = ref('')

// ── Camera ────────────────────────────────────────────────────────────────────
const cameraMode = ref(false)
const videoRef = ref(null)
const mediaStream = ref(null)
const pendingStream = ref(null)
const cameraError = ref('')

// Assign stream the moment the <video> element appears in the DOM
watch(videoRef, el => {
  if (el && pendingStream.value) {
    el.srcObject = pendingStream.value
    pendingStream.value = null
  }
})

const MINIO_MAX_BYTES = 10 * 1024 * 1024

function openAvatarModal() {
  avatarFile.value = null
  avatarPreviewUrl.value = ''
  avatarError.value = ''
  avatarUploadError.value = ''
  avatarModalOpen.value = true
}

function closeAvatarModal() {
  if (avatarLoading.value) return
  stopCamera()
  cameraMode.value = false
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value)
  avatarFile.value = null
  avatarPreviewUrl.value = ''
  avatarError.value = ''
  avatarUploadError.value = ''
  avatarModalOpen.value = false
}

async function enterCameraMode() {
  cameraError.value = ''
  cameraMode.value = true  // switch UI immediately so user sees camera view
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: false})
    mediaStream.value = stream
    // By the time getUserMedia resolves the <video> is already mounted;
    // fall back to pendingStream watcher if somehow it isn't yet.
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    } else {
      pendingStream.value = stream
    }
  } catch (e) {
    cameraError.value = (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')
        ? t('accounts.avatar.cameraDenied')
        : t('accounts.avatar.cameraError')
  }
}

function exitCameraMode() {
  stopCamera()
  cameraMode.value = false
}

function stopCamera() {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
}

function capturePhoto() {
  const video = videoRef.value
  if (!video || !video.videoWidth) return
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  canvas.toBlob(blob => {
    if (!blob) return
    if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value)
    avatarFile.value = new File([blob], 'camera-capture.jpg', {type: 'image/jpeg'})
    avatarPreviewUrl.value = URL.createObjectURL(blob)
    avatarError.value = ''
    exitCameraMode()
  }, 'image/jpeg', 0.92)
}

function onAvatarFileSelected(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  avatarError.value = ''
  if (!file.type.startsWith('image/')) {
    avatarError.value = t('accounts.avatar.typeError')
    return
  }
  if (file.size > MINIO_MAX_BYTES) {
    avatarError.value = t('accounts.avatar.sizeError')
    return
  }
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value)
  avatarFile.value = file
  avatarPreviewUrl.value = URL.createObjectURL(file)
}

async function submitAvatarUpload() {
  const file = avatarFile.value
  const accountId = selectedAccount.value.id
  closeAvatarModal()
  avatarUploadError.value = ''
  avatarLoading.value = true
  try {
    const {data} = await api.post('/avatar/register-upload', {
      accountId,
      fileName: file.name,
      contentType: file.type,
    })
    const uploadUrl = data.url.replace(/^https?:\/\/[^/]+/, '/minio-upload')
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {'Content-Type': file.type},
    })
    if (!uploadRes.ok) throw new Error(`${t('accounts.avatar.errorDefault')} (HTTP ${uploadRes.status})`)
    await refreshSelected()
  } catch (e) {
    avatarUploadError.value = e.message || t('accounts.avatar.errorDefault')
  } finally {
    avatarLoading.value = false
  }
}

function avatarUrl(objectKey) {
  return `/storage/avatars/${objectKey}`
}

async function refreshSelected() {
  try {
    const {data} = await api.get(`/account/${selectedId.value}`)
    selectedAccount.value = data
  } catch {
    // keep stale data on refresh failure
  }
}

function toDateInputValue(value) {
  if (!value) return ''
  if (Array.isArray(value)) {
    const [y, m, d] = value
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  return String(value).slice(0, 10)
}

// ── Select account (detail panel) ─────────────────────────────────────────────
async function selectAccount(id) {
  if (selectedId.value === id) {
    selectedId.value = null
    selectedAccount.value = null
    return
  }
  selectedId.value = id
  selectedAccount.value = null
  detailLoading.value = true
  detailError.value = ''
  try {
    const {data} = await api.get(`/account/${id}`)
    selectedAccount.value = data
  } catch (e) {
    detailError.value = e.response?.data?.detail || t('detail.errorDefault')
  } finally {
    detailLoading.value = false
  }
}

// ── Filtered rows (hideBlocked is still client-side; search is server-side) ───
const filteredRows = computed(() => {
  if (!hideBlocked.value) return rows.value
  return rows.value.filter(row => !row.isBlocked)
})

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchPage() {
  loading.value = true
  error.value = ''
  try {
    const q = search.value.trim()
    const {data} = await api.get('/account/page', {
      params: {
        page: currentPage.value,
        size: pageSize.value,
        sort: `${sortField.value},${sortDir.value}`,
        ...(q && { query: q }),
      }
    })
    rows.value = data.content ?? []
    totalPages.value = data.page?.totalPages ?? 0
    totalElements.value = data.page?.totalElements ?? 0
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

function clearSearch() {
  search.value = ''
  currentPage.value = 0
  fetchPage()
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
      ? new Date(Date.UTC(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0, value[5] ?? 0))
      : new Date(value)
  if (isNaN(d)) return String(value)
  return dateOnly ? d.toLocaleDateString() : d.toLocaleString()
}

function levelClass(level) {
  if (!level) return ''
  if (level === 'CRITICAL_WARNING' || level === 'ERROR') return 'level-critical'
  if (level === 'WARNING') return 'level-warning'
  if (level === 'INFO') return 'level-info'
  return ''
}

// ── Barcode scanner ───────────────────────────────────────────────────────────
const scannerOpen = ref(false)
const scanVideoRef = ref(null)
const scanStream = ref(null)
const scanError = ref('')
const scanStatus = ref('')
const scanAnimId = ref(null)
const pendingScanStream = ref(null)

watch(scanVideoRef, el => {
  if (el && pendingScanStream.value) {
    el.srcObject = pendingScanStream.value
    pendingScanStream.value = null
    startScanLoop()
  }
})

async function openScanner() {
  scanError.value = ''
  scanStatus.value = t('accounts.scan.scanning')
  scannerOpen.value = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: 'environment'}, audio: false})
    scanStream.value = stream
    if (scanVideoRef.value) {
      scanVideoRef.value.srcObject = stream
      startScanLoop()
    } else {
      pendingScanStream.value = stream
    }
  } catch (e) {
    scanError.value = (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')
        ? t('accounts.scan.cameraDenied')
        : t('accounts.scan.cameraError')
  }
}

function startScanLoop() {
  const detector = new BarcodeDetector({
    formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'data_matrix']
  })
  const video = scanVideoRef.value

  async function scan() {
    if (!scannerOpen.value) return
    if (video.readyState >= 2) {
      try {
        const barcodes = await detector.detect(video)
        if (barcodes.length > 0) {
          addForm.cardNumber = barcodes[0].rawValue
          closeScanner()
          return
        }
      } catch {
        // continue scanning on detection error
      }
    }
    scanAnimId.value = requestAnimationFrame(scan)
  }

  scanAnimId.value = requestAnimationFrame(scan)
}

function stopScanStream() {
  if (scanAnimId.value) {
    cancelAnimationFrame(scanAnimId.value)
    scanAnimId.value = null
  }
  if (scanStream.value) {
    scanStream.value.getTracks().forEach(track => track.stop())
    scanStream.value = null
  }
}

function closeScanner() {
  stopScanStream()
  pendingScanStream.value = null
  scannerOpen.value = false
  scanError.value = ''
  scanStatus.value = ''
}

// ── Close column menu on outside click ───────────────────────────────────────
function handleOutsideClick(e) {
  if (colToggleRef.value && !colToggleRef.value.contains(e.target)) {
    colMenuOpen.value = false
  }
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    lightboxUrl.value = ''
    if (scannerOpen.value) closeScanner()
  }
}

onMounted(() => {
  fetchPage()
  document.addEventListener('click', handleOutsideClick)
  document.addEventListener('keydown', onKeyDown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', onKeyDown)
  stopScanStream()
  stopCamera()
})
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
  cursor: pointer;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin-btn,
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

.search-wrap {
  position: relative;
  max-width: 280px;
  width: 100%;
}

.search-input {
  width: 100%;
  padding-right: 30px;
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0;
  width: 16px;
  height: 16px;
  font-size: 11px;
  line-height: 1;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-clear:hover {
  color: var(--text);
  opacity: 1;
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

.dot.white { background: #ffffff; }
.dot.yellow { background: #fff9c4; }
.dot.lightred { background: #ffcdd2; }
.dot.brightred { background: #ef5350; }

/* Content area */
.content-area {
  display: flex;
  gap: 16px;
  padding: 16px 24px 20px;
  align-items: flex-start;
  flex: 1;
}

/* Left section */
.left-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

/* Table */
.table-wrap {
  overflow-x: auto;
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

tr.selected-row td {
  background-color: rgba(57, 73, 171, 0.15) !important;
  color: var(--text) !important;
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
  padding: 14px 0 0;
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

/* Detail panel */
.detail-panel {
  width: 760px;
  min-width: 500px;
  flex-shrink: 0;
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 56px - 60px - 32px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.panel-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.panel-left {
  flex: 1;
  overflow-y: auto;
  border-right: 1px solid var(--border);
  min-width: 0;
}

.panel-right {
  width: 240px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  gap: 0;
  overflow-y: auto;
}

.panel-header {
  padding: 14px 16px 12px;
  border-bottom: 2px solid var(--primary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: var(--primary);
  flex: 1;
}

.panel-open-btn {
  background: none;
  border: none;
  padding: 0 2px;
  font-size: 15px;
  color: var(--primary);
  cursor: pointer;
  line-height: 1;
  opacity: .7;
  transition: opacity .15s;
}
.panel-open-btn:hover { opacity: 1; }

.panel-empty {
  padding: 48px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.5;
}

.panel-state {
  padding: 20px 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}

.panel-section-title {
  padding: 10px 16px 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .4px;
  color: var(--primary);
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  border-top: 1px solid var(--border);
}

.panel-section-title:first-of-type {
  border-top: none;
}

/* Detail info table */
.detail-table {
  width: 100%;
  border-collapse: collapse;
}

.detail-label {
  padding: 8px 10px 8px 16px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: .3px;
  width: 42%;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

.detail-value {
  padding: 8px 16px 8px 10px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  border-bottom: 1px solid var(--border);
  word-break: break-word;
}

.detail-table tr:last-child .detail-label,
.detail-table tr:last-child .detail-value {
  border-bottom: none;
}

.badge-blocked {
  color: var(--danger);
  font-weight: 700;
}

.no-warn {
  color: var(--text-muted);
  font-size: 13px;
  padding: 12px 16px;
}

/* Warnings table inside panel */
.warn-table-wrap {
  overflow-x: auto;
}

.warn-table {
  width: 100%;
  border-collapse: collapse;
}

.warn-table thead tr {
  background: var(--primary);
  color: #fff;
}

.warn-table th {
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .4px;
  text-transform: uppercase;
  white-space: nowrap;
  text-align: left;
}

.warn-table td {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  vertical-align: middle;
}

.warn-table tr:last-child td {
  border-bottom: none;
}

.level-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .4px;
  white-space: nowrap;
}

.level-critical { background: #ef5350; color: #fff; }
.level-warning  { background: #ffcdd2; color: #b71c1c; }
.level-info     { background: #fff9c4; color: #795548; }

/* Panel action buttons */
.panel-actions {
  display: flex;
  flex-direction: column;
  gap: 34px;
  width: 100%;
}

.panel-btn-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-btn-group button {
  width: 100%;
}

.btn-unblock {
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

.panel-block-error {
  padding: 0 16px 12px;
}


/* Panel avatar */
.panel-avatar-wrap {
  margin-bottom: 20px;
}

.panel-avatar {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border);
  display: block;
  cursor: zoom-in;
  transition: opacity .15s;
}

.panel-avatar:hover { opacity: .85; }

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

.panel-avatar-placeholder {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 3px dashed var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56px;
  color: var(--border);
  background: var(--bg);
}

/* Avatar upload modal — wider when camera is active */
.modal-camera--active {
  max-width: 560px;
}

.camera-wrap {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: #000;
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 14px;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Avatar upload modal */
.avatar-drop {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 20px 16px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s;
  margin-bottom: 14px;
}

.avatar-drop:hover {
  border-color: var(--primary-light);
}

.avatar-drop-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.avatar-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.avatar-preview {
  width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: var(--radius);
  margin-bottom: 8px;
}

.avatar-file-info {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 8px;
  word-break: break-all;
}

.presets {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

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
.btn-preset--active { background: var(--primary); color: #fff; }
.info-val { font-size: 14px; color: var(--text); }
.modal-hint { font-size: 13px; color: var(--text-muted); padding: 4px 0; }

.input-with-btn {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-with-btn input {
  flex: 1;
  min-width: 0;
}

.btn-scan {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 12px;
  padding: 7px 10px;
}

.modal-scanner {
  max-width: 560px;
}

.scan-status {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  margin: 0 0 4px;
}

.field-checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
}

.field-checkbox input {
  width: auto;
  cursor: pointer;
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
