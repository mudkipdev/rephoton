import { getClient } from '$lib/api/client.svelte'
import { profile } from '$lib/app/auth.svelte'
import { redirect } from '@sveltejs/kit'

export async function load({ fetch }) {
  // Bluesky doesn't have federation/instances concept
  if (profile.current.client === 'bluesky') {
    redirect(303, '/')
  }

  return (await getClient(undefined, fetch).getFederatedInstances())
    .federated_instances
}
