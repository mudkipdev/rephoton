import { getDefaultTheme } from '$lib/app/theme/presets'
import { calculateVars } from '$lib/app/theme/theme.svelte'
import type { Handle, HandleServerError } from '@sveltejs/kit'

// The user's chosen theme lives in localStorage, which the server can't read,
// so SSR can only render a default. Without this the first paint used the bare
// (near-black) base palette and then snapped to the user's theme on hydration.
// Inject the default ("normal") theme's CSS variables inline on <html> during
// SSR — inline styles win the cascade, so the first paint is the normal theme.
// On hydration the layout overwrites <html>'s style with the user's actual
// theme, so the flash (if any) is normal-theme → user-theme instead of black.
const defaultThemeVars = calculateVars(getDefaultTheme())

export const handle: Handle = async ({ event, resolve }) =>
  resolve(event, {
    // `/*THEME_VARS*/` is a placeholder in app.html; it's a valid (inert) CSS
    // comment if this transform never runs (e.g. the static adapter).
    transformPageChunk: ({ html }) =>
      html.replace('/*THEME_VARS*/', defaultThemeVars),
  })

export const handleError: HandleServerError = async ({
  error,
  event,
  status,
  message,
}) => {
  if (status == 404) return

  console.error(`An error was captured:`)
  console.error(error)
  console.error(`Event:`, event)
  console.error(`Status:`, status)
  console.error(`Message:`, message)
}
