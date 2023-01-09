// title: dynamic attributes depending on each other

import {Marker} from './lib/marker';

// dynamic attributes can be written to reliably depend on the current value
// of another attribute, for example to make colors depend on the icon shown
// or make colors depend on each other. Note that this also works when
// depending on other dynamic attributes.
//
// Returning undefined for the borderColor causes the borderColor to be set
// automatically via the color attribute.

export default (map: google.maps.Map) => {
  const marker = new Marker({
    position: {lat: 53.55, lng: 10.05},
    color: ({marker}) => (marker.hovered ? 'red' : 'green'),
    borderColor: ({attr}) => (attr.color === 'red' ? 'black' : undefined),
    map
  });
};
