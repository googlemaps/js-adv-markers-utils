// title: create marker and add it to the map
import {Marker} from '@googlemaps/marker';

export default (map: google.maps.Map) => {
  const m1 = new Marker();
  m1.position = {lat: 53.555, lng: 10.001};
  m1.map = map;

  new Marker({
    map,
    position: {lat: 53.55, lng: 10}
  });
};
