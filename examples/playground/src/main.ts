/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import {loadMapsApi} from './load-maps-api';
import {Marker} from '../../../src/marker';

import {runPlaygroundJs} from './run-playground-js';

/* eslint "@typescript-eslint/ban-ts-comment": "off"
   ----
   diabling this since in this file we're setting some global variables
   for debugging purposes.
*/
async function main() {
  const map = await initMap();

  import('./init-editor')
    .then(async ({initEditor}) => {
      const editor = await initEditor(jsCode => runPlaygroundJs(jsCode, map));

      // @ts-ignore
      window.editor = editor;
    })
    .catch(err => console.error('editor init failed', err));

  // @ts-ignore
  window.map = map;

  // @ts-ignore
  window.Marker = Marker;
}

async function initMap() {
  await loadMapsApi({
    key: import.meta.env.GOOGLE_MAPS_API_KEY,
    v: 'beta',
    libraries: 'marker'
  });

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return new google.maps.Map(document.querySelector('#map')!, {
    mapId: 'bf51a910020fa25a',
    center: {lat: 53.55, lng: 10},
    zoom: 14
  });
}

main().catch(err => {
  console.error(err);
});

export {};
