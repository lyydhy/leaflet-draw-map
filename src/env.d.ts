import type * as LType from '@types/leaflet'

declare global {
  interface window {
    L: LType
  }
}

export {}
