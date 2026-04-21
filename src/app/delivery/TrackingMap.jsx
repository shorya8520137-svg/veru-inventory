"use client";
import { useEffect, useRef } from "react";

export default function TrackingMap({ awb, setAwb, journey }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const safeJourney = Array.isArray(journey)
    ? journey.filter(p =>
        typeof p.lat === "number" &&
        typeof p.lng === "number" &&
        !isNaN(p.lat) &&
        !isNaN(p.lng)
      )
    : [];

  const center = safeJourney.length > 0
    ? [safeJourney[safeJourney.length - 1].lat, safeJourney[safeJourney.length - 1].lng]
    : [20.5937, 78.9629];

  useEffect(() => {
    if (!mapRef.current) return;
    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Dynamically import leaflet to avoid SSR issues
    import("leaflet").then(L => {
      import("leaflet/dist/leaflet.css");

      // Fix default icon
      delete L.default.Icon.Default.prototype._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.default.map(mapRef.current, {
        center,
        zoom: 5,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = map;

      // Dark tile layer
      L.default.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        { attribution: "© OpenStreetMap © CARTO" }
      ).addTo(map);

      // Draw polyline
      if (safeJourney.length >= 2) {
        const path = safeJourney.map(p => [p.lat, p.lng]);
        L.default.polyline(path, { color: "#60A5FA", weight: 2, dashArray: "6 4" }).addTo(map);
      }

      // Add markers
      safeJourney.forEach(point => {
        L.default.marker([point.lat, point.lng])
          .addTo(map)
          .bindPopup(`<strong>${point.status}</strong><br/>${point.location}<br/>${new Date(point.scan_time).toLocaleString()}`);
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Search bar */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', gap: 8,
      }}>
        <input
          type="text"
          placeholder="Search AWB / Shipment ID"
          value={awb}
          onChange={e => setAwb(e.target.value)}
          style={{
            padding: '8px 16px', borderRadius: 20, border: '1.5px solid #BFDBFE',
            fontSize: 13, fontWeight: 500, outline: 'none', width: 240,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)', background: '#fff',
          }}
        />
      </div>
      <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: 18 }} />
    </div>
  );
}
