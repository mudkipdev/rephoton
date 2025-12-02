export function handleError({ error }) {
  return {
    message: error as string,
  }
}

// Easter egg: typing "67" 20 times redirects to a special video
let keySequence = ''
const TARGET_SEQUENCE = '67'.repeat(20) // "6767676767..." (40 characters total)

function handleEasterEggKeypress(event: KeyboardEvent) {
  // Only track number keys
  if (event.key >= '0' && event.key <= '9') {
    keySequence += event.key

    // Keep only the last 40 characters
    if (keySequence.length > TARGET_SEQUENCE.length) {
      keySequence = keySequence.slice(-TARGET_SEQUENCE.length)
    }

    // Check if the sequence matches
    if (keySequence === TARGET_SEQUENCE) {
      keySequence = '' // Reset the sequence
      window.location.href = 'https://www.youtube.com/watch?v=v0NDDoNRtQ8'
    }
  } else {
    // Reset sequence if non-number key is pressed
    keySequence = ''
  }
}

// Set up the easter egg listener when the app loads
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', handleEasterEggKeypress)
}
