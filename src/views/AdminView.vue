<template>
  <div class="layout">
    <header class="topbar">
      <span class="topbar-brand" @click="router.push('/')">{{ $t('brand') }}</span>
      <div class="topbar-right">
        <ThemeSwitch />
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
          :class="{ 'tab-active': activeTab === 'products' }"
          @click="activeTab = 'products'"
        >
          {{ $t('admin.tabs.products') }}
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-active': activeTab === 'notes' }"
          @click="activeTab = 'notes'"
        >
          {{ $t('admin.tabs.notes') }}
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-active': activeTab === 'instructions' }"
          @click="activeTab = 'instructions'"
        >
          {{ $t('admin.tabs.instructions') }}
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-active': activeTab === 'accountsManage' }"
          @click="activeTab = 'accountsManage'"
        >
          {{ $t('admin.tabs.accountsManage') }}
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-active': activeTab === 'service' }"
          @click="activeTab = 'service'"
        >
          {{ $t('admin.tabs.service') }}
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
            <div class="metrics-accounts">
              <div class="metric-tile metric-total">
                <div class="metric-label">{{ $t('admin.analytics.accountsTotal') }}</div>
                <div class="metric-value">{{ summary.accountsTotal }}</div>
              </div>
              <div class="metric-tile metric-inactive">
                <div class="metric-label">{{ $t('admin.analytics.accountsInactive') }}</div>
                <div class="metric-value">{{ summary.accountsInactive }}</div>
              </div>
            </div>

            <div class="metrics-stats">
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
            <div class="control-group">
              <input
                v-if="chartRange === 'week'"
                type="week"
                v-model="chartWeek"
                class="chart-picker-input"
              />
              <input
                v-else-if="chartRange === 'month'"
                type="month"
                v-model="chartMonth"
                class="chart-picker-input"
              />
              <input
                v-else
                type="number"
                v-model.number="chartYear"
                :min="2020"
                :max="new Date().getFullYear()"
                class="chart-picker-input chart-year-input"
              />
              <button
                class="btn-secondary btn-sm"
                @click="resetChartPicker"
              >{{ $t('admin.analytics.last') }}</button>
            </div>
          </div>

          <div v-if="chartLoading && !chartData.length" class="panel-state">{{ $t('admin.backups.loading') }}</div>
          <div v-else-if="chartError" class="panel-state status-err">{{ chartError }}</div>
          <div v-else-if="!chartData.length" class="panel-state muted">{{ $t('admin.analytics.noData') }}</div>

          <div v-else class="chart-wrap" :class="{ 'chart-dimmed': chartLoading }">
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

      <!-- ── Service tab ──────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'service'" class="tab-content">

        <!-- DB Backup section -->
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

        <!-- Bottom 3-column grid -->
        <div class="service-bottom-grid">

          <!-- Left: credentials -->
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

          <!-- Center: logging -->
          <div class="card credentials-card">
            <div class="panel-title-row">
              <h2 class="card-title">{{ $t('admin.logging.title') }}</h2>
              <button class="btn-secondary refresh-btn" :disabled="loggerLoading" @click="fetchLoggerLevel">
                {{ $t('admin.backups.refresh') }}
              </button>
            </div>
            <p class="card-desc">{{ $t('admin.logging.desc') }}</p>

            <div v-if="loggerLoading" class="panel-state">{{ $t('admin.backups.loading') }}</div>
            <template v-else>
              <div class="field field-inline">
                <label>{{ $t('admin.logging.effectiveLevel') }}</label>
                <span class="logger-badge" :class="`level-${(loggerEffectiveLevel || 'unknown').toLowerCase()}`">
                  {{ loggerEffectiveLevel || '—' }}
                </span>
              </div>

              <div class="field">
                <label>{{ $t('admin.logging.setLevel') }}</label>
                <div class="level-picker">
                  <button
                    v-for="level in logLevels"
                    :key="level"
                    type="button"
                    class="toggle-btn"
                    :class="{ 'toggle-active': loggerConfiguredLevel === level }"
                    :disabled="loggerSetLoading"
                    @click="setLoggerLevel(level)"
                  >
                    {{ level }}
                  </button>
                </div>
              </div>

              <p v-if="loggerError"   class="status-msg status-err">{{ loggerError }}</p>
              <p v-if="loggerSuccess" class="status-msg status-ok">{{ loggerSuccess }}</p>
            </template>
          </div>

          <!-- Right: demo data toggle -->
          <div class="card credentials-card">
            <h2 class="card-title">{{ $t('admin.service.demoTitle') }}</h2>
            <p class="card-desc">{{ $t('admin.service.demoDesc') }}</p>
            <div class="demo-toggle-row">
              <label class="toggle-switch">
                <input type="checkbox" v-model="demoVisible" />
                <span class="toggle-slider"></span>
              </label>
              <span class="demo-toggle-label">
                {{ $t(demoVisible ? 'admin.service.demoOn' : 'admin.service.demoOff') }}
              </span>
            </div>
          </div>

        </div>

        <!-- Demo data management (shown when switch is on) -->
        <div v-if="demoVisible" class="demo-layout demo-section">

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

      <!-- ── Products tab ──────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'products'" class="tab-content">
        <div class="card">
          <div class="panel-title-row">
            <h2 class="card-title">{{ $t('admin.products.title') }}</h2>
            <div class="title-actions">
              <button class="btn-secondary refresh-btn" :disabled="productsLoading" @click="fetchProducts">
                {{ $t('admin.backups.refresh') }}
              </button>
              <button class="btn-primary btn-sm" @click="openAddProduct">
                {{ $t('admin.products.add') }}
              </button>
            </div>
          </div>

          <div v-if="productsLoading" class="panel-state">{{ $t('admin.backups.loading') }}</div>
          <div v-else-if="productsError" class="panel-state status-err">{{ productsError }}</div>
          <div v-else-if="products.length === 0" class="panel-state muted">{{ $t('admin.products.empty') }}</div>

          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ $t('admin.products.col.id') }}</th>
                  <th>{{ $t('admin.products.col.description') }}</th>
                  <th>{{ $t('admin.products.col.comment') }}</th>
                  <th>{{ $t('admin.products.col.price') }}</th>
                  <th>{{ $t('admin.products.col.period') }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in products" :key="p.id">
                  <td>{{ p.id }}</td>
                  <td>{{ p.description || '—' }}</td>
                  <td>{{ p.comment || '—' }}</td>
                  <td>{{ p.sum ?? '—' }}</td>
                  <td>{{ formatPeriod(p.period) }}</td>
                  <td class="col-actions">
                    <button class="btn-secondary btn-sm" @click="openEditProduct(p)">{{ $t('admin.products.editBtn') }}</button>
                    <button class="btn-danger btn-sm" style="margin-left:6px" @click="openDeleteProduct(p)">{{ $t('admin.products.deleteBtn') }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── Instructions tab ──────────────────────────────────────────────── -->
      <div v-if="activeTab === 'instructions'" class="tab-content">
        <div class="instr-tabs">
          <button
            v-for="tab in ['newAccount', 'payment', 'avatar', 'overview']"
            :key="tab"
            class="instr-tab-btn"
            :class="{ 'instr-tab-active': instrTab === tab }"
            @click="instrTab = tab"
          >
            {{ $t(`admin.instructions.tabs.${tab}`) }}
          </button>
        </div>

        <!-- New Account workflow -->
        <div v-if="instrTab === 'newAccount'" class="instr-content">
          <div class="instr-header">
            <div class="instr-title">{{ $t('admin.instructions.newAccount.title') }}</div>
            <div class="instr-desc">{{ $t('admin.instructions.newAccount.intro') }}</div>
          </div>
          <div class="instr-steps">
            <template v-for="(_, i) in Array(6)" :key="i">
              <div class="instr-step" :class="{ 'instr-step--optional': i >= 4 }">
                <div class="step-num">{{ i + 1 }}</div>
                <div class="step-icon">{{ ['📋','✏️','✅','👤','🖼️','💳'][i] }}</div>
                <div class="step-body">
                  <div class="step-title">
                    {{ $t(`admin.instructions.newAccount.step${i + 1}.title`) }}
                    <span v-if="i >= 4" class="opt-badge">{{ $t('admin.instructions.optional') }}</span>
                  </div>
                  <div class="step-desc">{{ $t(`admin.instructions.newAccount.step${i + 1}.desc`) }}</div>
                </div>
              </div>
              <div v-if="i < 5" class="step-arrow">→</div>
            </template>
          </div>
          <div class="instr-tip">💡 {{ $t('admin.instructions.newAccount.tip') }}</div>
        </div>

        <!-- Payment workflow -->
        <div v-if="instrTab === 'payment'" class="instr-content">
          <div class="instr-header">
            <div class="instr-title">{{ $t('admin.instructions.payment.title') }}</div>
            <div class="instr-desc">{{ $t('admin.instructions.payment.intro') }}</div>
          </div>
          <div class="instr-steps">
            <template v-for="(_, i) in Array(4)" :key="i">
              <div class="instr-step">
                <div class="step-num">{{ i + 1 }}</div>
                <div class="step-icon">{{ ['👤','💰','📦','✅'][i] }}</div>
                <div class="step-body">
                  <div class="step-title">{{ $t(`admin.instructions.payment.step${i + 1}.title`) }}</div>
                  <div class="step-desc">{{ $t(`admin.instructions.payment.step${i + 1}.desc`) }}</div>
                </div>
              </div>
              <div v-if="i < 3" class="step-arrow">→</div>
            </template>
          </div>
          <div class="instr-info">ℹ️ {{ $t('admin.instructions.payment.info') }}</div>
        </div>

        <!-- Avatar workflow -->
        <div v-if="instrTab === 'avatar'" class="instr-content">
          <div class="instr-header">
            <div class="instr-title">{{ $t('admin.instructions.avatar.title') }}</div>
            <div class="instr-desc">{{ $t('admin.instructions.avatar.intro') }}</div>
          </div>
          <div class="instr-steps">
            <template v-for="(_, i) in Array(2)" :key="i">
              <div class="instr-step">
                <div class="step-num">{{ i + 1 }}</div>
                <div class="step-icon">{{ ['👤','🖼️'][i] }}</div>
                <div class="step-body">
                  <div class="step-title">{{ $t(`admin.instructions.avatar.step${i + 1}.title`) }}</div>
                  <div class="step-desc">{{ $t(`admin.instructions.avatar.step${i + 1}.desc`) }}</div>
                </div>
              </div>
              <div class="step-arrow">→</div>
            </template>
          </div>
          <div class="instr-methods">
            <div class="method-col">
              <div class="method-label">{{ $t('admin.instructions.avatar.fileMethod') }}</div>
              <div class="instr-steps">
                <template v-for="(_, i) in Array(2)" :key="i">
                  <div class="instr-step">
                    <div class="step-num">{{ i + 3 }}</div>
                    <div class="step-icon">{{ ['📁','⬆️'][i] }}</div>
                    <div class="step-body">
                      <div class="step-title">{{ $t(`admin.instructions.avatar.fileStep${i + 1}.title`) }}</div>
                      <div class="step-desc">{{ $t(`admin.instructions.avatar.fileStep${i + 1}.desc`) }}</div>
                    </div>
                  </div>
                  <div v-if="i < 1" class="step-arrow">→</div>
                </template>
              </div>
            </div>
            <div class="method-divider">{{ $t('admin.instructions.or') }}</div>
            <div class="method-col">
              <div class="method-label">{{ $t('admin.instructions.avatar.cameraMethod') }}</div>
              <div class="instr-steps">
                <template v-for="(_, i) in Array(3)" :key="i">
                  <div class="instr-step">
                    <div class="step-num">{{ i + 3 }}</div>
                    <div class="step-icon">{{ ['📷','✔️','📸'][i] }}</div>
                    <div class="step-body">
                      <div class="step-title">{{ $t(`admin.instructions.avatar.cameraStep${i + 1}.title`) }}</div>
                      <div class="step-desc">{{ $t(`admin.instructions.avatar.cameraStep${i + 1}.desc`) }}</div>
                    </div>
                  </div>
                  <div v-if="i < 2" class="step-arrow">→</div>
                </template>
              </div>
            </div>
          </div>
          <div class="instr-tip">💡 {{ $t('admin.instructions.avatar.note') }}</div>
        </div>

        <!-- Overview -->
        <div v-if="instrTab === 'overview'" class="instr-content">
          <div class="instr-header">
            <div class="instr-title">{{ $t('admin.instructions.overview.title') }}</div>
            <div class="instr-desc">{{ $t('admin.instructions.overview.desc') }}</div>
          </div>
          <div class="instr-section-title">{{ $t('admin.instructions.overview.featuresTitle') }}</div>
          <div class="feature-grid">
            <div v-for="(feat, i) in overviewFeatures" :key="i" class="feature-card">
              <div class="feature-icon">{{ feat.icon }}</div>
              <div class="feature-title">{{ $t(`admin.instructions.overview.feature${i + 1}.title`) }}</div>
              <div class="feature-desc">{{ $t(`admin.instructions.overview.feature${i + 1}.desc`) }}</div>
            </div>
          </div>
          <div class="instr-section-title">{{ $t('admin.instructions.overview.warningsTitle') }}</div>
          <div class="warn-legend">
            <div class="warn-item"><div class="warn-swatch warn-white"></div><div>{{ $t('admin.instructions.overview.warnNone') }}</div></div>
            <div class="warn-item"><div class="warn-swatch warn-yellow"></div><div>{{ $t('admin.instructions.overview.warnInfo') }}</div></div>
            <div class="warn-item"><div class="warn-swatch warn-lightred"></div><div>{{ $t('admin.instructions.overview.warnWarning') }}</div></div>
            <div class="warn-item"><div class="warn-swatch warn-brightred"></div><div>{{ $t('admin.instructions.overview.warnCritical') }}</div></div>
          </div>
        </div>
      </div>

      <!-- ── Notes tab ─────────────────────────────────────────────────────── -->
      <div v-if="activeTab === 'notes'" class="tab-content">
        <div class="card">
          <div class="panel-title-row">
            <h2 class="card-title">{{ $t('admin.notes.title') }}</h2>
            <div class="title-actions">
              <button class="btn-secondary refresh-btn" :disabled="notesLoading" @click="fetchNotes">
                {{ $t('admin.backups.refresh') }}
              </button>
              <button class="btn-primary btn-sm" @click="openAddNote">
                {{ $t('admin.notes.add') }}
              </button>
            </div>
          </div>

          <div v-if="notesLoading" class="panel-state">{{ $t('admin.backups.loading') }}</div>
          <div v-else-if="notesError" class="panel-state status-err">{{ notesError }}</div>
          <div v-else-if="notes.length === 0" class="panel-state muted">{{ $t('admin.notes.empty') }}</div>

          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{{ $t('admin.notes.col.created') }}</th>
                  <th>{{ $t('admin.notes.col.header') }}</th>
                  <th>{{ $t('admin.notes.col.body') }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="n in notes" :key="n.id">
                  <td class="col-date note-date">{{ formatBackupDate(n.created) }}</td>
                  <td class="note-header">{{ n.header || '—' }}</td>
                  <td class="note-body">{{ n.body ? (n.body.length > 100 ? n.body.slice(0, 100) + '…' : n.body) : '—' }}</td>
                  <td class="col-actions">
                    <button class="btn-secondary btn-sm" @click="openEditNote(n)">{{ $t('admin.notes.editBtn') }}</button>
                    <button class="btn-danger btn-sm" style="margin-left:6px" @click="openDeleteNote(n)">{{ $t('admin.notes.deleteBtn') }}</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── Accounts Manage tab ────────────────────────────────────────────── -->
      <div v-if="activeTab === 'accountsManage'" class="tab-content">

        <!-- Filter boxes row -->
        <div class="am-boxes-row">

          <!-- Box 1: By Registration Period -->
          <div class="card am-filter-card">
            <h2 class="card-title">{{ $t('admin.accountsManage.byPeriod.title') }}</h2>
            <div class="am-filter-bar">
              <div class="am-filter-field">
                <label>{{ $t('admin.accountsManage.byPeriod.dateFrom') }}</label>
                <input v-model="amDateFrom" type="date" />
              </div>
              <div class="am-filter-field">
                <label>{{ $t('admin.accountsManage.byPeriod.dateTo') }}</label>
                <input v-model="amDateTo" type="date" />
              </div>
              <div class="am-filter-actions">
                <button class="btn-primary" :disabled="amLoading" @click="fetchAccountsByPeriod">
                  {{ $t('admin.accountsManage.search') }}
                </button>
                <button class="btn-secondary" :disabled="amLoading" @click="clearAmFilter">
                  {{ $t('admin.accountsManage.clear') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Box 2: By Paid Until -->
          <div class="card am-filter-card">
            <h2 class="card-title">{{ $t('admin.accountsManage.byPaidUntil.title') }}</h2>
            <div class="am-filter-bar">
              <div class="am-filter-field">
                <label>{{ $t('admin.accountsManage.byPaidUntil.date') }}</label>
                <input v-model="puDate" type="date" />
              </div>
              <div class="am-before-after">
                <button
                  type="button"
                  class="toggle-btn"
                  :class="{ 'toggle-active': puBefore }"
                  @click="puBefore = true"
                >{{ $t('admin.accountsManage.byPaidUntil.before') }}</button>
                <button
                  type="button"
                  class="toggle-btn"
                  :class="{ 'toggle-active': !puBefore }"
                  @click="puBefore = false"
                >{{ $t('admin.accountsManage.byPaidUntil.after') }}</button>
              </div>
              <div class="am-filter-actions">
                <button class="btn-primary" :disabled="amLoading || !puDate" @click="fetchAccountsByPaidUntil">
                  {{ $t('admin.accountsManage.search') }}
                </button>
                <button class="btn-secondary" :disabled="amLoading" @click="clearPuFilter">
                  {{ $t('admin.accountsManage.clear') }}
                </button>
              </div>
            </div>
          </div>

        </div>

        <!-- Shared results table -->
        <div class="card">
          <div v-if="amLoading" class="panel-state">{{ $t('admin.accountsManage.loading') }}</div>
          <div v-else-if="amError" class="panel-state status-err">{{ amError }}</div>
          <div v-else-if="amAccounts !== null && amAccounts.length === 0" class="panel-state">
            {{ $t('admin.accountsManage.empty') }}
          </div>
          <template v-else-if="amAccounts && amAccounts.length">
            <div class="am-table-toolbar">
              <button
                class="btn-danger am-delete-btn"
                :disabled="amSelected.length === 0 || amBulkDeleteLoading"
                @click="openBulkDelete(amSelected)"
              >
                {{ $t('admin.accountsManage.deleteSelected', { n: amSelected.length }) }}
              </button>
            </div>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>{{ $t('admin.accountsManage.col.firstName') }}</th>
                    <th>{{ $t('admin.accountsManage.col.lastName') }}</th>
                    <th>{{ $t('admin.accountsManage.col.cardNumber') }}</th>
                    <th>{{ $t('admin.accountsManage.col.registrationDate') }}</th>
                    <th>{{ $t('admin.accountsManage.col.paidUntil') }}</th>
                    <th class="am-check-col">
                      <input
                        type="checkbox"
                        :checked="amAllSelected"
                        :indeterminate.prop="amSomeSelected"
                        @change="toggleAmSelectAll"
                      />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="acc in amAccounts"
                    :key="acc.id"
                    :class="['clickable-row', amRowClass(acc.warnings)]"
                    @dblclick="router.push(`/account/${acc.id}`)"
                  >
                    <td>{{ acc.firstName ?? '—' }}</td>
                    <td>{{ acc.lastName ?? '—' }}</td>
                    <td>{{ acc.cardNumber ?? '—' }}</td>
                    <td>{{ formatAmDate(acc.registrationDate) }}</td>
                    <td>{{ formatAmDate(acc.paidUntil) }}</td>
                    <td class="am-check-col" @click.stop>
                      <input type="checkbox" :value="acc.id" v-model="amSelected" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </div>

      </div>

    </div>
  </div>

  <!-- ── Bulk delete accounts confirmation modal ──────────────────────────── -->
  <Teleport to="body">
    <div v-if="amBulkDeleteConfirmOpen" class="modal-overlay" @click.self="amBulkDeleteConfirmOpen = false">
      <div class="modal">
        <h3 class="modal-title">{{ $t('admin.accountsManage.deleteConfirmTitle') }}</h3>
        <p class="confirm-msg">{{ $t('admin.accountsManage.deleteConfirmMsg', { n: amBulkDeleteConfirmIds.length }) }}</p>
        <p v-if="amBulkDeleteError" class="status-msg status-err">{{ amBulkDeleteError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" :disabled="amBulkDeleteLoading" @click="amBulkDeleteConfirmOpen = false">
            {{ $t('admin.accountsManage.deleteCancel') }}
          </button>
          <button class="btn-danger" :disabled="amBulkDeleteLoading" @click="executeBulkDelete">
            {{ amBulkDeleteLoading ? $t('admin.backups.loading') : $t('admin.accountsManage.deleteConfirmBtn') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

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

  <!-- ── Product add / edit modal ─────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="productModalOpen" class="modal-overlay" @click.self="closeProductModal">
      <div class="modal">
        <h3 class="modal-title">
          {{ productModalMode === 'add' ? $t('admin.products.addTitle') : $t('admin.products.editTitle') }}
        </h3>

        <div class="field">
          <label>{{ $t('admin.products.fields.description') }}</label>
          <input v-model="productForm.description" type="text" />
        </div>
        <div class="field">
          <label>{{ $t('admin.products.fields.comment') }}</label>
          <input v-model="productForm.comment" type="text" />
        </div>
        <div class="field">
          <label>{{ $t('admin.products.fields.price') }}</label>
          <input v-model="productForm.price" type="number" min="0" step="0.01" />
        </div>
        <div class="field">
          <label>{{ $t('admin.products.fields.period') }}</label>
          <div class="period-picker">
            <input v-model.number="periodAmount" type="number" min="1" class="period-amount" />
            <button
              v-for="unit in ['day', 'week', 'month', 'year']"
              :key="unit"
              type="button"
              class="toggle-btn"
              :class="{ 'toggle-active': periodUnit === unit }"
              @click="periodUnit = unit"
            >
              {{ $t(`admin.products.period.${unit}`) }}
            </button>
          </div>
        </div>

        <p v-if="productError" class="status-msg status-err">{{ productError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" :disabled="productLoading" @click="closeProductModal">
            {{ $t('admin.products.cancelBtn') }}
          </button>
          <button
            class="btn-primary"
            :disabled="productLoading"
            @click="submitProduct"
          >
            {{ productLoading ? '…' : $t('detail.modal.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Product delete confirmation modal ─────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="productDeleteConfirmOpen" class="modal-overlay" @click.self="productDeleteConfirmOpen = false">
      <div class="modal">
        <h3 class="modal-title">{{ $t('admin.products.deleteConfirmTitle') }}</h3>
        <p class="confirm-msg">{{ $t('admin.products.deleteConfirmMsg', { name: productToDelete?.description || productToDelete?.id }) }}</p>
        <p v-if="productDeleteError" class="status-msg status-err">{{ productDeleteError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" :disabled="productDeleteLoading" @click="productDeleteConfirmOpen = false">
            {{ $t('admin.products.cancelBtn') }}
          </button>
          <button class="btn-danger" :disabled="productDeleteLoading" @click="confirmDeleteProduct">
            {{ productDeleteLoading ? '…' : $t('admin.products.deleteConfirmBtn') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Note add / edit modal ────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="noteModalOpen" class="modal-overlay" @click.self="closeNoteModal">
      <div class="modal modal-note">
        <h3 class="modal-title">
          {{ noteModalMode === 'add' ? $t('admin.notes.addTitle') : $t('admin.notes.editTitle') }}
        </h3>

        <div class="field">
          <label>{{ $t('admin.notes.fields.header') }}</label>
          <input v-model="noteForm.header" type="text" />
        </div>
        <div class="field">
          <label>{{ $t('admin.notes.fields.body') }}</label>
          <textarea v-model="noteForm.body" class="note-textarea" rows="6" />
        </div>

        <p v-if="noteError" class="status-msg status-err">{{ noteError }}</p>

        <div class="modal-actions">
          <button class="btn-secondary" :disabled="noteLoading" @click="closeNoteModal">
            {{ $t('admin.products.cancelBtn') }}
          </button>
          <button class="btn-primary" :disabled="noteLoading || !noteForm.body.trim()" @click="submitNote">
            {{ noteLoading ? '…' : $t('detail.modal.confirm') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ── Note delete confirmation modal ────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="noteDeleteConfirmOpen" class="modal-overlay" @click.self="noteDeleteConfirmOpen = false">
      <div class="modal">
        <h3 class="modal-title">{{ $t('admin.notes.deleteConfirmTitle') }}</h3>
        <p class="confirm-msg">{{ $t('admin.notes.deleteConfirmMsg', { header: noteToDelete?.header || String(noteToDelete?.id) }) }}</p>
        <p v-if="noteDeleteError" class="status-msg status-err">{{ noteDeleteError }}</p>
        <div class="modal-actions">
          <button class="btn-secondary" :disabled="noteDeleteLoading" @click="noteDeleteConfirmOpen = false">
            {{ $t('admin.products.cancelBtn') }}
          </button>
          <button class="btn-danger" :disabled="noteDeleteLoading" @click="confirmDeleteNote">
            {{ noteDeleteLoading ? '…' : $t('admin.notes.deleteConfirmBtn') }}
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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api'
import axios from 'axios'
import LangSwitch from '../components/LangSwitch.vue'
import ThemeSwitch from '../components/ThemeSwitch.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const auth   = useAuthStore()
const { t, locale } = useI18n()

const activeTab = ref('analytics')
const instrTab  = ref('newAccount')

watch(activeTab, (val) => {
  if (val === 'service') fetchLoggerLevel()
})

const overviewFeatures = [
  { icon: '👥' },
  { icon: '💳' },
  { icon: '🖼️' },
  { icon: '📷' },
  { icon: '📊' },
  { icon: '🔧' },
]

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
  fetchProducts()
  fetchNotes()
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
const demoVisible = ref(false)
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
const chartYear    = ref(new Date().getFullYear())
const chartMonth   = ref(currentYearMonthStr())
const chartWeek    = ref(currentISOWeekStr())
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

function currentYearMonthStr() {
  const n = new Date()
  return `${n.getFullYear()}-${pad2(n.getMonth() + 1)}`
}

function currentISOWeekStr() {
  const n = new Date()
  const d = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()))
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${pad2(week)}`
}

function resetChartPicker() {
  if (chartRange.value === 'week')  chartWeek.value  = currentISOWeekStr()
  else if (chartRange.value === 'month') chartMonth.value = currentYearMonthStr()
  else chartYear.value = new Date().getFullYear()
}

function formatLocalDateTime(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T` +
         `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
}

function rangeParams(range) {
  if (range === 'year') {
    const y = chartYear.value
    return {
      granularity: 'month',
      from: new Date(y, 0, 1),
      to:   new Date(y, 11, 31, 23, 59, 59),
    }
  }
  if (range === 'month') {
    const [y, m] = chartMonth.value.split('-').map(Number)
    return {
      granularity: 'day',
      from: new Date(y, m - 1, 1),
      to:   new Date(y, m, 0, 23, 59, 59),   // day 0 of next month = last day
    }
  }
  // week — ISO week
  const [yearPart, weekPart] = chartWeek.value.split('-W')
  const y = Number(yearPart)
  const w = Number(weekPart)
  const jan4 = new Date(y, 0, 4)
  const dow  = jan4.getDay() || 7              // Mon=1…Sun=7
  const monday = new Date(jan4)
  monday.setDate(jan4.getDate() - dow + 1 + (w - 1) * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59)
  return { granularity: 'day', from: monday, to: sunday }
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

watch([chartMetric, chartRange, chartYear, chartMonth, chartWeek], fetchChart)

// ── Products ──────────────────────────────────────────────────────────────────
const products        = ref([])
const productsLoading = ref(false)
const productsError   = ref('')

async function fetchProducts() {
  productsLoading.value = true
  productsError.value   = ''
  try {
    const { data } = await api.get('/product')
    products.value = data
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    productsError.value = detail || t('admin.products.error')
  } finally {
    productsLoading.value = false
  }
}

const productModalOpen = ref(false)
const productModalMode = ref('add')
const productForm      = reactive({ id: null, description: '', comment: '', price: '' })
const productLoading   = ref(false)
const productError     = ref('')

const periodAmount = ref(1)
const periodUnit   = ref('month')

function buildPeriod() {
  const n = Math.max(1, periodAmount.value || 1)
  if (periodUnit.value === 'year')  return `P${n}Y`
  if (periodUnit.value === 'month') return `P${n}M`
  if (periodUnit.value === 'week')  return `P${n * 7}D`
  return `P${n}D`
}

function parsePeriod(str) {
  if (!str) { periodAmount.value = 1; periodUnit.value = 'month'; return }
  const m = str.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?$/)
  if (!m) { periodAmount.value = 1; periodUnit.value = 'month'; return }
  const years  = parseInt(m[1] || 0)
  const months = parseInt(m[2] || 0)
  const days   = parseInt(m[3] || 0)
  if (years && !months && !days)                              { periodUnit.value = 'year';  periodAmount.value = years }
  else if (months && !years && !days)                         { periodUnit.value = 'month'; periodAmount.value = months }
  else if (days && !years && !months && days % 7 === 0)       { periodUnit.value = 'week';  periodAmount.value = days / 7 }
  else if (days && !years && !months)                         { periodUnit.value = 'day';   periodAmount.value = days }
  else                                                        { periodUnit.value = 'month'; periodAmount.value = months || 1 }
}

function openAddProduct() {
  Object.assign(productForm, { id: null, description: '', comment: '', price: '' })
  periodAmount.value    = 1
  periodUnit.value      = 'month'
  productError.value    = ''
  productModalMode.value = 'add'
  productModalOpen.value = true
}

function openEditProduct(p) {
  Object.assign(productForm, {
    id:          p.id,
    description: p.description ?? '',
    comment:     p.comment ?? '',
    price:       p.sum ?? '',
  })
  parsePeriod(p.period)
  productError.value    = ''
  productModalMode.value = 'edit'
  productModalOpen.value = true
}

function closeProductModal() {
  if (productLoading.value) return
  productModalOpen.value = false
}

async function submitProduct() {
  productLoading.value = true
  productError.value   = ''
  try {
    const payload = {
      description: productForm.description.trim() || null,
      comment:     productForm.comment.trim() || null,
      sum:         productForm.price !== '' ? Number(productForm.price) : null,
      period:      buildPeriod(),
    }
    if (productModalMode.value === 'add') {
      await api.post('/product', payload)
    } else {
      await api.put(`/product/${productForm.id}`, payload)
    }
    productModalOpen.value = false
    fetchProducts()
  } catch (e) {
    const d = e.response?.data
    productError.value = d?.detail || d?.message || t('admin.products.saveError')
  } finally {
    productLoading.value = false
  }
}

const productDeleteConfirmOpen = ref(false)
const productToDelete          = ref(null)
const productDeleteLoading     = ref(false)
const productDeleteError       = ref('')

function openDeleteProduct(p) {
  productToDelete.value          = p
  productDeleteError.value       = ''
  productDeleteConfirmOpen.value = true
}

async function confirmDeleteProduct() {
  productDeleteLoading.value = true
  productDeleteError.value   = ''
  try {
    await api.delete(`/product/${productToDelete.value.id}`)
    productDeleteConfirmOpen.value = false
    fetchProducts()
  } catch (e) {
    const d = e.response?.data
    productDeleteError.value = d?.detail || d?.message || t('admin.products.deleteError')
  } finally {
    productDeleteLoading.value = false
  }
}

// ── Notes ─────────────────────────────────────────────────────────────────────
const notes        = ref([])
const notesLoading = ref(false)
const notesError   = ref('')

async function fetchNotes() {
  notesLoading.value = true
  notesError.value   = ''
  try {
    const { data } = await api.get('/note')
    notes.value = data.slice().sort((a, b) => {
      const ta = parseBackendDate(a.created)
      const tb = parseBackendDate(b.created)
      if (ta && tb) return tb - ta
      return 0
    })
  } catch (e) {
    const d = e.response?.data
    notesError.value = d?.detail || d?.message || t('admin.notes.error')
  } finally {
    notesLoading.value = false
  }
}

const noteModalOpen = ref(false)
const noteModalMode = ref('add')
const noteForm      = reactive({ id: null, header: '', body: '' })
const noteLoading   = ref(false)
const noteError     = ref('')

function openAddNote() {
  Object.assign(noteForm, { id: null, header: '', body: '' })
  noteError.value    = ''
  noteModalMode.value = 'add'
  noteModalOpen.value = true
}

function openEditNote(n) {
  Object.assign(noteForm, { id: n.id, header: n.header ?? '', body: n.body ?? '' })
  noteError.value    = ''
  noteModalMode.value = 'edit'
  noteModalOpen.value = true
}

function closeNoteModal() {
  if (noteLoading.value) return
  noteModalOpen.value = false
}

async function submitNote() {
  noteLoading.value = true
  noteError.value   = ''
  try {
    const payload = {
      header: noteForm.header.trim() || null,
      body:   noteForm.body.trim(),
    }
    if (noteModalMode.value === 'add') {
      await api.post('/note', payload)
    } else {
      await api.put(`/note/${noteForm.id}`, payload)
    }
    noteModalOpen.value = false
    fetchNotes()
  } catch (e) {
    const d = e.response?.data
    noteError.value = d?.detail || d?.message || t('admin.notes.saveError')
  } finally {
    noteLoading.value = false
  }
}

const noteDeleteConfirmOpen = ref(false)
const noteToDelete          = ref(null)
const noteDeleteLoading     = ref(false)
const noteDeleteError       = ref('')

function openDeleteNote(n) {
  noteToDelete.value          = n
  noteDeleteError.value       = ''
  noteDeleteConfirmOpen.value = true
}

async function confirmDeleteNote() {
  noteDeleteLoading.value = true
  noteDeleteError.value   = ''
  try {
    await api.delete(`/note/${noteToDelete.value.id}`)
    noteDeleteConfirmOpen.value = false
    fetchNotes()
  } catch (e) {
    const d = e.response?.data
    noteDeleteError.value = d?.detail || d?.message || t('admin.notes.deleteError')
  } finally {
    noteDeleteLoading.value = false
  }
}

// ── Formatting ────────────────────────────────────────────────────────────────
function formatPeriod(p) {
  if (!p) return '—'
  const m = String(p).match(/^P(?:(-?\d+)Y)?(?:(-?\d+)M)?(?:(-?\d+)D)?$/)
  if (!m) return String(p)
  const years  = parseInt(m[1] || 0)
  const months = parseInt(m[2] || 0)
  const days   = parseInt(m[3] || 0)
  const parts  = []
  if (years)  parts.push(t('detail.payments.years',  { n: years }))
  if (months) parts.push(t('detail.payments.months', { n: months }))
  if (days)   parts.push(t('detail.payments.days',   { n: days }))
  return parts.length ? parts.join(' ') : String(p)
}

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

// ── Logging ───────────────────────────────────────────────────────────────────
const LOGGER_NAME = 'ru.gorilla.gim.backend'
const logLevels   = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'OFF']

const loggerLoading         = ref(false)
const loggerSetLoading      = ref(false)
const loggerConfiguredLevel = ref(null)
const loggerEffectiveLevel  = ref(null)
const loggerError           = ref('')
const loggerSuccess         = ref('')

function loggerHeaders() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchLoggerLevel() {
  loggerLoading.value = true
  loggerError.value   = ''
  try {
    const { data } = await axios.get(`/actuator/loggers/${LOGGER_NAME}`, { headers: loggerHeaders() })
    loggerConfiguredLevel.value = data.configuredLevel
    loggerEffectiveLevel.value  = data.effectiveLevel
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    loggerError.value = detail || t('admin.logging.errorFetch')
  } finally {
    loggerLoading.value = false
  }
}

async function setLoggerLevel(level) {
  loggerSetLoading.value = true
  loggerError.value      = ''
  loggerSuccess.value    = ''
  try {
    await axios.post(
      `/actuator/loggers/${LOGGER_NAME}`,
      { configuredLevel: level },
      { headers: { 'Content-Type': 'application/json', ...loggerHeaders() } },
    )
    loggerConfiguredLevel.value = level
    loggerSuccess.value = t('admin.logging.success', { level })
    fetchLoggerLevel()
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    loggerError.value = detail || t('admin.logging.errorSet')
  } finally {
    loggerSetLoading.value = false
  }
}

// ── Accounts Manage ───────────────────────────────────────────────────────────

// ─ Shared table state ─
const amAccounts = ref(null)
const amLoading  = ref(false)
const amError    = ref('')
const amSelected = ref([])

const amAllSelected  = computed(() =>
  amAccounts.value?.length > 0 && amSelected.value.length === amAccounts.value.length
)
const amSomeSelected = computed(() =>
  amSelected.value.length > 0 && amSelected.value.length < (amAccounts.value?.length ?? 0)
)

function toggleAmSelectAll() {
  amSelected.value = amAllSelected.value ? [] : amAccounts.value.map(a => a.id)
}

function clearSharedTable() {
  amAccounts.value = null
  amSelected.value = []
  amError.value    = ''
}

// ─ Bulk-delete state ─
const amBulkDeleteConfirmOpen = ref(false)
const amBulkDeleteConfirmIds  = ref([])
const amBulkDeleteLoading     = ref(false)
const amBulkDeleteError       = ref('')

function openBulkDelete(ids) {
  amBulkDeleteConfirmIds.value  = [...ids]
  amBulkDeleteError.value       = ''
  amBulkDeleteConfirmOpen.value = true
}

async function executeBulkDelete() {
  const ids = amBulkDeleteConfirmIds.value
  amBulkDeleteLoading.value = true
  amBulkDeleteError.value   = ''
  try {
    await api.delete('/account/bulk', { data: ids })
    const deleted = new Set(ids)
    amAccounts.value = amAccounts.value.filter(a => !deleted.has(a.id))
    amSelected.value = amSelected.value.filter(id => !deleted.has(id))
    amBulkDeleteConfirmOpen.value = false
    amBulkDeleteConfirmIds.value  = []
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    amBulkDeleteError.value = detail || t('admin.accountsManage.deleteError')
  } finally {
    amBulkDeleteLoading.value = false
  }
}

// ─ Box 1: By registration period ─
const amDateFrom = ref('')
const amDateTo   = ref('')

async function fetchAccountsByPeriod() {
  amLoading.value  = true
  amError.value    = ''
  amAccounts.value = null
  amSelected.value = []
  try {
    const params = {}
    const from = amDateFrom.value ? `${amDateFrom.value}T00:00:00` : null
    const to   = amDateTo.value   ? `${amDateTo.value}T23:59:59`   : null
    if (from) params.dateFrom = from
    if (to)   params.dateTo   = to
    const { data } = await api.get('/account/by-period', { params })
    amAccounts.value = data
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    amError.value = detail || t('admin.accountsManage.error')
  } finally {
    amLoading.value = false
  }
}

function clearAmFilter() {
  amDateFrom.value = ''
  amDateTo.value   = ''
  clearSharedTable()
}

// ─ Box 2: By paid until ─
const puDate   = ref('')
const puBefore = ref(true)

async function fetchAccountsByPaidUntil() {
  if (!puDate.value) return
  amLoading.value  = true
  amError.value    = ''
  amAccounts.value = null
  amSelected.value = []
  try {
    const dateStr = puBefore.value
      ? `${puDate.value}T23:59:59`
      : `${puDate.value}T00:00:00`
    const { data } = await api.get('/account/by-paid-until', {
      params: { date: dateStr, before: puBefore.value },
    })
    amAccounts.value = data
  } catch (e) {
    const detail = e.response?.data?.detail || e.response?.data?.message
    amError.value = detail || t('admin.accountsManage.error')
  } finally {
    amLoading.value = false
  }
}

function clearPuFilter() {
  puDate.value = ''
  clearSharedTable()
}

// ─ Helpers ─
function amRowClass(warnings) {
  if (!warnings || warnings.length === 0) return ''
  const levels = warnings.map(w => w.level)
  if (levels.some(l => l === 'CRITICAL_WARNING' || l === 'ERROR')) return 'row-critical'
  if (levels.some(l => l === 'WARNING')) return 'row-warn'
  if (levels.some(l => l === 'INFO')) return 'row-info'
  return ''
}

function formatAmDate(value) {
  if (!value) return '—'
  const d = Array.isArray(value)
    ? new Date(value[0], (value[1] ?? 1) - 1, value[2] ?? 1, value[3] ?? 0, value[4] ?? 0, value[5] ?? 0)
    : new Date(value)
  return isNaN(d) ? '—' : d.toLocaleDateString(locale.value)
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
.demo-section { margin-top: 24px; }

.service-bottom-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 24px;
  align-items: start;
}

.demo-toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}
.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--border);
  border-radius: 24px;
  cursor: pointer;
  transition: background 0.2s;
}
.toggle-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  left: 3px;
  top: 3px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.toggle-switch input:checked + .toggle-slider { background: var(--primary); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(20px); }
.demo-toggle-label { font-size: 14px; color: var(--text); }

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
.title-actions { display: flex; gap: 8px; align-items: flex-start; flex-shrink: 0; }

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
.period-picker { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.period-amount { width: 70px; }
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
  grid-template-columns: minmax(180px, 220px) 1fr;
  gap: 18px;
  align-items: stretch;
}
.metrics-accounts {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.metrics-stats {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
.metric-inactive {
  background: #fff3e0;
  border-color: #ffb74d;
  justify-content: center;
}
.metric-inactive .metric-label { color: #e65100; }
.metric-inactive .metric-value { color: #bf360c; font-size: 32px; }
.generated-at { font-size: 12px; color: var(--text-muted); margin: 0; }

.chart-card { gap: 16px; }
.chart-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
}
.control-group { display: flex; align-items: center; gap: 6px; }
.chart-picker-input {
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  background: var(--bg);
  color: var(--text);
}
.chart-year-input { width: 80px; }
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
.chart-dimmed { opacity: 0.35; pointer-events: none; transition: opacity 0.15s; }
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

/* Notes tab */
.modal-note { max-width: 560px; }
.note-textarea {
  width: 100%;
  resize: vertical;
  font-family: inherit;
  font-size: 13px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  color: var(--text);
  box-sizing: border-box;
}
.note-textarea:focus { outline: none; border-color: var(--primary); }
.note-date   { white-space: nowrap; min-width: 130px; }
.note-header { font-weight: 600; min-width: 120px; max-width: 200px; word-break: break-word; }
.note-body   { color: var(--text-muted); font-size: 12px; max-width: 400px; word-break: break-word; }

/* Instructions tab */
.instr-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}
.instr-tab-btn {
  background: var(--surface);
  border: 2px solid var(--border);
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: var(--radius);
  cursor: pointer;
  transition: color .15s, border-color .15s, background .15s;
}
.instr-tab-btn:hover { color: var(--text); border-color: var(--primary); }
.instr-tab-active { background: var(--primary); border-color: var(--primary); color: #fff; }
.instr-tab-active:hover { color: #fff; }

.instr-content { display: flex; flex-direction: column; gap: 20px; }

.instr-header { display: flex; flex-direction: column; gap: 6px; }
.instr-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--primary);
}
.instr-desc { font-size: 14px; color: var(--text-muted); line-height: 1.55; }

.instr-steps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.instr-step {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
  box-shadow: var(--shadow);
  min-width: 180px;
  max-width: 240px;
  flex: 1 1 180px;
}
.instr-step--optional { border-style: dashed; opacity: .85; }

.step-num {
  background: var(--primary);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}
.step-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.step-body { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.step-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.step-desc { font-size: 12px; color: var(--text-muted); line-height: 1.45; }
.step-arrow {
  font-size: 20px;
  color: var(--text-muted);
  flex-shrink: 0;
  align-self: center;
}

.opt-badge {
  font-size: 10px;
  font-weight: 600;
  background: var(--border);
  color: var(--text-muted);
  border-radius: 4px;
  padding: 1px 5px;
  text-transform: uppercase;
  letter-spacing: .3px;
}

.instr-tip,
.instr-info {
  font-size: 13px;
  line-height: 1.5;
  padding: 12px 16px;
  border-radius: var(--radius);
}
.instr-tip {
  background: #fffbe6;
  border-left: 4px solid #f5a623;
  color: #7a5a00;
}
.instr-info {
  background: #e8f4fd;
  border-left: 4px solid #2196f3;
  color: #0d4f7a;
}

.instr-section-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--text-muted);
  margin: 4px 0;
}

.instr-methods {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.method-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 260px;
  min-width: 0;
}
.method-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--primary);
  padding-bottom: 6px;
  border-bottom: 2px solid var(--primary);
}
.method-divider {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  align-self: center;
  flex-shrink: 0;
}

/* Feature grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 14px;
}
.feature-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.feature-icon { font-size: 24px; }
.feature-title { font-size: 13px; font-weight: 700; color: var(--text); }
.feature-desc  { font-size: 12px; color: var(--text-muted); line-height: 1.45; }

/* Warning legend */
.warn-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.warn-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--text);
}
.warn-swatch {
  width: 28px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.warn-white     { background: #ffffff; }
.warn-yellow    { background: #fff9c4; border-color: #f5a623; }
.warn-lightred  { background: #ffcdd2; border-color: #e57373; }
.warn-brightred { background: #f44336; border-color: #b71c1c; }

/* Logger level */
.level-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.logger-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .4px;
  text-transform: uppercase;
  border: 1px solid transparent;
}
.level-trace   { background: #ede7f6; color: #4a148c; border-color: #9575cd; }
.level-debug   { background: #e3f2fd; color: #0d47a1; border-color: #64b5f6; }
.level-info    { background: #e8f5e9; color: #1b5e20; border-color: #66bb6a; }
.level-warn    { background: #fff8e1; color: #e65100; border-color: #ffb300; }
.level-error   { background: #ffebee; color: #b71c1c; border-color: #e57373; }
.level-off     { background: #f5f5f5; color: #616161; border-color: #bdbdbd; }
.level-unknown { background: #f5f5f5; color: #616161; border-color: #bdbdbd; }

/* Accounts Manage tab */
.am-boxes-row {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.am-filter-card {
  flex: 1 1 320px;
  min-width: 280px;
}
.am-filter-bar {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}
.am-filter-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.am-filter-field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
}
.am-filter-field input[type="date"] {
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
  background: var(--surface);
  color: var(--text);
}
.am-filter-actions { display: flex; gap: 8px; align-items: flex-end; }
.am-table-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.am-delete-btn { font-size: 13px; padding: 6px 14px; }
.am-check-col { width: 40px; text-align: center; }
.am-before-after { display: flex; gap: 0; align-self: flex-end; }
.am-before-after .toggle-btn { border-radius: 0; }
.am-before-after .toggle-btn:first-child { border-radius: var(--radius) 0 0 var(--radius); }
.am-before-after .toggle-btn:last-child  { border-radius: 0 var(--radius) var(--radius) 0; border-left: none; }
.clickable-row { cursor: pointer; }
tr.row-info td     { background-color: var(--row-info-bg) !important; color: var(--row-info-color) !important; }
tr.row-warn td     { background-color: var(--row-warn-bg) !important; color: var(--row-warn-color) !important; }
tr.row-critical td { background-color: var(--row-crit-bg) !important; color: var(--row-crit-color) !important; }
</style>
