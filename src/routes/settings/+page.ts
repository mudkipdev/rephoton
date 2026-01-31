import { browser } from '$app/environment'
import { redirect } from '@sveltejs/kit'

export function load() {
  // Only redirect on desktop (server-side we can't check, so we'll handle it client-side)
  if (browser && window.innerWidth >= 768) {
    redirect(302, '/settings/app')
  }
}
