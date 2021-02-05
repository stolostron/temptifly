'use strict'
import {
  if_eqFn,
  if_gtFn,
  if_neFn,
  if_orFn,
} from '../../../../../src/helpers'

const opts = {
  fn: () => {
    return true
  },
  inverse: () => {
    return false
  }
}

describe('handlebar helper tests', () => {
  it('eq true', () => {
    expect(if_eqFn(4, 4, opts)).toBe(true)
  })
  it('eq false', () => {
    expect(if_eqFn(4, 5, opts)).toBe(false)
  })
  it('ne true', () => {
    expect(if_neFn(4, 5, opts)).toBe(true)
  })
  it('ne false', () => {
    expect(if_neFn(4, 4, opts)).toBe(false)
  })
  it('gt true', () => {
    expect(if_gtFn(5, 4, opts)).toBe(true)
  })
  it('gt false', () => {
    expect(if_gtFn(4, 5, opts)).toBe(false)
  })
  it('or true', () => {
    expect(if_orFn(5, undefined, opts)).toBe(true)
  })
  it('or false', () => {
    expect(if_orFn(undefined, undefined, opts)).toBe(false)
  })
})
