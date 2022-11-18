// title: create marker and add it to the map
import {Marker} from './lib/marker';

export default (map: google.maps.Map) => {
  const m1 = new Marker();
  m1.position = {lat: 53.555, lng: 10.001};
  m1.map = map;

  const m2 = new Marker({
    map,
    position: {lat: 53.55, lng: 10}
  });
};
