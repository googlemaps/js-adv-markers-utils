// title: specifying and updating position
import {Marker} from '@ubilabs/google-maps-marker';

export default (map: google.maps.Map) => {
  const m1 = new Marker({map});

  // at any point in time we can change the position
  m1.position = {lat: 53.555, lng: 10.001};

  map.setCenter(m1.position);
};
