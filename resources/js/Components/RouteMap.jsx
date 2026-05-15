import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import axios from 'axios';

// Fix icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const storeIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

function FitBounds({ positions }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [50, 50] });
            // Paksa peta untuk menghitung ulang ukuran container agar tidak abu-abu
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        }
    }, [positions, map]);
    return null;
}

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }, [map]);
    return null;
}

export default function RouteMap({ from, to }) {
    const [route, setRoute] = useState([]);
    const [distance, setDistance] = useState(0);

    const isFromValid = from && !isNaN(parseFloat(from[0])) && !isNaN(parseFloat(from[1]));
    const isToValid = to && !isNaN(parseFloat(to[0])) && !isNaN(parseFloat(to[1]));

    useEffect(() => {
        const fetchRoute = async () => {
            if (isFromValid && isToValid) {
                try {
                    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
                    const response = await axios.get(url);
                    if (response.data.routes && response.data.routes[0]) {
                        const coordinates = response.data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                        setRoute(coordinates);
                        setDistance(response.data.routes[0].distance / 1000);
                    }
                } catch (error) {
                    console.error("Error fetching route:", error);
                }
            }
        };
        fetchRoute();
    }, [from, to, isFromValid, isToValid]);

    if (!isFromValid || !isToValid) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl text-red-400">location_off</span>
                <p className="text-sm font-bold">Koordinat tidak valid</p>
                <p className="text-xs">Pastikan lokasi toko dan pembeli sudah ditandai dengan benar.</p>
            </div>
        );
    }

    const center = [parseFloat(from[0]), parseFloat(from[1])];

    return (
        <div className="relative w-full h-full min-h-[400px]">
            <MapContainer 
                center={center} 
                zoom={13} 
                style={{ height: '400px', width: '100%', zIndex: 0 }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />
                <MapResizer />
                
                {from && from[0] && (
                    <Marker position={from} icon={storeIcon}>
                        <Popup>Toko Dollin Donuts</Popup>
                    </Marker>
                )}

                {to && to[0] && (
                    <Marker position={to}>
                        <Popup>Lokasi Pengantaran</Popup>
                    </Marker>
                )}

                {route.length > 0 && (
                    <>
                        <Polyline positions={route} color="#EA580C" weight={5} opacity={0.7} />
                        <FitBounds positions={[from, to, ...route]} />
                    </>
                )}
            </MapContainer>
            
            {distance > 0 && (
                <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-primary/20 animate-in fade-in slide-in-from-top-2 duration-500">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">Estimasi Jarak</p>
                    <p className="text-xl font-black text-primary leading-none">{distance.toFixed(1)} KM</p>
                </div>
            )}
        </div>
    );
}
