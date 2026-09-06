/// <reference types="vite/client" />

import type { SubtrakApi } from '@shared/types'

declare global {
  interface Window {
    subtrak: SubtrakApi
  }
}

export {}
