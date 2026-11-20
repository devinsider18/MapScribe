import assert from 'node:assert/strict';
import test from 'node:test';
import {
  encodeMaterialIcon,
  getFirstEmoji,
  getMaterialIconName,
} from '../src/constants/listIcons.mjs';

test('encodes and reads supported Material map icons', () => {
  assert.equal(getMaterialIconName(encodeMaterialIcon('map')), 'map');
  assert.equal(getMaterialIconName('material-icon:unknown'), null);
  assert.equal(getMaterialIconName('🌍'), null);
});

test('keeps only the first emoji, including multi-code-point emoji', () => {
  assert.equal(getFirstEmoji('🌍🚗'), '🌍');
  assert.equal(getFirstEmoji('👨‍👩‍👧‍👦🏠'), '👨‍👩‍👧‍👦');
  assert.equal(getFirstEmoji('1️⃣2️⃣'), '1️⃣');
  assert.equal(getFirstEmoji('No emoji'), '');
});
