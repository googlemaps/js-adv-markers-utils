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

// title: basic marker collection

import {CollisionBehavior, Marker, MarkerCollection} from '@googlemaps/adv-markers-utils';
import {MaterialIcons} from '@googlemaps/adv-markers-utils/icons';

type MyData = {
  id: number;
  position: google.maps.LatLngLiteral;
  category: string;
};

const categories = ['a', 'b', 'c'];
const categoryIcons: {[c: string]: string} = {
  a: 'restaurant',
  b: 'nightlife',
  c: 'person'
};

export default async (map: google.maps.Map) => {
  Marker.registerIconProvider(MaterialIcons());

  const data = await loadData();
  const markers = new MarkerCollection(data, {
    position: ({data}) => data?.position,
    scale: 1.4,
    color: ({marker}) => (marker.hovered ? '#ffcc22' : '#dd9222'),
    icon: ({data}) => data && categoryIcons[data.category],
    collisionBehavior: CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY
  });

  markers.map = map;
  map.moveCamera({
    center: {lat: 53.55, lng: 10},
    zoom: 11,
    heading: 0,
    tilt: 0
  });
};

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

async function loadData(): Promise<MyData[]> {
  const data = [];
  for (let i = 0; i < 50; i++) {
    const position = {lat: rnd(53.5, 53.6), lng: rnd(9.9, 10.1)};
    const category = categories[Math.floor(Math.random() * 3)];

    data.push({
      id: i,
      position,
      category
    });
  }

  return data;
}
