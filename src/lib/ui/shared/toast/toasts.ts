import { writable } from 'svelte/store'

type ToastType = keyof typeof toastColors

export const toastColors = {
  error:
    'border border-red-300 dark:border-red-900 text-red-900 dark:text-red-300',
  warning:
    'border border-yellow-300 dark:border-yellow-900 text-yellow-900 dark:text-yellow-300',
  success:
    'border border-green-300 dark:border-green-900 text-green-900 dark:text-green-300',
  info: 'border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-slate-300',
}

export interface Toast {
  id: number
  title?: string
  content: string
  type: ToastType
  loading?: boolean
  long?: boolean
  action?: () => void
}

export const toasts = writable<Toast[]>([])

export function toast({
  title,
  content,
  type = 'info',
  duration = 5000,
  loading = false,
  long = false,
  action,
}: {
  title?: string
  content: string
  type?: ToastType
  duration?: number
  loading?: boolean
  long?: boolean
  action?: () => void
}) {
  let id = 0

  toasts.update((toasts) => {
    id = Math.max(0, ...toasts.map((t) => t.id)) + 1

    return [
      ...toasts,
      {
        id: id,
        content: content,
        title: title,
        type: type,
        loading: loading,
        long: long,
        action: action,
      },
    ]
  })

  setTimeout(() => {
    toasts.update((toasts) => toasts.filter((toast) => toast.id != id))
  }, duration)

  return id
}

export const removeToast = (id: number) =>
  toasts.update((toasts) => toasts.filter((toast) => toast.id != id))
