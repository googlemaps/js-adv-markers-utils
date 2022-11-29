import 'mocha';
import {expect} from 'chai';
import {Marker} from '../../src/lib/marker';
import sinon from 'sinon';

describe('Marker', () => {
  describe('constructor()', () => {
    it('throws when creating marker', () => {
      try {
        new Marker();
        expect.fail('constructor should have thrown an exception');
      } catch (err: any) {
        expect(err.message).equals('Google Maps API not found.');
      }
    });

    it('throws when Google Maps Marker Library is missing', () => {
      try {
        // @ts-ignore
        window.google = global.google = {maps: {}};

        new Marker();
        expect.fail('constructor should have thrown an exception');
      } catch (err: any) {
        expect(err.message).equals('Google Maps Marker Library not found.');
      }
    });
  });

  describe('staticAttributes', () => {});
});

/* eslint
     @typescript-eslint/no-explicit-any: "off",
     @typescript-eslint/no-unsafe-member-access: "off",
     @typescript-eslint/ban-ts-comment: "off",
     @typescript-eslint/no-empty-function: "off"
   ----
   disabled to make writing tests simpler.
*/
