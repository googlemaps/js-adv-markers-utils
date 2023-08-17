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

// title: dynamic html marker

import {Marker} from '@googlemaps/adv-markers-utils';

export default (map: google.maps.Map) => {
  // create a stylesheet to be used by the marker
  const stylesheet = document.createElement('style');
  stylesheet.textContent = `
    .test-marker {
      border: 1px solid orange;
      background: var(--marker-color, 'red');
      border-radius: 4px;
      padding: 8px 12px;
      color: white;
      pointer-events: all;
    }

    .test-marker:hover {
      background: blue;
    }
  `;
  document.head.appendChild(stylesheet);

  const marker = new Marker({
    position: {lat: 53.54, lng: 10.002},
    content: ({map, marker}) => {
      let el = marker.content;

      if (!el) {
        el = document.createElement('div');
      }

      el.textContent = `zoom: ${map.zoom.toFixed(2)}`;

      return el;
    },
    classList: ['test-marker'],
    color: 'rgba(255,0,0,0.6)',
    map
  });

  return () => {
    stylesheet.remove();
  };
};
