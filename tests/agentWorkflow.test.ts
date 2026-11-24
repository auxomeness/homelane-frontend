import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveUpdatedListingStatus, validateListingPin, validatePhotoSelection } from '../src/components/agent/libs/listingWorkflow.ts';

test('agent uploads enforce supported image types, per-photo size, and four-photo cap', () => {
  assert.equal(validatePhotoSelection([{ size: 1_200_000, type: 'image/jpeg' }], 3), null);
  assert.match(validatePhotoSelection([{ size: 1, type: 'image/gif' }], 0) ?? '', /JPG, PNG, or WebP/);
  assert.match(validatePhotoSelection([{ size: 1_200_001, type: 'image/png' }], 0) ?? '', /1.2 MB/);
  assert.match(validatePhotoSelection([{ size: 1, type: 'image/png' }, { size: 1, type: 'image/png' }], 3) ?? '', /four photos/);
});

test('an exact pin is required for submission but not for a draft', () => {
  assert.equal(validateListingPin('draft', null), null);
  assert.match(validateListingPin('submit', null) ?? '', /exact property pin/);
  assert.equal(validateListingPin('submit', { latitude: 13.6, longitude: 123.2 }), null);
});

test('editing a live listing keeps it live while submitted drafts go pending', () => {
  assert.equal(resolveUpdatedListingStatus('active', false), 'active');
  assert.equal(resolveUpdatedListingStatus('active', true), 'active');
  assert.equal(resolveUpdatedListingStatus('draft', true), 'pending');
  assert.equal(resolveUpdatedListingStatus(undefined, false), 'draft');
});
