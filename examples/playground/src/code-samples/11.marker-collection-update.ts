// title: marker collection: continuous updates

/* eslint-disable @typescript-eslint/no-misused-promises */

import {MarkerCollection} from '@googlemaps/marker';

type MyData = {
  id: number;
  position: google.maps.LatLngLiteral;
  color: string;
};

export default async (map: google.maps.Map) => {
  const data = await loadData();
  const markers = new MarkerCollection<MyData>(data, {
    key: data => data.id.toString(),
    position: ({data}) => data?.position,
    color: ({data}) => data?.color,
    scale: 1.4
  });

  // simulate updating data every 500ms
  const intervalId = setInterval(async () => {
    markers.setData(await loadData());
  }, 1000 / 2);

  markers.map = map;
  map.moveCamera({
    center: {lat: 53.55, lng: 10},
    zoom: 11,
    heading: 0,
    tilt: 0
  });

  return () => {
    clearInterval(intervalId);
  };
};

const rnd = (min: number = 0, max: number = 1) =>
  min + Math.random() * (max - min);

const markers: {
  position: google.maps.LatLngLiteral;
  color: string;
  phase: number;
  amp: number;
  freq: number;
}[] = [];

for (let i = 0; i < 20; i++) {
  markers.push({
    position: {
      lat: rnd(53.5, 53.6),
      lng: rnd(9.9, 10.1)
    },

    color:
      '#' +
      Math.floor(0xffffff * rnd())
        .toString(16)
        .padStart(6, '0'),
    phase: rnd(0, 2 * Math.PI),
    amp: rnd(0.005, 0.01),
    freq: rnd()
  });
}

let t = 0;

async function loadData(): Promise<MyData[]> {
  t++;

  const data = [];
  for (let i = 0; i < 10; i++) {
    const markerIndex = (i + Math.floor(t / 10)) % markers.length;

    const {position, color, amp, phase} = markers[markerIndex];
    const {lat, lng} = position;

    const currPosition = {
      lat: lat + amp * Math.cos((phase + t / 10) / Math.PI),
      lng: lng + amp * Math.sin((phase + t / 10) / Math.PI)
    };

    data.push({
      id: i,
      position: currPosition,
      color
    });
  }

  return data;
}
