import type { Settings } from '$lib/app/settings.svelte'

/**
 * Webfonts are loaded lazily from the client instead of via a render-blocking
 * `<link rel="stylesheet">` in app.html. That link sat on the first-paint
 * critical path behind a third-party (fonts.googleapis.com) round-trip, and it
 * eagerly pulled in *both* Inter and Roboto Slab even though only one (or
 * neither) is ever used. Injecting just the selected font's stylesheet after
 * the app boots keeps first paint off the network: text renders immediately in
 * the system fallback and swaps to the webfont once it arrives (`display=swap`).
 */

type WebFont = Settings['font']

const GOOGLE_FONTS_HREF: Partial<Record<WebFont, string>> = {
  inter:
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  serifs:
    'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;500;600;700&display=swap',
}

const LINK_ID = 'photon-webfont'

/**
 * Ensure the stylesheet for the given font preference is present (and any
 * previously-loaded one removed). `system`/`browser` use native fonts and load
 * nothing. Safe to call repeatedly; it no-ops when the correct font is already
 * loaded.
 */
export function loadWebFont(font: WebFont): void {
  const href = GOOGLE_FONTS_HREF[font]
  const existing = document.getElementById(LINK_ID) as HTMLLinkElement | null

  if (!href) {
    existing?.remove()
    return
  }

  if (existing) {
    if (existing.href != href) existing.href = href
    return
  }

  const link = document.createElement('link')
  link.id = LINK_ID
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}
