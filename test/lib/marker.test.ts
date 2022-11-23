import 'mocha';
import {expect} from 'chai';
import {Marker} from '../../src/lib/marker';

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
  });
});

/* eslint
     @typescript-eslint/no-explicit-any: "off",
     @typescript-eslint/no-unsafe-member-access: "off"
   ----
   disabled to make writing tests simpler.
*/
