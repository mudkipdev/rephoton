<script lang="ts">
  import { BlueskyClient } from '$lib/api/bluesky/adapter'
  import { site } from '$lib/api/client.svelte'
  import { profile } from '$lib/app/auth.svelte'
  import { t } from '$lib/app/i18n'
  import { Header, Tabs } from '$lib/ui/layout'

  let { children } = $props()

  let isBluesky = $derived(profile.client instanceof BlueskyClient)

  let routes = $derived(
    isBluesky
      ? [{ href: '/create/post', name: $t('nav.create.post') }]
      : [
          { href: '/create/post', name: $t('nav.create.post') },
          { href: '/create/community', name: $t('nav.create.community') },
        ],
  )
</script>

{#if !site || !(site.data?.site_view.local_site.community_creation_admin_only && !profile.isAdmin)}
  <Tabs margin={false} {routes} />
{/if}

<Header pageHeader>
  {$t('nav.create.label')}
</Header>

{@render children?.()}
