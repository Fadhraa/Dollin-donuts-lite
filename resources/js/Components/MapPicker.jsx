import { MapContainer, TileLayer, Marker, useMapEvents, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix icon issue in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Komponen untuk memindahkan fokus peta saat koordinat berubah di input manual
function ChangeView({ center }) {
    const map = useMap();
    if (center[0] && center[1]) {
        map.setView(center, map.getZoom());
    }
    return null;
}

function LocationMarker({ position, setPosition }) {
    useMapEvents({
        click(e) {
            setPosition(e.latlng.lat, e.latlng.lng);
        },
    });

    const lat = parseFloat(position[0]);
    const lng = parseFloat(position[1]);

    return !isNaN(lat) && !isNaN(lng) ? (
        <Marker position={[lat, lng]}></Marker>
    ) : null;
}

export default function MapPicker({ latitude, longitude, onChange, mapKey, branchPosition }) {
    const lat = parseFloat(latitude) || -6.2088;
    const lng = parseFloat(longitude) || 106.8456;

    // Icon khusus untuk Toko (Warna Merah)
    const storeIcon = new L.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    return (
        <MapContainer 
            key={mapKey}
            center={[lat, lng]} 
            zoom={13} 
            style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
            />
            <ChangeView center={[lat, lng]} />
            
            {/* Marker Lokasi Toko/Cabang (Jika ada) */}
            {branchPosition && branchPosition[0] && branchPosition[1] && (
                <Marker position={[parseFloat(branchPosition[0]), parseFloat(branchPosition[1])]} icon={storeIcon}>
                    <Popup>
                        <b>Lokasi Dollin Donuts</b><br />
                        Pesananmu dikirim dari sini.
                    </Popup>
                </Marker>
            )}

            <LocationMarker 
                position={[latitude, longitude]} 
                setPosition={onChange} 
            />
        </MapContainer>
    );
}
