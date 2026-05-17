<template>
  <div class="layout">
    <!-- ── Header ──────────────────────────────────────────────────────────── -->
    <header class="topbar">
      <span class="topbar-brand" @click="router.push('/')">{{ $t('brand') }}</span>
      <div class="topbar-right">
        <ThemeSwitch />
        <LangSwitch />
        <button class="btn-secondary admin-btn" @click="router.push('/admin')">{{ $t('admin.button') }}</button>
        <button class="btn-secondary logout-btn" @click="auth.logout()">{{ $t('accounts.signOut') }}</button>
      </div>
    </header>

    <!-- ── Content ─────────────────────────────────────────────────────────── -->
    <div class="content">
      <div class="page-header">
        <button class="btn-secondary back-btn" @click="router.back()">{{ $t('detail.back') }}</button>
        <h1 class="page-title">
          {{ $t('detail.title') }}
          <span v-if="account?.demo" class="badge-demo">{{ $t('detail.demo') }}</span>
        </h1>
        <div v-if="account" class="btn-groups">
          <div class="btn-group">
            <button class="btn-secondary" @click="openUpdateModal">
              {{ $t('detail.update.button') }}
            </button>
            <button class="btn-primary" @click="openModal">
              {{ $t('detail.updatePayment') }}
            </button>
          </div>
          <div class="btn-group">
            <button
              :class="account.isBlocked ? 'btn-unblock' : 'btn-danger'"
              :disabled="blockLoading"
              @click="toggleBlock"
            >
              {{ blockLoading ? '…' : (account.isBlocked ? $t('detail.unblock') : $t('detail.block')) }}
            </button>
            <button class="btn-danger" @click="openDeleteAccount">
              {{ $t('detail.delete.button') }}
            </button>
          </div>
        </div>
      </div>
      <p v-if="blockError" class="error-msg block-error">{{ blockError }}</p>

      <div v-if="loading" class="state-msg">{{ $t('accounts.loading') }}</div>
      <div v-else-if="error" class="state-msg error-msg">{{ error }}</div>
      <div v-else-if="!account" class="state-msg">{{ $t('detail.notFound') }}</div>

      <template v-else>
        <!-- ── Personal info card ─────────────────────────────────────────── -->
        <div class="card" :class="{ 'card-demo': account.demo }">
          <div class="card-header">
            <div class="card-title-row">
              <h2 class="card-title">{{ $t('detail.personalInfo') }}</h2>
              <span v-if="account.demo" class="badge-demo badge-demo-lg">{{ $t('detail.demo') }}</span>
            </div>
            <div class="avatar-wrap">
              <img
                v-if="account.avatar?.objectKey"
                :src="`/storage/avatars/${account.avatar.objectKey}`"
                class="account-avatar"
                alt="avatar"
                @click="lightboxUrl = `/storage/avatars/${account.avatar.objectKey}`"
              />
              <div v-else class="account-avatar-placeholder">?</div>
              <button class="btn-secondary avatar-upload-btn" @click="openAvatarModal">
                {{ $t('accounts.avatar.button') }}
              </button>
              <p v-if="avatarUploadError" class="avatar-upload-error">{{ avatarUploadError }}</p>
            </div>
          </div>
          <div class="info-grid">
            <div class="info-item" v-for="field in infoFields" :key="field.key">
              <span class="info-label">{{ field.label }}</span>
              <span
                class="info-value"
                :class="{
                  'badge-blocked':   field.key === 'isBlocked' && account.isBlocked,
                  'highlight-paid':  field.key === 'paidUntil',
                  'highlight-paid--expired': field.key === 'paidUntil' && isPaidExpired,
                }"
              >
                {{ formatField(account[field.key], field.key) }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── Lower grid: warnings + payment history ───────────────────── -->
        <div class="lower-grid">

          <!-- Warnings -->
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
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(w, i) in account.warnings" :key="i">
                    <td><span :class="['level-badge', levelClass(w.level)]">{{ w.level }}</span></td>
                    <td>{{ w.message ?? '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Payment history -->
          <div class="card">
            <h2 class="card-title">{{ $t('detail.payments.title') }}</h2>

            <div v-if="paymentsLoading" class="no-warn">{{ $t('accounts.loading') }}</div>
            <p v-else-if="paymentsError" class="no-warn error-msg">{{ paymentsError }}</p>
            <p v-else-if="payments.length === 0" class="no-warn">{{ $t('detail.payments.empty') }}</p>

            <div v-else class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>{{ $t('detail.payments.col.created') }}</th>
                    <th>{{ $t('detail.payments.col.dateFrom') }}</th>
                    <th>{{ $t('detail.payments.col.dateTo') }}</th>
                    <th>{{ $t('detail.payments.col.period') }}</th>
                    <th>{{ $t('detail.payments.col.description') }}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in payments" :key="p.id">
                    <td class="pay-date">{{ formatDate(p.created) }}</td>
                    <td class="pay-date">{{ formatDate(p.dateFrom, true) }}</td>
                    <td class="pay-date">{{ formatDate(p.dateTo, true) }}</td>
                    <td>{{ formatPeriod(p.product?.period ?? p.period) }}</td>
                    <td>{{ p.product?.description ?? p.description ?? '—' }}</td>
                    <td class="pay-del">
                      <button class="btn-del-pay" :disabled="deletePaymentLoading" @click="openDeletePayment(p)" title="Remove">✕</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
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
          <label>{{ $t('detail.modal.paidUntilInfo') }}</label>
          <span class="info-val">{{ formatField(account?.paidUntil, 'paidUntil') }}</span>
        </div>

        <div class="field">
          <label>{{ $t('detail.modal.dateFrom') }}</label>
          <input type="date" v-model="modalDateFrom"/>
        </div>

        <div class="field">
          <label>{{ $t('detail.modal.productSelect') }}</label>
          <div v-if="productsLoading" class="modal-hint">{{ $t('accounts.loading') }}</div>
          <p v-else-if="products.length === 0" class="modal-hint muted">{{ $t('detail.modal.noProducts') }}</p>
          <div v-else class="presets">
            <button
              v-for="p in products"
              :key="p.id"
              type="button"
              class="btn-preset"
              :class="{ 'btn-preset--active': selectedProductId === p.id }"
              @click="selectedProductId = p.id"
            >
              {{ p.description }}
            </button>
          </div>
        </div>

        <p v-if="modalError" class="error-msg">{{ modalError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" :disabled="modalLoading" @click="closeModal">
            {{ $t('detail.modal.cancel') }}
          </button>
          <button class="btn-primary" :disabled="modalLoading || !selectedProductId" @click="submitPayment">
            {{ modalLoading ? '…' : $t('detail.modal.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Avatar upload modal ──────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="avatarModalOpen" class="modal-overlay" @click.self="closeAvatarModal">
      <div class="modal modal-camera" :class="{ 'modal-camera--active': cameraMode }">
        <h3 class="modal-title">{{ $t('accounts.avatar.title') }}</h3>

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

  <!-- ── Delete account modal ─────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="deleteAccountOpen" class="modal-overlay" @click.self="closeDeleteAccount">
      <div class="modal">
        <h3 class="modal-title">{{ $t('detail.delete.confirmTitle') }}</h3>
        <p class="modal-msg">{{ $t('detail.delete.confirmMsg') }}</p>
        <p v-if="deleteAccountError" class="error-msg">{{ deleteAccountError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" :disabled="deleteAccountLoading" @click="closeDeleteAccount">
            {{ $t('detail.delete.cancel') }}
          </button>
          <button class="btn-danger" :disabled="deleteAccountLoading" @click="confirmDeleteAccount">
            {{ deleteAccountLoading ? '…' : $t('detail.delete.confirmBtn') }}
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

  <!-- ── Delete payment confirmation modal ────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="deletePaymentOpen" class="modal-overlay" @click.self="closeDeletePayment">
      <div class="modal">
        <h3 class="modal-title">{{ $t('detail.payments.deleteTitle') }}</h3>
        <p class="confirm-msg">{{ $t('detail.payments.deleteConfirm') }}</p>
        <p v-if="deletePaymentError" class="error-msg">{{ deletePaymentError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" :disabled="deletePaymentLoading" @click="closeDeletePayment">
            {{ $t('detail.modal.cancel') }}
          </button>
          <button class="btn-danger" :disabled="deletePaymentLoading" @click="confirmDeletePayment">
            {{ deletePaymentLoading ? '…' : $t('detail.payments.deleteConfirmBtn') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import LangSwitch from '../components/LangSwitch.vue'
import ThemeSwitch from '../components/ThemeSwitch.vue'

const route  = useRoute()
const router = useRouter()
const { t }  = useI18n()
const auth   = useAuthStore()

const lightboxUrl  = ref('')
const account      = ref(null)
const loading      = ref(false)
const error        = ref('')

const payments        = ref([])
const paymentsLoading = ref(false)
const paymentsError   = ref('')

async function fetchPayments() {
  paymentsLoading.value = true
  paymentsError.value   = ''
  try {
    const { data } = await api.get(`/payment/user/${route.params.id}`)
    payments.value = data.slice().sort((a, b) => {
      const ta = parseBackendDate(a.dateTo)
      const tb = parseBackendDate(b.dateTo)
      if (ta && tb) return tb - ta
      if (ta) return -1
      if (tb) return 1
      return 0
    })
  } catch (e) {
    paymentsError.value = e.response?.data?.detail || t('detail.payments.error')
  } finally {
    paymentsLoading.value = false
  }
}

function parseBackendDate(value) {
  if (!value) return null
  if (Array.isArray(value)) {
    return new Date(Date.UTC(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0, value[5] ?? 0))
  }
  return new Date(value)
}

const isPaidExpired = computed(() => {
  if (!account.value?.paidUntil) return true
  return parseBackendDate(account.value.paidUntil) < new Date()
})

const modalOpen    = ref(false)
const modalLoading = ref(false)
const modalError   = ref('')

const products           = ref([])
const productsLoading    = ref(false)
const selectedProductId  = ref(null)
const modalDateFrom      = ref('')

async function fetchProducts() {
  productsLoading.value = true
  try {
    const { data } = await api.get('/product')
    products.value = data
  } catch {
    products.value = []
  } finally {
    productsLoading.value = false
  }
}

const blockLoading = ref(false)
const blockError   = ref('')

const updateModalOpen = ref(false)
const updateLoading   = ref(false)
const updateError     = ref('')
const updateForm      = reactive({ firstName: '', secondName: '', lastName: '', cardNumber: '', isBlocked: false })
const updateFormValid = computed(() => updateForm.firstName.trim() && updateForm.lastName.trim() && updateForm.cardNumber.trim())

// ── Field definitions ─────────────────────────────────────────────────────────
const infoFields = computed(() => [
  { key: 'firstName',  label: t('accounts.col.firstName') },
  { key: 'secondName', label: t('accounts.col.secondName') },
  { key: 'lastName',   label: t('accounts.col.lastName') },
  { key: 'id',         label: t('accounts.col.id') },
  { key: 'cardNumber', label: t('accounts.col.cardNumber') },
  { key: 'phone',      label: t('accounts.col.phone') },
  { key: 'isBlocked',  label: t('accounts.col.isBlocked') },
  { key: 'paidUntil',  label: t('accounts.col.paidUntil') },
  { key: 'registrationDate', label: t('accounts.col.registrationDate') },
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
  fetchPayments()
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
      ...account.value,
      firstName:  updateForm.firstName.trim(),
      secondName: updateForm.secondName.trim() || null,
      lastName:   updateForm.lastName.trim(),
      cardNumber: updateForm.cardNumber.trim(),
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
  selectedProductId.value = null
  modalDateFrom.value     = new Date().toISOString().slice(0, 10)
  modalError.value        = ''
  modalOpen.value         = true
  fetchProducts()
}

function closeModal() {
  if (modalLoading.value) return
  modalOpen.value = false
}

async function submitPayment() {
  modalLoading.value = true
  modalError.value   = ''
  try {
    const product = products.value.find(p => p.id === selectedProductId.value)
    const dateFrom = `${modalDateFrom.value}T00:00:00`
    await api.post('/payment', {
      accountId: Number(route.params.id),
      product,
      dateFrom,
      dateTo: applyPeriod(dateFrom, product.period),
    })
    modalOpen.value = false
    await fetchAccount()
    fetchPayments()
  } catch (e) {
    const data = e.response?.data
    const msg  = data?.detail || data?.message || (typeof data === 'string' ? data : null)
    modalError.value = msg || `${t('detail.modal.errorDefault')} (HTTP ${e.response?.status ?? 'network error'})`
  } finally {
    modalLoading.value = false
  }
}

// ── Delete payment ────────────────────────────────────────────────────────────
const deletePaymentOpen    = ref(false)
const deletePaymentLoading = ref(false)
const deletePaymentError   = ref('')
const paymentToDelete      = ref(null)

function openDeletePayment(payment) {
  paymentToDelete.value    = payment
  deletePaymentError.value = ''
  deletePaymentOpen.value  = true
}

function closeDeletePayment() {
  if (deletePaymentLoading.value) return
  deletePaymentOpen.value = false
}

async function confirmDeletePayment() {
  deletePaymentLoading.value = true
  deletePaymentError.value   = ''
  try {
    await api.delete(`/payment/${paymentToDelete.value.id}`)
    deletePaymentOpen.value = false
    await fetchAccount()
    fetchPayments()
  } catch (e) {
    const data = e.response?.data
    deletePaymentError.value = data?.detail || data?.message || (typeof data === 'string' ? data : null)
      || `${t('detail.payments.deleteError')} (HTTP ${e.response?.status ?? 'network error'})`
  } finally {
    deletePaymentLoading.value = false
  }
}

// ── Delete account ────────────────────────────────────────────────────────────
const deleteAccountOpen    = ref(false)
const deleteAccountLoading = ref(false)
const deleteAccountError   = ref('')

function openDeleteAccount() {
  deleteAccountError.value = ''
  deleteAccountOpen.value  = true
}

function closeDeleteAccount() {
  if (deleteAccountLoading.value) return
  deleteAccountOpen.value = false
}

async function confirmDeleteAccount() {
  deleteAccountLoading.value = true
  deleteAccountError.value   = ''
  try {
    await api.delete(`/account/${route.params.id}`)
    router.push('/')
  } catch (e) {
    const data = e.response?.data
    deleteAccountError.value = data?.detail || data?.message || (typeof data === 'string' ? data : null)
      || t('detail.delete.error')
  } finally {
    deleteAccountLoading.value = false
  }
}

// ── Avatar upload ─────────────────────────────────────────────────────────────
const avatarModalOpen    = ref(false)
const avatarFile         = ref(null)
const avatarPreviewUrl   = ref('')
const avatarLoading      = ref(false)
const avatarError        = ref('')
const avatarUploadError  = ref('')
const avatarInputRef     = ref(null)

const cameraMode    = ref(false)
const videoRef      = ref(null)
const mediaStream   = ref(null)
const pendingStream = ref(null)
const cameraError   = ref('')

const MINIO_MAX_BYTES = 10 * 1024 * 1024

watch(videoRef, el => {
  if (el && pendingStream.value) {
    el.srcObject = pendingStream.value
    pendingStream.value = null
  }
})

function openAvatarModal() {
  avatarFile.value       = null
  avatarPreviewUrl.value = ''
  avatarError.value      = ''
  avatarUploadError.value = ''
  avatarModalOpen.value  = true
}

function closeAvatarModal() {
  if (avatarLoading.value) return
  stopCamera()
  cameraMode.value = false
  if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value)
  avatarFile.value        = null
  avatarPreviewUrl.value  = ''
  avatarError.value       = ''
  avatarUploadError.value = ''
  avatarModalOpen.value   = false
}

async function enterCameraMode() {
  cameraError.value = ''
  cameraMode.value  = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    mediaStream.value = stream
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
  canvas.width  = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  canvas.toBlob(blob => {
    if (!blob) return
    if (avatarPreviewUrl.value) URL.revokeObjectURL(avatarPreviewUrl.value)
    avatarFile.value       = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' })
    avatarPreviewUrl.value = URL.createObjectURL(blob)
    avatarError.value      = ''
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
  avatarFile.value       = file
  avatarPreviewUrl.value = URL.createObjectURL(file)
}

async function submitAvatarUpload() {
  const file      = avatarFile.value
  const accountId = route.params.id
  closeAvatarModal()
  avatarUploadError.value = ''
  avatarLoading.value     = true
  try {
    const { data } = await api.post('/avatar/register-upload', {
      accountId,
      fileName:    file.name,
      contentType: file.type,
    })
    const uploadUrl = data.url.replace(/^https?:\/\/[^/]+/, '/minio-upload')
    const uploadRes = await fetch(uploadUrl, {
      method:  'PUT',
      body:    file,
      headers: { 'Content-Type': file.type },
    })
    if (!uploadRes.ok) throw new Error(`${t('accounts.avatar.errorDefault')} (HTTP ${uploadRes.status})`)
    await fetchAccount()
  } catch (e) {
    avatarUploadError.value = e.message || t('accounts.avatar.errorDefault')
  } finally {
    avatarLoading.value = false
  }
}

// ── Formatting ────────────────────────────────────────────────────────────────
function formatField(value, key) {
  if (value == null || value === '') return '—'
  if (key === 'isBlocked') return value ? t('accounts.yes') : t('accounts.no')
  if (key === 'paidUntil') return formatDate(value, true)
  if (key === 'created' || key === 'updated' || key === 'registrationDate') return formatDate(value, false)
  return value
}

function applyPeriod(dateStr, period) {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number)
  let years = 0, months = 0, days = 0
  if (typeof period === 'string') {
    const match = period.match(/P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?/)
    if (match) {
      years  = parseInt(match[1] || 0)
      months = parseInt(match[2] || 0)
      days   = parseInt(match[3] || 0)
    }
  } else if (period && typeof period === 'object') {
    years  = period.years  ?? 0
    months = period.months ?? 0
    days   = period.days   ?? 0
  }
  const result = new Date(y + years, m - 1 + months, d + days)
  const ry = result.getFullYear()
  const rm = String(result.getMonth() + 1).padStart(2, '0')
  const rd = String(result.getDate()).padStart(2, '0')
  return `${ry}-${rm}-${rd}T00:00:00`
}

function formatDate(value, dateOnly = false) {
  if (!value) return '—'
  const d = Array.isArray(value)
    ? new Date(Date.UTC(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0, value[5] ?? 0))
    : new Date(value)
  if (isNaN(d)) return String(value)
  return dateOnly ? d.toLocaleDateString() : d.toLocaleString()
}

function formatPeriod(p) {
  if (!p) return '—'
  const str = typeof p === 'string' ? p : JSON.stringify(p)
  const m = str.match(/^P(?:(-?\d+)Y)?(?:(-?\d+)M)?(?:(-?\d+)D)?$/)
  if (!m) return str
  const years  = parseInt(m[1] || 0)
  const months = parseInt(m[2] || 0)
  const days   = parseInt(m[3] || 0)
  const parts  = []
  if (years)  parts.push(t('detail.payments.years',  { n: years }))
  if (months) parts.push(t('detail.payments.months', { n: months }))
  if (days)   parts.push(t('detail.payments.days',   { n: days }))
  return parts.length ? parts.join(' ') : '—'
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
  padding: 0 16px;
  height: 50px;
  background: var(--primary);
  color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,.2);
}
.topbar-brand { font-size: 16px; font-weight: 700; letter-spacing: .3px; cursor: pointer; }
.topbar-right { display: flex; align-items: center; gap: 10px; }
.admin-btn,
.logout-btn { color: #fff; border-color: rgba(255,255,255,.5); font-size: 13px; padding: 6px 12px; }

/* Content */
.content { flex: 1; padding: 16px 20px; max-width: 960px; width: 100%; margin: 0 auto; }

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.back-btn { flex-shrink: 0; }
.page-title { font-size: 20px; font-weight: 700; color: var(--text); flex: 1; }
.btn-groups { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; flex-shrink: 0; }
.btn-group { display: flex; gap: 8px; align-items: center; }
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

.modal-msg {
  font-size: 14px;
  color: var(--text);
  margin-bottom: 16px;
  line-height: 1.5;
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
.btn-preset--active { background: var(--primary); color: #fff; }
.info-val { font-size: 14px; color: var(--text); }
.modal-hint { font-size: 13px; color: var(--text-muted); padding: 4px 0; }

.field-checkbox label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: var(--text); }
.field-checkbox input { width: auto; cursor: pointer; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }

.pay-del { width: 36px; padding: 6px 4px; text-align: center; }
.btn-del-pay {
  background: none;
  border: none;
  color: var(--danger);
  cursor: pointer;
  font-size: 13px;
  padding: 2px 6px;
  border-radius: var(--radius);
  transition: background 0.15s;
}
.btn-del-pay:hover:not(:disabled) { background: #ffebee; }
.btn-del-pay:disabled { opacity: 0.4; cursor: not-allowed; }
.confirm-msg { font-size: 14px; color: var(--text); margin-bottom: 16px; }

/* State */
.state-msg { padding: 40px; text-align: center; color: var(--text-muted); background: var(--surface); border-radius: var(--radius); box-shadow: var(--shadow); }

/* Cards */
.card {
  background: var(--surface);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px 20px;
  margin-bottom: 14px;
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

.card-header .card-title-row { flex: 1; }
.card-header .card-title { margin-bottom: 0; }

.avatar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.account-avatar {
  width: 100px;
  height: 100px;
  border-radius: var(--radius);
  object-fit: contain;
  border: 1px solid var(--border);
  cursor: zoom-in;
  transition: opacity .15s;
  background: var(--bg);
}

.account-avatar:hover { opacity: .85; }

.account-avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: var(--radius);
  background: var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: var(--text-muted);
}

.avatar-upload-btn { font-size: 12px; padding: 5px 12px; }
.avatar-upload-error { font-size: 12px; color: var(--danger); text-align: center; margin: 0; }

/* Avatar modal drop zone */
.avatar-drop {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: border-color .15s;
  min-height: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.avatar-drop:hover { border-color: var(--primary); }
.avatar-drop-icon { font-size: 32px; }
.avatar-hint { font-size: 13px; color: var(--text-muted); margin: 0; }
.avatar-preview { max-width: 100%; max-height: 200px; border-radius: var(--radius); object-fit: contain; }
.avatar-file-info { font-size: 11px; color: var(--text-muted); margin: 0; }

/* Camera */
.modal-camera         { max-width: 480px; }
.modal-camera--active { max-width: 520px; }
.camera-wrap { width: 100%; aspect-ratio: 4/3; background: #000; border-radius: var(--radius); overflow: hidden; }
.camera-video { width: 100%; height: 100%; object-fit: cover; display: block; }

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

/* Lower two-column grid */
.lower-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  align-items: start;
}

.pay-date { white-space: nowrap; }

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
.highlight-paid {
  color: #2e7d32;
  font-weight: 700;
  background: #e8f5e9;
  border-radius: 4px;
  padding: 2px 8px;
}
.highlight-paid--expired {
  color: var(--danger);
  background: #ffebee;
}

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

/* Demo badge */
.badge-demo {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .6px;
  text-transform: uppercase;
  background: #ff8f00;
  color: #fff;
  vertical-align: middle;
  margin-left: 10px;
}
.badge-demo-lg {
  font-size: 12px;
  padding: 3px 10px;
  margin-left: 0;
}
.card-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 0;
}
.card-demo {
  border-left: 4px solid #ff8f00;
}

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

/* ── Responsive: 4:3 / narrow screens ──────────────────────────────────────── */
@media (max-width: 720px) {
  .lower-grid {
    grid-template-columns: 1fr;
  }
  .page-header {
    gap: 8px;
  }
  .btn-groups {
    align-items: stretch;
    width: 100%;
  }
  .btn-group {
    flex-wrap: wrap;
  }
}
</style>
