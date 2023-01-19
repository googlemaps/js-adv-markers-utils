// title: specifying and updating position
import {Marker} from '@ubilabs/google-maps-marker';

export default (map: google.maps.Map) => {
  // position can be speecified in a number of different formats:
  const m1 = new Marker({
    position: new google.maps.LatLng(53.555, 10.01),
    map
  });

  // google.maps.LatLngLiteral
  const m2 = new Marker({
    position: {lat: 53.555, lng: 10.0},
    map
  });

  // GeoJSON style [lng, lat] format
  const m3 = new Marker({
    position: [10.02, 53.555],
    map
  });

  // the position can be accessed and changed anytime, even to a different format
  setTimeout(() => {
    m1.position = [10.01, 53.5];
  }, 2000);
};
