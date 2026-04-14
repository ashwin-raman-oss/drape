import { create } from 'zustand'

export const useFlowStore = create(set => ({
  occasion: '',
  weather: '',
  recommendations: null,   // { looks: [ { look_number, item_ids, reason } ] }

  setOccasion: (occasion) => set({ occasion }),
  setWeather: (weather) => set({ weather }),
  setRecommendations: (recs) => set({ recommendations: recs }),
  resetFlow: () => set({ occasion: '', weather: '', recommendations: null }),
}))
