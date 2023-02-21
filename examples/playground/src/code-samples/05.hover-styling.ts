// title: marker interactivity: hover
import {Marker} from '@googlemaps/marker';

export default (map: google.maps.Map) => {
  const position = {lat: 53.5, lng: 10};
  const marker = new Marker({map, position});

  marker.scale = ({marker}) => (marker.hovered ? 1.8 : 1.5);
  marker.color = ({marker}) => (marker.hovered ? '#4285F4' : '#F4B400');

  map.setCenter(position);
};
