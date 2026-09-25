export const DESCRIPTION_MAX_LENGTH = 100

type LiveValidationRule = 'name' | 'email' | 'password' | 'title' | 'description' | 'tags' | 'search'

const liveValidationConfig: Record<LiveValidationRule, { pattern: RegExp; maxLength?: number }> = {
  name: {
    pattern: /^[A-Za-z\s'-]*$/,
  },
  email: {
    pattern: /^[A-Za-z0-9@._+-]*$/,
  },
  password: {
    pattern: /^[A-Za-z0-9@$!%*?&^#_.-]*$/,
  },
  title: {
    pattern: /^[A-Za-z0-9 '&().,:/-]*$/,
  },
  description: {
    pattern: /^[A-Za-z0-9\s.,'’!?()&:/-]*$/,
    maxLength: DESCRIPTION_MAX_LENGTH,
  },
  tags: {
    pattern: /^[A-Za-z0-9\s,-]*$/,
  },
  search: {
    pattern: /^[A-Za-z0-9\s.,'’!?()&:/-]*$/,
  },
}

const namePattern = /^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/
const emailPattern = /^[A-Za-z0-9._+-]+@[A-Za-z0-9-]+\.[A-Za-z0-9.-]+$/
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&^#_.-]{8,64}$/
const titlePattern = /^[A-Za-z0-9][A-Za-z0-9 '&().,:/-]*$/
const descriptionPattern = /^[A-Za-z0-9\s.,'’!?()&:/-]*$/
const tagsPattern = /^[A-Za-z0-9]+(?:[A-Za-z0-9\s-]*[A-Za-z0-9]+)?(?:\s*,\s*[A-Za-z0-9]+(?:[A-Za-z0-9\s-]*[A-Za-z0-9]+)?)*$/

const getCharactersMessage = (label: string) => `${label} contains invalid characters.`

const getRequiredMessage = (label: string) => `${label} is required.`

const normalizeLabel = (label: string) => label.trim() || 'This field'

export const normalizeValidatedValue = (rule: LiveValidationRule, value: string) => {
  const maxLength = liveValidationConfig[rule].maxLength

  if (!maxLength) {
    return value
  }

  return value.slice(0, maxLength)
}

export const getLiveValidationError = (rule: LiveValidationRule, value: string, label: string) => {
  const normalizedValue = normalizeValidatedValue(rule, value)
  const normalizedLabel = normalizeLabel(label)

  if (!liveValidationConfig[rule].pattern.test(normalizedValue)) {
    return getCharactersMessage(normalizedLabel)
  }

  return null
}

export const validateName = (value: string, label = 'Name') => {
  const normalizedLabel = normalizeLabel(label)
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return getRequiredMessage(normalizedLabel)
  }

  if (!namePattern.test(trimmedValue)) {
    return `${normalizedLabel} can only include letters, spaces, apostrophes, and hyphens.`
  }

  return null
}

export const validateEmail = (value: string, label = 'Email') => {
  const normalizedLabel = normalizeLabel(label)
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return getRequiredMessage(normalizedLabel)
  }

  if (!emailPattern.test(trimmedValue)) {
    return `Enter a valid ${normalizedLabel.toLowerCase()}.`
  }

  return null
}

export const validatePassword = (value: string, label = 'Password') => {
  const normalizedLabel = normalizeLabel(label)

  if (!value) {
    return getRequiredMessage(normalizedLabel)
  }

  if (!passwordPattern.test(value)) {
    return `${normalizedLabel} must be 8-64 characters, include at least one letter and one number, and only use common password symbols.`
  }

  return null
}

export const validateTitle = (value: string, label = 'Title') => {
  const normalizedLabel = normalizeLabel(label)
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return getRequiredMessage(normalizedLabel)
  }

  if (!titlePattern.test(trimmedValue)) {
    return `${normalizedLabel} can only include letters, numbers, spaces, and basic punctuation.`
  }

  return null
}

export const validateDescription = (value: string, label = 'Description', required = false) => {
  const normalizedLabel = normalizeLabel(label)
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return required ? getRequiredMessage(normalizedLabel) : null
  }

  if (trimmedValue.length > DESCRIPTION_MAX_LENGTH) {
    return `${normalizedLabel} must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`
  }

  if (!descriptionPattern.test(trimmedValue)) {
    return `${normalizedLabel} can only include letters, numbers, spaces, and basic punctuation.`
  }

  return null
}

export const validateTags = (value: string, label = 'Tags') => {
  const normalizedLabel = normalizeLabel(label)
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return null
  }

  if (!tagsPattern.test(trimmedValue)) {
    return `${normalizedLabel} must be a comma-separated list using only letters, numbers, spaces, and hyphens.`
  }

  return null
}
