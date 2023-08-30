// Copyright 2023 Google LLC.
// SPDX-License-Identifier: Apache-2.0

// title: simple marker customizations: icons
import {Marker} from '@googlemaps/adv-markers-utils';
import {MaterialIcons, MaterialIconsStyle} from '@googlemaps/adv-markers-utils/icons';

export default (map: google.maps.Map) => {
  // first we need to register the icon-provider, which is a function that knows how to create the kind of dom-element needed for an icon-set
  Marker.registerIconProvider(
    MaterialIcons({style: MaterialIconsStyle.FILLED})
  );

  const m1 = new Marker({
    map,
    position: {lat: 50, lng: 10},
    scale: 1.5,
    color: '#4285F4'
  });
  const m2 = new Marker({
    map,
    position: {lat: 50, lng: 11},
    scale: 1.5,
    color: '#DB4437'
  });
  const m3 = new Marker({
    map,
    position: {lat: 51, lng: 10},
    scale: 1.5,
    color: '#F4B400'
  });
  const m4 = new Marker({
    map,
    position: {lat: 51, lng: 11},
    scale: 1.5,
    color: '#0F9D58'
  });

  m1.icon = 'restaurant';
  m2.icon = 'nightlife';
  m3.icon = 'church';
  m4.icon = 'home';

  map.fitBounds(
    new google.maps.LatLngBounds({lat: 49.5, lng: 9.5}, {lat: 51.5, lng: 11.5})
  );
};
