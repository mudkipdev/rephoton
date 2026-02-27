<script lang="ts">
  import { t } from '$lib/app/i18n'
  import { Button } from 'mono-svelte'
  import { ArrowUp } from 'svelte-hero-icons/dist'
  import { onMount } from 'svelte'

  let visible = $state(false)

  onMount(() => {
    const handleScroll = () => {
      visible = window.scrollY > 300
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  })

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
</script>

{#if visible}
  <Button
    class="fixed bottom-20 right-4 z-40 shadow-lg md:bottom-8 md:right-8"
    onclick={scrollToTop}
    icon={ArrowUp}
    label={$t('common.backToTop')}
    size="custom"
    rounding="full"
    color="primary"
  />
{/if}
