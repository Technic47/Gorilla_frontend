/**
 * Turns an Axios error into a message fit to show an operator.
 *
 * A unique-constraint breach is the one case worth special handling: Postgres
 * phrases it as `duplicate key value violates unique constraint
 * "idx_account_barcode" Detail: Key (barcode)=(0CSSBD) already exists.`, which
 * the backend advice splits into a code, a field and a value so the wording can
 * be translated here rather than shipped from the server.
 *
 * @param {object} e     the caught Axios error
 * @param {object} i18n  `{ t, te }` from useI18n()
 * @param {string} fallback message for anything unrecognised
 */
export function apiErrorMessage(e, { t, te }, fallback) {
  const d = e.response?.data

  if (d?.code === 'DUPLICATE_KEY' && d.field) {
    const key = `accounts.col.${d.field}`
    return t('accounts.error.duplicate', {
      field: te(key) ? t(key) : d.field,
      value: d.value ?? '',
    })
  }

  return d?.detail || d?.message || (typeof d === 'string' ? d : null) || fallback
}
