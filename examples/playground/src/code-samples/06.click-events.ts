// Copyright 2023 Google LLC.
// SPDX-License-Identifier: Apache-2.0

// title: marker interactivity: click events
import {Marker} from '@googlemaps/adv-markers-utils';

export default (map: google.maps.Map) => {
  const marker = new Marker({
    map,
    position: {lat: 53.5, lng: 10}
  });

  marker.addListener('click', () => {
    alert('yep, that marker was clicked');
  });
};
