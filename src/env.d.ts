import type * as L from 'leaflet'

declare global {
  interface window {
    L: L
  }
}

export {}