// title: dynamic html marker

import {Marker} from '@googlemaps/marker';

export default (map: google.maps.Map) => {
  // create a stylesheet to be used by the marker
  const stylesheet = document.createElement('style');
  stylesheet.textContent = `
    .test-marker {
      border: 1px solid orange;
      background: var(--marker-color, 'red');
      border-radius: 4px;
      padding: 8px 12px;
      color: white;
      pointer-events: all;
    }

    .test-marker:hover {
      background: blue;
    }
  `;
  document.head.appendChild(stylesheet);

  const marker = new Marker({
    position: {lat: 53.54, lng: 10.002},
    content: ({map, marker}) => {
      let el = marker.content;

      if (!el) {
        el = document.createElement('div');
      }

      el.textContent = `zoom: ${map.zoom.toFixed(2)}`;

      return el;
    },
    classList: ['test-marker'],
    color: 'rgba(255,0,0,0.6)',
    map
  });

  return () => {
    stylesheet.remove();
  };
};
