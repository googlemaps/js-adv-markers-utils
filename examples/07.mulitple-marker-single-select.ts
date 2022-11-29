// title: multiple markers / single selection
import {Marker} from './lib/marker';

function rnd(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export default (map: google.maps.Map) => {
  const markers: Marker[] = [];
  const bounds = new google.maps.LatLngBounds();

  let selectedMarker: Marker | null = null;
  const setSelected = (index: number) => {
    if (selectedMarker !== null) {
      selectedMarker.setData({selected: false});
    }

    const marker = markers[index];
    marker.setData({selected: true});
    selectedMarker = marker;
  };

  // create a couple of random markers
  for (let i = 0; i < 10; i++) {
    const position = {lat: rnd(53.5, 53.6), lng: rnd(9.9, 10.1)};
    bounds.extend(position);

    const marker = new Marker(
      {
        map,
        position,
        color: ({data}) => (data.selected ? '#DB4437' : '#4285F4')
      },
      // initial user-data
      {selected: false}
    );

    marker.addListener('click', () => {
      console.log('marker clicked:', marker);
      setSelected(i);
    });

    markers.push(marker as Marker);
  }

  map.fitBounds(bounds);
};
