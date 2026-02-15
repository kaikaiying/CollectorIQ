/**
 * Schema and validation for watch specs (catalog + user-added).
 * Keeps data clean and consistent for drift tracking and Discovery.
 */

export const MOVEMENT_TYPES = [
  'Automatic',
  'Manual winding',
  'Quartz',
  'Spring Drive',
  'Hybrid',
  'Other',
]

export const CATEGORIES = [
  'Diver',
  'Dress',
  'Chronograph',
  'GMT',
  'Field',
  'Pilot',
  'Luxury Sports',
  'Other',
]

const SPEC_ABS_MAX = 60 // s/day – sanity cap for mechanical; quartz typically ±0.5
const BRAND_MIN = 2
const BRAND_MAX = 50
const MODEL_MIN = 2
const MODEL_MAX = 80
const REF_MAX = 40
const CALIBRE_MAX = 30
const NOTES_MAX = 200

function trim(s) {
  return typeof s === 'string' ? s.trim() : ''
}

export function validateCustomWatch(input) {
  const errors = {}
  const brand = trim(input.brand)
  const model = trim(input.model)
  const reference = trim(input.reference)
  const specLow = input.specLow
  const specHigh = input.specHigh
  const movementType = trim(input.movementType)
  const movementCalibre = trim(input.movementCalibre)
  const category = trim(input.category)
  const notes = trim(input.notes)

  if (!brand) errors.brand = 'Brand is required.'
  else if (brand.length < BRAND_MIN) errors.brand = `At least ${BRAND_MIN} characters.`
  else if (brand.length > BRAND_MAX) errors.brand = `Max ${BRAND_MAX} characters.`

  if (!model) errors.model = 'Model name is required.'
  else if (model.length < MODEL_MIN) errors.model = `At least ${MODEL_MIN} characters.`
  else if (model.length > MODEL_MAX) errors.model = `Max ${MODEL_MAX} characters.`

  if (reference && reference.length > REF_MAX) errors.reference = `Max ${REF_MAX} characters.`

  const low = typeof specLow === 'number' ? specLow : parseFloat(specLow)
  const high = typeof specHigh === 'number' ? specHigh : parseFloat(specHigh)
  if (Number.isNaN(low)) errors.specLow = 'Enter a number (e.g. -2).'
  else if (low < -SPEC_ABS_MAX || low > SPEC_ABS_MAX) errors.specLow = `Between -${SPEC_ABS_MAX} and +${SPEC_ABS_MAX} s/day.`
  if (Number.isNaN(high)) errors.specHigh = 'Enter a number (e.g. +2).'
  else if (high < -SPEC_ABS_MAX || high > SPEC_ABS_MAX) errors.specHigh = `Between -${SPEC_ABS_MAX} and +${SPEC_ABS_MAX} s/day.`
  if (!Number.isNaN(low) && !Number.isNaN(high) && low > high) {
    errors.specHigh = 'High must be ≥ low.'
  }

  if (movementType && !MOVEMENT_TYPES.includes(movementType)) errors.movementType = 'Invalid option.'
  if (movementCalibre && movementCalibre.length > CALIBRE_MAX) errors.movementCalibre = `Max ${CALIBRE_MAX} characters.`
  if (category && !CATEGORIES.includes(category)) errors.category = 'Invalid option.'
  if (notes && notes.length > NOTES_MAX) errors.notes = `Max ${NOTES_MAX} characters.`

  const valid = Object.keys(errors).length === 0
  return {
    valid,
    errors,
    sanitized: valid
      ? {
          brand,
          model,
          reference: reference || null,
          specMin: low,
          specMax: high,
          movementType: movementType || null,
          movementCalibre: movementCalibre || null,
          category: category || null,
          notes: notes || null,
        }
      : null,
  }
}

/** Generate a stable reference for custom watches (no ref provided) */
export function generateCustomReference(brand, model) {
  const slug = [brand, model]
    .filter(Boolean)
    .join('-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .slice(0, 30)
  const id = Math.random().toString(36).slice(2, 8)
  return slug ? `custom-${slug}-${id}` : `custom-${id}`
}
