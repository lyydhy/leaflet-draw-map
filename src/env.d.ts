import type * as L from '@types/leaflet'

declare global {
  interface window {
    L: L
  }
}

export {}