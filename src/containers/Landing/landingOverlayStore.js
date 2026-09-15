import { create } from 'zustand'

export const useLandingOverlayStore = create(set => ({
  active: null,
  openOverlay: (overlayId, payload = {}, sourceBlockId = null) => set({
    active: { overlayId, payload, sourceBlockId },
  }),
  closeOverlay: () => set({ active: null }),
}))

