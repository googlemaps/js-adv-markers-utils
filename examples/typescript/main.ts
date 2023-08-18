/*
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

import {Loader} from '@googlemaps/js-api-loader';
import {Marker} from '@googlemaps/adv-markers-utils';

const mapDiv = document.querySelector('#map') as HTMLElement;

async function main() {
  const apiKey = getApiKey();
  console.log('loading maps API with key: ' + apiKey);

  const loader = new Loader({apiKey});

  const {Map} = await loader.importLibrary('maps');
  await loader.importLibrary('marker');

  const map = new Map(mapDiv, {
    mapId: 'bf51a910020fa25a',
    center: {lat: 53.55, lng: 10.01},
    zoom: 12
  });

  const marker = new Marker();

  marker.position = {lat: 53.55, lng: 10.01};
  marker.map = map;
}

// get Google Maps API Key from url or environment
function getApiKey() {
  const url = new URL(location.href);
  const apiKey =
    url.searchParams.get('apiKey') || import.meta.env.VITE_GOOGLEMAPS_API_KEY;

  if (!apiKey) {
    const key = prompt(
      'Please provide your Google Maps API key in the URL\n' +
        '(using the parameter `?apiKey=YOUR_API_KEY_HERE`) or enter it here:'
    );

    if (key) {
      url.searchParams.set('apiKey', key);
      location.replace(url.toString());
    }
  }

  return apiKey;
}

main().catch(err => console.error(err));
