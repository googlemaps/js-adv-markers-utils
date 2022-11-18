import {loadMapsApi} from './load-maps-api';
import {Marker} from './lib/marker';

import {runPlaygroundJs} from './editor/run-playground-js';

async function main() {
  const map = await initMap();

  import('./editor/init-editor').then(({initEditor}) =>
    initEditor(jsCode => runPlaygroundJs(jsCode, map))
  );

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
