<script lang="ts">
  import { goto } from '$app/navigation'
  import { BlueskyClient } from '$lib/api/bluesky/adapter'
  import { profile } from '$lib/app/auth.svelte'
  import CommunityForm from '$lib/feature/community/CommunityForm.svelte'
  import { Material } from 'mono-svelte'
  import { onMount } from 'svelte'

  let isBluesky = $derived(profile.client instanceof BlueskyClient)

  onMount(() => {
    if (isBluesky) {
      goto('/')
    }
  })
</script>

{#if isBluesky}
  <div class="max-w-2xl mx-auto p-4">
    <Material color="warning" class="p-6">
      <h1 class="text-xl font-bold mb-2">Communities Not Available</h1>
      <p>Bluesky doesn't have communities. You'll be redirected to the home page.</p>
    </Material>
  </div>
{:else}
  <CommunityForm>
    {#snippet formtitle()}{/snippet}
  </CommunityForm>
{/if}
