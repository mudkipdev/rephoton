<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import { t } from '$lib/app/i18n'
  import { CommonList } from '$lib/ui/layout'
  import { Material } from 'mono-svelte'
  import {
    ChevronRight,
    Cog6Tooth,
    GlobeAlt,
    Icon,
    Photo,
    ShieldCheck,
    Squares2x2,
  } from 'svelte-hero-icons/dist'

  const categories = [
    {
      href: '/settings/app',
      name: $t('settings.app.title'),
      icon: Cog6Tooth,
    },
    {
      href: '/settings/lemmy',
      name: $t('settings.lemmy.title'),
      icon: GlobeAlt,
    },
    {
      href: '/settings/embeds',
      name: $t('settings.embeds.title'),
      icon: Photo,
    },
    {
      href: '/settings/moderation',
      name: $t('settings.moderation.title'),
      icon: ShieldCheck,
    },
    {
      href: '/settings/other',
      name: $t('settings.other.title'),
      icon: Squares2x2,
    },
  ]

  onMount(() => {
    // Redirect to first category on desktop
    if (window.innerWidth >= 768) {
      goto('/settings/app', { replaceState: true })
    }
  })
</script>

<div class="md:hidden">
  <CommonList>
    {#each categories as category}
      <li>
        <a
          href={category.href}
          class="flex items-center justify-between p-4 hover:bg-slate-100 dark:hover:bg-zinc-900 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-xl bg-slate-200 dark:bg-zinc-800 grid place-items-center"
            >
              <Icon src={category.icon} size="20" mini />
            </div>
            <span class="text-base font-medium">{category.name}</span>
          </div>
          <Icon
            src={ChevronRight}
            size="20"
            mini
            class="text-slate-400 dark:text-zinc-600"
          />
        </a>
      </li>
    {/each}
  </CommonList>
</div>
