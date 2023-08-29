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

//
// Marker-API Example Playground
// Edit the code and hit <CMD> + <Return> to execute it.
//

import {Marker} from '@googlemaps/adv-markers-utils';
import {MaterialIcons} from '@googlemaps/adv-markers-utils/icons';

export default (map: google.maps.Map) => {
  Marker.registerIconProvider(MaterialIcons());

  const m1 = new Marker();
  m1.position = {lat: 53.555, lng: 10.001};

  // dynamically scale the marker so it gets bigger and smaller with increasing/decreasing zoom
  m1.scale = ({map}) => Math.max(1, Math.pow(1.45, map.zoom) / 64);
  m1.icon = 'restaurant';
  m1.color = '#DB4437';
  m1.map = map;

  type M2Data = {color: string};
  const m2 = new Marker<M2Data>({
    map,
    position: {lat: 53.55, lng: 10},
    scale: 2
  });

  m2.color = s => (s.data ? s.data.color : '#0F9D58');

  const colors = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58'];
  let colorIdx = 0;

  const intervalId = setInterval(() => {
    m2.setData({color: colors[colorIdx]});
    colorIdx = (colorIdx + 1) % colors.length;
  }, 1000);

  // the function returned here is a cleanup-function and will be executed before
  // the sample currently running is replaced with a new version or another sample.
  // This gives you an opportunity to clean up everything that has been added
  // (don't worry about removing the markers, they will be automatically removed
  // from the map)
  return () => {
    clearInterval(intervalId);
  };
};
