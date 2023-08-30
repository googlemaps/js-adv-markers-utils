// Copyright 2023 Google LLC.
// SPDX-License-Identifier: Apache-2.0

// title: simple marker customizations: Google Maps Places API icons

import {Marker} from '@googlemaps/adv-markers-utils';
import {PlaceIcons} from '@googlemaps/adv-markers-utils/icons';

export default (map: google.maps.Map) => {
  Marker.registerIconProvider(PlaceIcons());

  const m1 = new Marker();
  m1.position = {lat: 53.555, lng: 10.001};
  m1.scale = ({map}) => Math.max(1, Math.pow(1.45, map.zoom) / 64);
  m1.map = map;
  m1.icon = 'theater';
  m1.color = 'white';
  m1.borderColor = 'grey';
};
