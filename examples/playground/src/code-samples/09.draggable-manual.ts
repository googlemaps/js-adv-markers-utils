// title: draggable markers / update position after drag
import {Marker} from '@ubilabs/google-maps-marker';
import {MaterialIcons} from '@ubilabs/google-maps-marker/icons';

export default (map: google.maps.Map) => {
  Marker.registerIconProvider(MaterialIcons());

  const m1 = new Marker();
  m1.position = {lat: 53.555, lng: 10.001};
  m1.map = map;

  m1.draggable = true;
  m1.addListener('dragend', ev => {
    console.log('dragend', ev.latLng?.toJSON());
    m1.position = ev.latLng?.toJSON();
  });
};
