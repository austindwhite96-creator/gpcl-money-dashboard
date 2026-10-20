import test from 'node:test'
import assert from 'node:assert/strict'
import { shortJobName } from '../src/lib/names.ts'

test('dash suffix kept in parentheses', () => {
  assert.equal(shortJobName('Sheryl Jones – Blue Top'), 'Sheryl J (Blue Top)')
  assert.equal(shortJobName('Sheryl Jones - Blue Top'), 'Sheryl J (Blue Top)')
  assert.equal(shortJobName('Sheryl J. – Blue Top'), 'Sheryl J (Blue Top)')
})
test('plain names unchanged in style', () => {
  assert.equal(shortJobName('Sheryl Jones'), 'Sheryl J.')
  assert.equal(shortJobName('Jennifer W.'), 'Jennifer W.')
  assert.equal(shortJobName('Sheryl J (Blue Top)'), 'Sheryl J (Blue Top)')
  assert.equal(shortJobName(''), '')
})
