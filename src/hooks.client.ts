import { profile } from '$lib/app/auth'
import { DEFAULT_INSTANCE_URL } from '$lib/app/instance.svelte'
import { instanceToURL } from '$lib/app/util.svelte'

// Warm the connection to the active Lemmy/PieFed instance as early as possible.
// SSR is off by default, so the very first API request (getSite / getPosts that
// fills the post-load skeleton) is a cross-origin call whose DNS + TCP + TLS
// handshake would otherwise start only after the bundle finishes booting.
// Kicking off a preconnect here lets that handshake run in parallel with the
// rest of client init, shaving latency off the initial skeleton.
try {
  const instance = profile.current.instance || DEFAULT_INSTANCE_URL
  const origin = new URL(instanceToURL(instance)).origin

  // CORS API requests are anonymous cross-origin, so the preconnect must be
  // crossorigin to be reused by the actual fetches.
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = origin
  link.crossOrigin = 'anonymous'
  document.head.appendChild(link)
} catch {
  // best-effort only; never block startup on a malformed instance value
}

export function handleError({ error }) {
  return {
    message: error as string,
  }
}
