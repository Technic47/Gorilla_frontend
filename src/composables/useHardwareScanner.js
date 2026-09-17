import { onMounted, onBeforeUnmount } from 'vue'

/*
 * Handheld USB 2D scanners run as keyboard-wedge (HID) devices: they "type"
 * the decoded payload as a burst of keystrokes and normally append Enter.
 *
 * Telling that apart from a person typing is purely a matter of timing.
 * Scanners emit characters 5-15ms apart with almost no variance; sustaining
 * sub-30ms intervals by hand over several characters is not realistic, so 30ms
 * is the cut-off. Any slower gap discards the buffer, which means the buffer
 * only ever holds one uninterrupted fast run.
 */
const MAX_KEY_GAP_MS = 30

// Enter-terminated bursts are high confidence, so a short code is accepted.
const MIN_CODE_LENGTH = 4

// Scanners configured with no suffix are flushed on silence instead. That path
// has no explicit terminator, so it demands a longer code to stay conservative.
const MIN_UNTERMINATED_LENGTH = 8
const FLUSH_DELAY_MS = 90

/**
 * Watches for scanner bursts anywhere on the page.
 *
 * The burst is not suppressed while it happens — by the time the second
 * keystroke identifies it as a scan, the first has already reached whatever
 * input had focus. Callers are therefore expected to *overwrite* the target
 * field with the code they receive rather than append to it, which cleans up
 * any characters that landed natively.
 *
 * @param {(code: string) => void} onScan called with the decoded payload
 */
export function useHardwareScanner(onScan) {
  let buffer = ''
  let lastKeyTime = 0
  let flushTimer = null

  function reset() {
    buffer = ''
    if (flushTimer) {
      clearTimeout(flushTimer)
      flushTimer = null
    }
  }

  function flush(minLength) {
    const code = buffer.trim()
    reset()
    if (code.length >= minLength) onScan(code)
  }

  function onKeyDown(e) {
    // Shortcuts are never a scan, and a composing IME must be left alone
    if (e.ctrlKey || e.altKey || e.metaKey || e.isComposing) {
      reset()
      return
    }

    const now = Date.now()
    const gap = now - lastKeyTime
    lastKeyTime = now

    if (e.key === 'Enter') {
      if (buffer.length >= MIN_CODE_LENGTH && gap <= MAX_KEY_GAP_MS) {
        // The scanner's suffix — swallow it so it cannot submit a form
        e.preventDefault()
        flush(MIN_CODE_LENGTH)
      } else {
        reset()
      }
      return
    }

    // Everything non-printable: Shift, Tab, arrows, F-keys. Leave the buffer be
    // so a stray modifier mid-burst does not discard a valid scan.
    if (e.key.length !== 1) return

    // Scanned card codes never contain spaces, but human input constantly does
    if (e.key === ' ') {
      reset()
      return
    }

    if (gap > MAX_KEY_GAP_MS) buffer = ''
    buffer += e.key

    if (flushTimer) clearTimeout(flushTimer)
    flushTimer = setTimeout(() => flush(MIN_UNTERMINATED_LENGTH), FLUSH_DELAY_MS)
  }

  onMounted(() => document.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeyDown)
    reset()
  })
}
