import {loadMapsApi} from './load-maps-api';
import {Marker} from './lib/marker';

import {runPlaygroundJs} from './editor/run-playground-js';

/* eslint "@typescript-eslint/ban-ts-comment": "off"
   ----
   diabling this since in this file we're setting some global variables
   for debugging purposes.
*/
async function main() {
  const map = await initMap();

  import('./editor/init-editor')
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
