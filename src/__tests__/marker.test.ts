/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {CollisionBehavior, Marker} from '../marker';
import type {Attributes, StaticAttributes} from '../marker-attributes';

import '@googlemaps/jest-mocks';
import {
  AdvancedMarkerView,
  initialize,
  mockInstances,
  PinView
} from './lib/mocks';

/* eslint-disable
    @typescript-eslint/ban-ts-comment,
    @typescript-eslint/no-non-null-assertion
*/

describe('initialization', () => {
  test('throws when maps api is missing', () => {
    const logSpy = jest
      .spyOn(global.console, 'error')
      .mockImplementation(() => {});

    expect(() => new Marker()).toThrow();
    expect(logSpy).toHaveBeenCalled();
    expect(logSpy.mock.lastCall).toMatchSnapshot();

    logSpy.mockRestore();
  });

  test('throws when markers library is missing', () => {
    initialize();

    // @ts-ignore
    delete google.maps.marker;

    const logSpy = jest
      .spyOn(global.console, 'error')
      .mockImplementation(() => {});

    expect(() => new Marker()).toThrow();
    expect(logSpy).toHaveBeenCalled();
    expect(logSpy.mock.lastCall).toMatchSnapshot();

    logSpy.mockRestore();
  });

  test("doesn't throw when maps and marker libraries are loaded", () => {
    initialize();
    const logSpy = jest
      .spyOn(global.console, 'error')
      .mockImplementation(() => {});

    expect(() => new Marker()).not.toThrow();
    expect(logSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });
});

describe('basic functionality', () => {
  beforeEach(() => {
    initialize();
  });

  test('not added tp map without position', async () => {
    const map = new google.maps.Map(document.createElement('div'));
    const m = new Marker({map});

    await Promise.resolve();

    expect(m.map).toBe(map);

    const [amv] = mockInstances.get(AdvancedMarkerView);
    expect(amv).toBeDefined();
    expect(amv.map).toEqual(null);
  });

  test('added to map when position is set', async () => {
    const position = [10, 53] as [number, number];
    const map = new google.maps.Map(document.createElement('div'));
    const m = new Marker({map, position});

    await Promise.resolve();

    expect(m.map).toBe(map);
    expect(m.position).toBe(position);

    // marker creates backing marker-view and pin-view instances
    const [amv] = mockInstances.get(AdvancedMarkerView);
    const [pv] = mockInstances.get(PinView);

    expect(pv).toBeDefined();
    expect(amv).toBeDefined();

    // amv is added to the map
    expect(amv.position).toBeInstanceOf(google.maps.LatLng);
    expect((amv.position as google.maps.LatLng).toJSON()).toEqual({
      lat: 53,
      lng: 10
    });

    expect(amv.map).toEqual(map);
  });
});

describe('attributes', () => {
  const position = [10, 53] as [number, number];

  let map: google.maps.Map;
  let marker: Marker;
  let pinView: google.maps.marker.PinView;

  beforeEach(async () => {
    initialize();

    map = new google.maps.Map(document.createElement('div'));
    marker = new Marker({position, map});

    const [pv] = mockInstances.get(PinView);

    pinView = pv;
  });

  test('basic attributes / constructor', async () => {
    const attributes: Partial<StaticAttributes> = {
      collisionBehavior: CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY,
      draggable: true,
      glyph: document.createElement('i'),
      scale: 1.2,
      title: 'the title',
      zIndex: 23
    };

    const m = new Marker({map, position, ...attributes});

    await Promise.resolve();

    // check that attributes are accessible as properties unmodified
    for (const [name, value] of Object.entries(attributes)) {
      expect(m[name as keyof Attributes]).toBe(value);
    }

    // check that attributes are properly forwarded to implementation
    const pv = mockInstances.get(PinView).at(-1)!;
    expect(pv.scale).toEqual(attributes.scale);
    expect(pv.glyph).toBe(attributes.glyph);

    const amv = mockInstances.get(AdvancedMarkerView).at(-1)!;
    expect(amv.zIndex).toEqual(attributes.zIndex);
    expect(amv.title).toEqual(attributes.title);
    expect(amv.draggable).toEqual(attributes.draggable);
    expect(amv.collisionBehavior).toEqual(attributes.collisionBehavior);
  });

  test('basic attributes / setAttributes', async () => {
    const attributes: Partial<StaticAttributes> = {
      collisionBehavior: CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY,
      draggable: true,
      glyph: document.createElement('i'),
      scale: 1.2,
      title: 'the title',
      zIndex: 23
    };

    marker.setAttributes(attributes);

    await Promise.resolve();

    // check that attributes are accessible as properties unmodified
    for (const [name, value] of Object.entries(attributes)) {
      expect(marker[name as keyof Attributes]).toBe(value);
    }

    // check that attributes are properly forwarded to implementation
    const [pv] = mockInstances.get(PinView);
    expect(pv.scale).toEqual(attributes.scale);
    expect(pv.glyph).toBe(attributes.glyph);

    const [amv] = mockInstances.get(AdvancedMarkerView);
    expect(amv.zIndex).toEqual(attributes.zIndex);
    expect(amv.title).toEqual(attributes.title);
    expect(amv.draggable).toEqual(attributes.draggable);
    expect(amv.collisionBehavior).toEqual(attributes.collisionBehavior);
  });

  test('dynamic attribute callbacks', async () => {
    const scaleCallback = () => 1.2;
    marker.scale = scaleCallback;
    marker.backgroundColor = () => 'red';

    await Promise.resolve();

    // check that attributes are accessible as properties unmodified
    expect(marker.scale).toBe(scaleCallback);

    // check that attributes are properly forwarded to implementation
    expect(pinView.scale).toEqual(1.2);
    expect(pinView.background).toEqual('red');
  });

  test('color attributes / simple colors', async () => {
    const attributes: Partial<Attributes> = {
      backgroundColor: '#ff0000',
      borderColor: 'rgb(0, 255, 0)',
      glyphColor: 'rgba(0, 0, 255, 0.5)'
    };

    marker.setAttributes(attributes);

    await Promise.resolve();

    expect(pinView.background).toEqual('#ff0000');
    expect(pinView.borderColor).toEqual('rgb(0, 255, 0)');
    expect(pinView.glyphColor).toEqual('rgba(0, 0, 255, 0.5)');
  });

  test('color attributes / advanced colors', async () => {
    const colors = ['#ffcc22', '#112288'];

    for (const color of colors) {
      marker.color = color;

      await Promise.resolve();

      expect([
        pinView.background,
        pinView.borderColor,
        pinView.glyphColor
      ]).toMatchSnapshot();
    }
  });
});

describe('html attributes', () => {
  const position = [10, 53] as [number, number];

  let map: google.maps.Map;
  let marker: Marker;
  let markerView: google.maps.marker.AdvancedMarkerView;
  let contentEl: HTMLElement;

  beforeEach(async () => {
    initialize();

    contentEl = document.createElement('span');
    map = new google.maps.Map(document.createElement('div'));
    marker = new Marker({position, map, content: contentEl});

    const [amv] = mockInstances.get(AdvancedMarkerView);
    markerView = amv;
  });

  test('AdvancedMarkerView.content is set', async () => {
    expect(markerView.content).toBe(contentEl);
  });

  test('css classes are set on the content-element', async () => {
    const classListTests = [
      ['one two', 'one two'],
      [['one', 'two', 'three'], 'one two three']
    ];

    for (const [value, result] of classListTests) {
      marker.classList = value;

      await Promise.resolve();

      expect(markerView.content?.className).toBe(result);
    }
  });

  test('css custom properties are available for the content-element', async () => {
    const testCases = [
      ['backgroundColor', '--marker-background-color', '#ff0000'],
      ['borderColor', '--marker-border-color', '#00ff00'],
      ['glyphColor', '--marker-glyph-color', '#0000ff'],
      ['color', '--marker-color', '#ffff00'],
      ['scale', '--marker-scale', 2.3, '2.3']
    ] as const;

    for (const [
      attrName,
      propName,
      testValue,
      expectedValue = testValue
    ] of testCases) {
      marker[attrName as keyof Attributes] = testValue as never;

      await Promise.resolve();

      const style = (markerView.element as HTMLElement).style;
      expect(style.getPropertyValue(propName)).toEqual(expectedValue);
    }
  });
});

describe('dynamic attributes', () => {
  test.todo('dynamic attribute parameters');
  test.todo('marker state');
  test.todo('map state observer');
});

describe('icons and icon providers', () => {
  test.todo('icon provider');
  test.todo('multiple icon providers');
});
