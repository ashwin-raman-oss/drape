// Builds the Claude prompt for wardrobe item tagging via vision
export function buildTaggingPrompt() {
  return `You are a fashion analyst. You will be given one or two images of a clothing item:
1. The item itself (laid flat or on a hanger)
2. The care label (optional — may not be provided)

Analyse the item and return ONLY a valid JSON object. No markdown fences, no explanation, just the JSON.

Required fields:
- "category": exactly one of "Top", "Bottom", "Shoes", "Outer layer"
- "item_type": descriptive name, e.g. "Oxford shirt", "chinos", "Chelsea boots"
- "colour": primary colour name as a string
- "material": fabric/material name as a string, or null if unknown
- "brand": brand name from the care label as a string, or null if not visible
- "formality": integer between 1 and 5 (1 = loungewear, 2 = casual, 3 = smart casual, 4 = business, 5 = black tie)
- "style_notes": one sentence describing style character, texture, fit, or notable details

Example output (do not copy these values — analyse the actual images):
{"category":"Top","item_type":"Oxford shirt","colour":"pale blue","material":"cotton","brand":"Charles Tyrwhitt","formality":4,"style_notes":"Crisp poplin weave with a classic spread collar, slightly fitted cut."}`
}

// Builds the Claude prompt for outfit recommendations
export function buildRecommendationPrompt({ occasion, weather, lifestyleContext, wardrobeItems, recentRatings, recentReactions = [], wardrobeMap }) {
  const recentlyWornIds = wardrobeItems
    .filter(item => {
      if (item.category !== 'Top') return false
      if (!item.last_worn_at) return false
      const daysSince = (Date.now() - new Date(item.last_worn_at)) / 86400000
      return daysSince < 7
    })
    .map(i => i.id)

  const itemsText = wardrobeItems
    .filter(i => i.status === 'active')
    .map(i => {
      const worn = recentlyWornIds.includes(i.id) ? ' [RECENTLY WORN — deprioritise]' : ''
      const conditions = Array.isArray(i.condition_flags) && i.condition_flags.length > 0
        ? ` | Conditions: ${i.condition_flags.join(', ')}`
        : ''
      const notes = i.personal_notes?.trim()
        ? ` | Owner notes: ${i.personal_notes.trim()}`
        : ''
      return `ID:${i.id} | ${i.category} | ${i.item_type} | ${i.colour} | formality:${i.formality} | ${i.style_notes}${conditions}${notes}${worn}`
    })
    .join('\n')

  const ratingsText = recentRatings.length
    ? recentRatings.map(r => {
        const safeComment = (r.comment ?? '').replace(/[\r\n]/g, ' ').slice(0, 200)
        const itemNames = (r.item_ids ?? [])
          .map(id => wardrobeMap?.get(id))
          .filter(Boolean)
          .map(item => `${item.colour} ${item.item_type}`)
          .join(', ')
        const lines = [`Occasion: ${r.occasion}, Weather: ${r.weather}, Rating: ${r.rating === 1 ? '👍' : '👎'}`]
        if (itemNames) lines.push(`Items worn: ${itemNames}`)
        if (safeComment) lines.push(`Comment: ${safeComment}`)
        return lines.join('\n')
      }).join('\n\n')
    : 'No ratings yet.'

  const reactionsText = recentReactions.length
    ? recentReactions.map(r => {
        const reactionEmoji = r.reaction === 'thumbs_up' ? '👍' : '👎'
        const itemNames = (r.item_ids ?? [])
          .map(id => wardrobeMap?.get(id))
          .filter(Boolean)
          .map(item => `${item.colour} ${item.item_type}`)
          .join(', ')
        const lines = [`Occasion: ${r.occasion}, Weather: ${r.weather}, Reaction: ${reactionEmoji}`]
        if (itemNames) lines.push(`Items: ${itemNames}`)
        if (r.reaction === 'thumbs_down' && r.reaction_items?.length) lines.push(`Flagged: ${r.reaction_items.join(', ')}`)
        if (r.reaction_comment) lines.push(`Comment: ${r.reaction_comment}`)
        return lines.join('\n')
      }).join('\n\n')
    : ''

  return `You are a personal stylist AI. Recommend exactly 2 complete outfit looks from the wardrobe below.

OCCASION: ${occasion}
WEATHER: ${weather}
USER LIFESTYLE CONTEXT: ${lifestyleContext.join(', ')}

RECENT OUTFIT FEEDBACK (last 10):
${ratingsText}
${reactionsText ? `
PRE-WEAR REACTIONS (combination-level signal — individual items are not penalised):
${reactionsText}

Pre-wear reactions reflect immediate style opinions, not wear experience. A 👎 means this specific combination didn't feel right for this context — the individual items remain strong candidates in other pairings. A 👍 confirms the combination looked right before wearing.
` : ''}
AVAILABLE WARDROBE ITEMS:
${itemsText}

Rules:
- Each look needs at least a Top, Bottom, and Shoes. Add Outer layer if weather warrants it.
- Tops marked [RECENTLY WORN — deprioritise] have been worn in the last 6 days — do not include them in recommendations unless the wardrobe has no valid alternatives for the requested occasion.
- Respect Conditions flags on items — 'Casual only' means never recommend for formal or office occasions, 'Cold weather only' means only recommend when weather is cold or rainy, 'Formal only' means only recommend for formal or smart occasions. Owner notes give personal context about how the user thinks about that item — use them to inform fit and occasion suitability.
- Match formality to occasion. Respect weather.
- Learn from the feedback history — avoid repeating specific item combinations that got 👎, and note which combinations and occasions earned 👍 to inform similar future requests.

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

// Builds the Claude prompt for a single replacement outfit after a thumbs-down reaction
export function buildReplacementPrompt({ occasion, weather, lifestyleContext, wardrobeItems, wardrobeMap, downvotedLook, flaggedItems = [] }) {
  const recentlyWornIds = wardrobeItems
    .filter(item => {
      if (item.category !== 'Top') return false
      if (!item.last_worn_at) return false
      const daysSince = (Date.now() - new Date(item.last_worn_at)) / 86400000
      return daysSince < 7
    })
    .map(i => i.id)

  const itemsText = wardrobeItems
    .filter(i => i.status === 'active')
    .map(i => {
      const worn = recentlyWornIds.includes(i.id) ? ' [RECENTLY WORN — deprioritise]' : ''
      const conditions = Array.isArray(i.condition_flags) && i.condition_flags.length > 0
        ? ` | Conditions: ${i.condition_flags.join(', ')}`
        : ''
      const notes = i.personal_notes?.trim() ? ` | Owner notes: ${i.personal_notes.trim()}` : ''
      return `ID:${i.id} | ${i.category} | ${i.item_type} | ${i.colour} | formality:${i.formality} | ${i.style_notes}${conditions}${notes}${worn}`
    })
    .join('\n')

  const rejectedItems = (downvotedLook.item_ids ?? [])
    .map(id => wardrobeMap?.get(id))
    .filter(Boolean)
    .map(item => `${item.colour} ${item.item_type}`)
    .join(', ')

  return `You are a personal stylist AI. Generate exactly ONE alternative outfit for the occasion below.

OCCASION: ${occasion}
WEATHER: ${weather}
USER LIFESTYLE CONTEXT: ${lifestyleContext.join(', ')}

REJECTED LOOK — DO NOT REPEAT:
Items: ${rejectedItems}
Flagged categories: ${flaggedItems.join(', ') || 'none specified'}
Instruction: Generate exactly ONE alternative complete outfit. Do not use the same combination of items as the rejected look. The individual items are not banned — they may appear in different pairings. The flagged categories indicate which part of the outfit didn't work — pay special attention to choosing a better option for those categories.

AVAILABLE WARDROBE ITEMS:
${itemsText}

Rules:
- Each look needs at least a Top, Bottom, and Shoes. Add Outer layer if weather warrants it.
- Tops marked [RECENTLY WORN — deprioritise] have been worn in the last 6 days — avoid unless no alternatives.
- Match formality to occasion. Respect weather.

Return ONLY a valid JSON object:
{
  "look_number": 1,
  "item_ids": ["uuid1", "uuid2", "uuid3"],
  "reason": "one sentence explaining why this outfit works"
}
Do not include any text outside the JSON object.`
}
