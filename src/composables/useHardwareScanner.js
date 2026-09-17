import { onMounted, onBeforeUnmount } from 'vue'

/*
 * Handheld USB 2D scanners run as keyboard-wedge (HID) devices: they "type"
 * the decoded payload as a burst of keystrokes and normally append Enter.
 *
 * Two problems have to be solved at once.
 *
 * 1. Telling a scan apart from a person typing is purely a matter of timing.
 *    Scanners emit characters 5-15ms apart with almost no variance; sustaining
 *    sub-30ms intervals by hand over several characters is not realistic, so
 *    30ms is the cut-off. Any slower gap discards the buffer, which means the
 *    buffer only ever holds one uninterrupted fast run.
 *
 * 2. The scanner sends physical key positions, but Windows translates those
 *    through whatever layout is active. Under RU the same card reads 0СЫЫИВ
 *    instead of 0CSSBD, so two receptionists get different strings off one
 *    card. event.key carries that mistranslation; event.code carries the
 *    physical position and is layout-independent. Everything below therefore
 *    decodes event.code against US QWERTY and never reads event.key.
 */
const MAX_KEY_GAP_MS = 30

// Enter-terminated bursts are high confidence, so a short code is accepted.
const MIN_CODE_LENGTH = 4

// Scanners configured with no suffix are flushed on silence instead. That path
// has no explicit terminator, so it demands a longer code to stay conservative.
const MIN_UNTERMINATED_LENGTH = 8
const FLUSH_DELAY_MS = 90

/*
 * event.code -> [unshifted, shifted] on a US QWERTY reference layout. The
 * scanner emits Shift+KeyC for an uppercase C, so the shifted column is what
 * makes case survive; mapping every letter to uppercase would corrupt any
 * code that legitimately contains lowercase.
 */
const US_QWERTY = {
  Digit1: ['1', '!'], Digit2: ['2', '@'], Digit3: ['3', '#'], Digit4: ['4', '$'],
  Digit5: ['5', '%'], Digit6: ['6', '^'], Digit7: ['7', '&'], Digit8: ['8', '*'],
  Digit9: ['9', '('], Digit0: ['0', ')'],

  KeyA: ['a', 'A'], KeyB: ['b', 'B'], KeyC: ['c', 'C'], KeyD: ['d', 'D'],
  KeyE: ['e', 'E'], KeyF: ['f', 'F'], KeyG: ['g', 'G'], KeyH: ['h', 'H'],
  KeyI: ['i', 'I'], KeyJ: ['j', 'J'], KeyK: ['k', 'K'], KeyL: ['l', 'L'],
  KeyM: ['m', 'M'], KeyN: ['n', 'N'], KeyO: ['o', 'O'], KeyP: ['p', 'P'],
  KeyQ: ['q', 'Q'], KeyR: ['r', 'R'], KeyS: ['s', 'S'], KeyT: ['t', 'T'],
  KeyU: ['u', 'U'], KeyV: ['v', 'V'], KeyW: ['w', 'W'], KeyX: ['x', 'X'],
  KeyY: ['y', 'Y'], KeyZ: ['z', 'Z'],

  Minus: ['-', '_'], Equal: ['=', '+'], BracketLeft: ['[', '{'],
  BracketRight: [']', '}'], Backslash: ['\\', '|'], Semicolon: [';', ':'],
  Quote: ["'", '"'], Comma: [',', '<'], Period: ['.', '>'], Slash: ['/', '?'],
  Backquote: ['`', '~'],

  // Some scanners send digits from the numpad block
  Numpad0: ['0', '0'], Numpad1: ['1', '1'], Numpad2: ['2', '2'],
  Numpad3: ['3', '3'], Numpad4: ['4', '4'], Numpad5: ['5', '5'],
  Numpad6: ['6', '6'], Numpad7: ['7', '7'], Numpad8: ['8', '8'],
  Numpad9: ['9', '9'], NumpadSubtract: ['-', '-'], NumpadDecimal: ['.', '.'],
  NumpadDivide: ['/', '/'], NumpadAdd: ['+', '+'], NumpadMultiply: ['*', '*'],
}

/**
 * Watches for scanner bursts anywhere on the page.
 *
 * The burst is not suppressed while it happens — by the time the second
 * keystroke identifies it as a scan, the first has already reached whatever
 * input had focus. Callers are therefore expected to *overwrite* the target
 * field with the code they receive rather than append to it, which cleans up
 * any characters that landed natively. Note that those stray characters are
 * whatever the OS layout produced, while the code passed to the callback is
 * decoded from physical keys — another reason never to append.
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

    if (e.code === 'Enter' || e.code === 'NumpadEnter') {
      if (buffer.length >= MIN_CODE_LENGTH && gap <= MAX_KEY_GAP_MS) {
        // The scanner's suffix — swallow it so it cannot submit a form
        e.preventDefault()
        flush(MIN_CODE_LENGTH)
      } else {
        reset()
      }
      return
    }

    // Scanned codes never contain spaces, but human input constantly does.
    // Checked before the map lookup, which would otherwise swallow it.
    if (e.code === 'Space') {
      reset()
      return
    }

    const mapped = US_QWERTY[e.code]

    // Not a character key: Shift, Tab, arrows, F-keys. Leave the buffer be so a
    // stray modifier mid-burst does not discard a valid scan.
    if (!mapped) return

    if (gap > MAX_KEY_GAP_MS) buffer = ''
    buffer += e.shiftKey ? mapped[1] : mapped[0]

    if (flushTimer) clearTimeout(flushTimer)
    flushTimer = setTimeout(() => flush(MIN_UNTERMINATED_LENGTH), FLUSH_DELAY_MS)
  }

  onMounted(() => document.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeyDown)
    reset()
  })
}
