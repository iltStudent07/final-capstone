import { describe, expect, test } from 'vitest'
import {
  DESCRIPTION_MAX_LENGTH,
  validateDescription,
  validateEmail,
  validatePassword,
  validateTitle,
} from '../utils/validation'

describe('validation helpers', () => {
  test('rejects unsupported special characters in titles', () => {
    expect(validateTitle('Release <script>', 'Project title')).toBe(
      'Project title can only include letters, numbers, spaces, and basic punctuation.'
    )
  })

  test('limits descriptions to 100 characters', () => {
    expect(validateDescription('a'.repeat(DESCRIPTION_MAX_LENGTH + 1), 'Task description', true)).toBe(
      `Task description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`
    )
  })

  test('accepts common email characters and rejects unsupported ones', () => {
    expect(validateEmail('user.name+team@example.com')).toBeNull()
    expect(validateEmail('user!name@example.com')).toBe('Enter a valid email.')
  })

  test('requires passwords to include a letter and number', () => {
    expect(validatePassword('password')).toBe(
      'Password must be 8-64 characters, include at least one letter and one number, and only use common password symbols.'
    )
  })
})
