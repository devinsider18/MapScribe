import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatPlaceDate,
  isValidPlaceDate,
  parsePlaceDate,
} from '../src/constants/placeDates.mjs';

test('parses and formats calendar dates without accepting impossible days', () => {
  assert.equal(parsePlaceDate('21.11.2026'), '2026-11-21');
  assert.equal(formatPlaceDate('2026-11-21'), '21.11.2026');
  assert.equal(parsePlaceDate('31.02.2026'), null);
  assert.equal(isValidPlaceDate('2024-02-29'), true);
  assert.equal(isValidPlaceDate('2025-02-29'), false);
  assert.equal(formatPlaceDate('2025-02-29'), '');
  assert.equal(parsePlaceDate(''), null);
});
