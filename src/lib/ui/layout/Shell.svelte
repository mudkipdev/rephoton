<script lang="ts">
  import { settings } from '$lib/app/settings.svelte'
  import { t } from '$lib/app/i18n'
  import type { Snippet } from 'svelte'
  import type {
    ClassValue,
    HTMLAttributes,
    UIEventHandler,
  } from 'svelte/elements'
  import { scrollY } from 'svelte/reactivity/window'
  import {
    ChevronDoubleLeft,
    ChevronDoubleRight,
    Icon,
  } from 'svelte-hero-icons/dist'
  import InvertedCorner from './InvertedCorner.svelte'

  interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: Snippet
    navbar?: Snippet<[{ class: ClassValue; style?: string }]>
    sidebar?: Snippet<[{ class: ClassValue; style?: string }]>
    main?: Snippet<[{ class: ClassValue; style?: string }]>
    suffix?: Snippet<[{ class: ClassValue; style?: string }]>
  }

  let { children, navbar, sidebar, main, suffix }: Props = $props()

  let previousTop = 0
  const onscroll: UIEventHandler<Window> = () => {
    if (!settings.dock.autoHide) {
      dockVisible = true
      return
    }

    dockVisible = (scrollY?.current ?? 0) <= previousTop
    previousTop = scrollY?.current ?? 0
  }

  let dockVisible = $state(true)
</script>

<svelte:window {onscroll} />

{@render children?.()}
<div class="min-h-screen flex flex-col">
  <div
    class={['shell-navbar-holder', !dockVisible && 'max-md:-bottom-24!']}
    aria-hidden="true"
  >
    <div class="md:hidden flex justify-between" dir="ltr">
      <InvertedCorner
        class="w-8 h-8 text-slate-50 dark:text-zinc-950 rotate-270"
      />
      <InvertedCorner
        class="w-8 h-8 text-slate-50 dark:text-zinc-950 rotate-180"
      />
    </div>
    {@render navbar?.({
      class: ['shell-navbar'],
    })}
  </div>
  <div
    class={[
      'shell-content flex-1',
      settings.experimentalUI
        ? 'experimental'
        : settings.newWidth && 'limit-width',
    ]}
    style="{settings.sidebars.left ? '' : '--c-sidebar: 3rem;'}{settings.sidebars
      .right
      ? ''
      : '--c-suffix: 3rem;'}"
  >
    <div
      class={['shell-aside shell-sidebar', !settings.sidebars.left && 'collapsed']}
    >
      <button
        type="button"
        class="shell-collapse"
        aria-label={$t('nav.sidebar.toggle')}
        aria-expanded={settings.sidebars.left}
        onclick={() => (settings.sidebars.left = !settings.sidebars.left)}
      >
        <Icon
          src={settings.sidebars.left ? ChevronDoubleLeft : ChevronDoubleRight}
          size="16"
          micro
        />
      </button>
      <div class="shell-aside-content">
        {@render sidebar?.({ class: 'w-full' })}
      </div>
    </div>
    {@render main?.({
      class: `shell-main`,
    })}
    <div
      class={['shell-aside shell-suffix', !settings.sidebars.right && 'collapsed']}
    >
      <button
        type="button"
        class="shell-collapse"
        aria-label={$t('nav.sidebar.toggle')}
        aria-expanded={settings.sidebars.right}
        onclick={() => (settings.sidebars.right = !settings.sidebars.right)}
      >
        <Icon
          src={settings.sidebars.right ? ChevronDoubleRight : ChevronDoubleLeft}
          size="16"
          micro
        />
      </button>
      <div class="shell-aside-content">
        {@render suffix?.({ class: '' })}
      </div>
    </div>
  </div>
</div>

<style>
  @reference '../../../app.css';

  .shell-navbar-holder {
    position: fixed;
    bottom: 0;
    z-index: 50;
    pointer-events: none;
    width: 100%;
    transition: bottom 0.4s cubic-bezier(0.075, 0.82, 0.165, 1);

    @variant md {
      position: sticky;
      top: 0;
    }

    :global {
      .shell-navbar {
        pointer-events: auto;
        backdrop-filter: blur(var(--blur-xl));
        border-width: 1px;
        border-color: var(--color-slate-100);
        border-top: none;
        background-color: var(--color-slate-50);

        @variant md {
          border-left: none;
          border-right: none;
          background-color: --alpha(var(--color-slate-50) / 70%);
        }

        @variant dark {
          background-color: var(--color-zinc-950);
          border-color: var(--color-zinc-900);
          @variant md {
            background-color: --alpha(var(--color-zinc-950) / 70%);
          }
        }
      }
    }
  }

  .shell-content {
    width: 100%;
    display: grid;
    height: 100%;
    margin-left: auto;
    margin-right: auto;
    grid-area: content;
    grid-template-columns: 1fr;
    grid-template-areas: 'main';
    justify-items: start;
  }

  .shell-content.limit-width {
    max-width: 100rem;
  }

  /* Experimental UI: shrink the page margin so content fills the viewport. */
  .shell-content.experimental {
    max-width: none;
  }

  @media (min-width: 48rem) {
    .shell-content {
      grid-template-columns: var(--c-sidebar, 16rem) minmax(0, 1fr);
      justify-items: end start;
      grid-template-areas: 'sidebar main';
    }
  }

  @media (min-width: 64rem) {
    .shell-content {
      grid-template-columns: var(--c-sidebar, 20%) minmax(0, 1fr)
        var(--c-suffix, 20%);
      justify-items: end center start;
      grid-template-areas: 'sidebar main suffix';
    }

    .shell-content.limit-width {
      width: 100%;
      grid-template-columns: var(--c-sidebar, 2fr) minmax(0, 5fr)
        var(--c-suffix, 2fr);
    }

    .shell-content.experimental {
      width: 100%;
      grid-template-columns: var(--c-sidebar, 16rem) minmax(0, 1fr)
        var(--c-suffix, 16rem);
    }
  }

  .shell-content {
    :global {
      .shell-main {
        width: 100%;
        grid-area: main;
        background-color: var(--color-slate-25);
        border-left: 1px solid var(--color-slate-100);
        border-right: 1px solid var(--color-slate-100);
        padding-bottom: calc(var(--spacing) * 22);

        @variant dark {
          background-color: var(--color-zinc-925);
          border-left: 1px solid var(--color-zinc-900);
          border-right: 1px solid var(--color-zinc-900);
        }

        @variant md {
          padding-bottom: calc(var(--spacing) * 6);
        }
      }

      .shell-aside {
        display: none;
        flex-direction: column;
        position: sticky;
        top: 0;
        left: 0;
        background-color: var(--color-slate-50);
        z-index: 40;
        width: 100%;
        overflow: hidden;

        @variant dark {
          background-color: var(--color-zinc-950);
        }
      }

      .shell-aside-content {
        flex: 1;
        min-height: 0;
        width: 100%;
        overflow: auto;
      }

      .shell-aside.collapsed .shell-aside-content {
        display: none;
      }

      .shell-collapse {
        position: sticky;
        top: 0;
        z-index: 10;
        flex-shrink: 0;
        margin: calc(var(--spacing) * 2);
        padding: calc(var(--spacing) * 1.5);
        border-radius: var(--radius-lg);
        color: var(--color-slate-500);
        cursor: pointer;
        transition: background-color 150ms var(--ease-cubic);

        &:hover {
          background-color: var(--color-slate-200);
        }

        @variant dark {
          color: var(--color-zinc-400);
          &:hover {
            background-color: var(--color-zinc-800);
          }
        }
      }

      .shell-sidebar {
        grid-area: sidebar;
        width: 100% !important;
        .shell-collapse {
          align-self: flex-end;
        }
        @variant md {
          display: flex;
          top: calc(var(--spacing) * 14.5);
          max-height: calc(100vh - 4rem);
        }
      }

      .shell-suffix {
        grid-area: suffix;
        .shell-collapse {
          align-self: flex-start;
        }
        @variant lg {
          display: flex;
          top: calc(var(--spacing) * 16);
          max-height: calc(100vh - 4rem);
        }
      }
    }
  }
</style>
