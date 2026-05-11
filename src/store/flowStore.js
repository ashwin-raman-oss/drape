import { create } from 'zustand'

export const useFlowStore = create(set => ({
  occasion: '',
  weather: '',
  recommendations: null,   // { looks: [ { look_number, item_ids, reason } ] }
  venueType: null,          // 'indoor' | 'outdoor' | 'ambiguous'
  outdoorTravel: null,      // true | false

  setOccasion: (occasion) => set({ occasion }),
  setWeather: (weather) => set({ weather }),
  setRecommendations: (recs) => set({ recommendations: recs }),
  setVenueType: (type) => set({ venueType: type }),
  setOutdoorTravel: (bool) => set({ outdoorTravel: bool }),
  resetFlow: () => set({ occasion: '', weather: '', recommendations: null, venueType: null, outdoorTravel: null }),
}))
