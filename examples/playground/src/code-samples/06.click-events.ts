// title: marker interactivity: click events
import {Marker} from './lib/marker';

export default (map: google.maps.Map) => {
  const marker = new Marker({
    map,
    position: {lat: 53.5, lng: 10}
  });

  marker.addListener('click', () => {
    alert('yep, that marker was clicked');
  });
};
