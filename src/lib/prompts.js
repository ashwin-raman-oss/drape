// Builds the Claude prompt for wardrobe item tagging via vision
export function buildTaggingPrompt() {
  return `You are a fashion analyst. You will be given two images of a clothing item:
1. The item itself (laid flat or on a hanger)
2. The care label (may be absent)

Return ONLY a valid JSON object with these exact fields:
{
  "category": "Top" | "Bottom" | "Shoes" | "Outer layer",
  "item_type": "e.g. Oxford shirt, chinos, Chelsea boots",
  "colour": "primary colour name",
  "material": "e.g. cotton, wool, leather or null",
  "brand": "brand name from label or null",
  "formality": 1-5 integer (1=loungewear, 5=black tie),
  "style_notes": "one sentence of style character, texture, fit, or notable details"
}
Do not include any text outside the JSON object.`
}

// Builds the Claude prompt for outfit recommendations
export function buildRecommendationPrompt({ occasion, weather, lifestyleContext, wardrobeItems, recentRatings }) {
  const recentlyWornIds = wardrobeItems
    .filter(item => {
      if (!item.last_worn_at) return false
      const daysSince = (Date.now() - new Date(item.last_worn_at)) / 86400000
      return daysSince < 7 && item.category === 'Top'
    })
    .map(i => i.id)

  const itemsText = wardrobeItems
    .filter(i => i.status === 'active')
    .map(i => {
      const worn = recentlyWornIds.includes(i.id) ? ' [RECENTLY WORN — deprioritise]' : ''
      return `ID:${i.id} | ${i.category} | ${i.item_type} | ${i.colour} | formality:${i.formality} | ${i.style_notes}${worn}`
    })
    .join('\n')

  const ratingsText = recentRatings.length
    ? recentRatings.map(r =>
        `Occasion: ${r.occasion}, Weather: ${r.weather}, Rating: ${r.rating === 1 ? '👍' : '👎'}${r.comment ? `, Comment: ${r.comment}` : ''}`
      ).join('\n')
    : 'No ratings yet.'

  return `You are a personal stylist AI. Recommend exactly 2 complete outfit looks from the wardrobe below.

OCCASION: ${occasion}
WEATHER: ${weather}
USER LIFESTYLE CONTEXT: ${lifestyleContext.join(', ')}

RECENT OUTFIT FEEDBACK (last 10):
${ratingsText}

AVAILABLE WARDROBE ITEMS:
${itemsText}

Rules:
- Each look needs at least a Top, Bottom, and Shoes. Add Outer layer if weather warrants it.
- Strongly prefer items that have NOT been worn in the last 7 days, especially Tops.
- Match formality to occasion. Respect weather.
- Learn from the feedback history — avoid repeating combinations that got 👎.

Return ONLY a valid JSON array with exactly 2 objects:
[
  {
    "look_number": 1,
    "item_ids": ["uuid1", "uuid2", "uuid3"],
    "reason": "one sentence explaining why this outfit works"
  },
  {
    "look_number": 2,
    "item_ids": ["uuid1", "uuid2", "uuid3"],
    "reason": "one sentence explaining why this outfit works"
  }
]
Do not include any text outside the JSON array.`
}
