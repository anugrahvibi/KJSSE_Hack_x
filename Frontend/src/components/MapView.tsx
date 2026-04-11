import React, { useEffect, useRef } from 'react';
import type { InfrastructureNode, ZonePrediction } from '@schema';
import { getPredictionAlertLevel, getAlertColor } from '../utils/schemaHelpers';
import { ProgressBar } from './common/ProgressBar';
import 'leaflet/dist/leaflet.css'; // Add missing CSS

// ─── Zone IDs exactly match ZONE_FLOOD_THRESHOLDS in lstm_predictor.py ────────
const ZONE_COORDS: Record<string, [number, number]> = {
  "H-East": [19.0478, 72.8465],
  "G-South": [19.0178, 72.8300],
  "E": [18.9691, 72.8368],
  "F-North": [19.0264, 72.8553],
  "L": [19.0724, 72.8872],
};

function getZoneCoords(zoneId: string): [number, number] | null {
  return ZONE_COORDS[zoneId] ?? null;
}

interface MapViewProps {
  zonesGeoJson?: any | null;
  infrastructureNodes: InfrastructureNode[];
  predictions: ZonePrediction[];
  onZoneClick: (zoneId: string) => void;
  selectedZoneId?: string | null;
  variant?: 'tactical' | 'emergency' | 'railway' | 'hydro' | 'audit';
}

export function MapView({ infrastructureNodes, predictions, onZoneClick, selectedZoneId, variant = 'tactical' }: MapViewProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const circleLayersRef = useRef<any[]>([]);
  const nodeLayersRef = useRef<any[]>([]);
  const LRef = useRef<any>(null);
  const invalidateTimersRef = useRef<number[]>([]);

  const applyTileLayer = (map: any, L: any) => {
    if (!map || !L) return;

    map.eachLayer((layer: any) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    const tileConfigs = {
      tactical: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      emergency: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      // Keep railway on a reliable public source; old provider is intermittently unavailable.
      railway: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      hydro: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png',
      audit: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    } as const;

    const url = tileConfigs[variant] || tileConfigs.tactical;
    const baseLayer = L.tileLayer(url, {
      attribution: '© CartoDB / OSM',
      maxZoom: 19,
    });

    // Fallback for provider outages so maps never render blank.
    baseLayer.once('tileerror', () => {
      if (url !== tileConfigs.tactical) {
        L.tileLayer(tileConfigs.tactical, {
          attribution: '© CartoDB / OSM',
          maxZoom: 19,
        }).addTo(map);
      }
    });

    baseLayer.addTo(map);
  };

  const queueMapInvalidate = () => {
    const map = mapRef.current;
    if (!map) return;

    // Clear pending retries so we only keep the latest request cycle.
    invalidateTimersRef.current.forEach((id) => window.clearTimeout(id));
    invalidateTimersRef.current = [];

    [0, 80, 180, 360].forEach((delay) => {
      const id = window.setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.invalidateSize({ pan: false, animate: false });
        }
      }, delay);
      invalidateTimersRef.current.push(id);
    });
  };

  useEffect(() => {
    let frame = 0;

    const invalidateMapSize = () => {
      const map = mapRef.current;
      if (!map) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        queueMapInvalidate();
      });
    };

    const observer = new ResizeObserver(() => invalidateMapSize());
    if (containerRef.current) {
      observer.observe(containerRef.current);
      if (containerRef.current.parentElement) {
        observer.observe(containerRef.current.parentElement);
      }
    }

    window.addEventListener('resize', invalidateMapSize);
    window.addEventListener('orientationchange', invalidateMapSize);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', invalidateMapSize);
      window.removeEventListener('orientationchange', invalidateMapSize);
      invalidateTimersRef.current.forEach((id) => window.clearTimeout(id));
      invalidateTimersRef.current = [];
    };
  }, []);

  // ── Init map once ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      LRef.current = L;

      // Fix Leaflet's default icon paths broken by bundlers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Guard against React Strict Mode double-invoking effects
      if ((containerRef.current as any)._leaflet_id) return;
      const map = L.map(containerRef.current!, {
        center: [19.0760, 72.8777],
        zoom: 12,
        zoomControl: true,
      });
      mapRef.current = map;
      applyTileLayer(map, L);

      map.whenReady(() => {
        queueMapInvalidate();
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    queueMapInvalidate();
  }, [predictions.length, infrastructureNodes.length, selectedZoneId, variant]);

  // ── Update Tile Layer when variant changes ──────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L) return;
    applyTileLayer(map, L);
  }, [variant]);

  // ── Re-draw zone circles when predictions update ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !predictions || predictions.length === 0) return;
    if (variant === 'railway') {
      circleLayersRef.current.forEach(c => {
        try { c.remove(); } catch (e) { }
      });
      circleLayersRef.current = [];
      return;
    }

    // Clear old circles safely
    circleLayersRef.current.forEach(c => {
      try { c.remove(); } catch (e) { }
    });
    circleLayersRef.current = [];

    const variantStyles: Record<string, { weight: number, dashArray?: string, opacity: number }> = {
      tactical: { weight: 2, opacity: 0.9 },
      emergency: { weight: 4, dashArray: '5, 10', opacity: 1 },
      audit: { weight: 1, opacity: 0.5 },
      hydro: { weight: 2, opacity: 0.8 },
      railway: { weight: 3, dashArray: '10, 5', opacity: 0.9 }
    };

    const vStyle = variantStyles[variant] || variantStyles.tactical;

    predictions.forEach((p) => {
      if (!p || !p.zone_id) return;
      const coords = getZoneCoords(p.zone_id);
      if (!coords) return;
      const level = getPredictionAlertLevel(p);
      const color = (variant === 'audit' && level === 'GREEN') ? '#cbd5e1' : getAlertColor(level);
      const pct = Math.round((p.flood_probability ?? 0) * 100);
      const isSelected = p.zone_id === selectedZoneId;
      const name = (p as any).zone_name || p.zone_id.replace('ZONE_', '').replace(/_/g, ' ');

      try {
        const circle = L.circle(coords, {
          radius: 1400,
          color,
          fillColor: color,
          fillOpacity: level === 'RED' ? 0.40 : (level === 'ORANGE' ? 0.32 : (level === 'YELLOW' ? 0.24 : 0.12)),
          weight: isSelected ? 5 : vStyle.weight,
          dashArray: vStyle.dashArray,
          opacity: vStyle.opacity,
        }).addTo(map);

        // Permanent, high-fidelity card for non-GREEN zones
        if (level !== 'GREEN') {
          circle.bindTooltip(
            `<div class="map-tooltip-card">
              <div class="tooltip-header">
                <div class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full animate-pulse" style="background: ${color}"></div>
                  <span class="tooltip-title">${name}</span>
                </div>
                <span class="tooltip-badge" style="background:${color}15; color:${color}; border: 1px solid ${color}25">${level}</span>
              </div>
              <div class="tooltip-body">
                <div class="tooltip-metric">
                  <span class="metric-value">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline; margin-right:4px; opacity:0.6"><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 17c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 7c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg>${pct}%
                  </span>
                  <span class="metric-label">Risk Index</span>
                </div>
                <div class="tooltip-metric">
                  <span class="metric-value">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display:inline; margin-right:4px; opacity:0.6"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${p.lead_time_hours?.toFixed(1) ?? '?'}h
                  </span>
                  <span class="metric-label">Window</span>
                </div>
              </div>
            </div>`,
            { permanent: true, direction: 'top', className: 'cascade-tooltip', offset: [0, -8] }
          );
        } else {
          circle.bindTooltip(`<span><b>${name}</b> · ${pct}% · <span style="opacity:0.5; font-size:0.5rem; letter-spacing:0.1em">STABLE</span></span>`, { direction: 'top', className: 'cascade-tooltip-simple' });
        }

        circle.on('click', () => onZoneClick(p.zone_id));
        circleLayersRef.current.push(circle);
      } catch (err) {
        console.warn("Map Circle Error:", err);
      }
    });
  }, [predictions, selectedZoneId, variant]);

  // ── Draw infrastructure nodes once they arrive ──────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    const L = LRef.current;
    if (!map || !L || !infrastructureNodes || infrastructureNodes.length === 0) return;
    if (variant === 'railway') {
      nodeLayersRef.current.forEach(m => {
        try { m.remove(); } catch (e) { }
      });
      nodeLayersRef.current = [];
      return;
    }

    // Clear old node markers safely
    nodeLayersRef.current.forEach(m => {
      try { m.remove(); } catch (e) { }
    });
    nodeLayersRef.current = [];


    const cfg: Record<string, { color: string; label: string }> = {
      substation: { color: '#ef4444', label: 'PWR' },
      water_pump: { color: '#3b82f6', label: 'H2O' },
      hospital: { color: '#10b981', label: 'MED' },
      road: { color: '#f59e0b', label: 'WAY' },
      comm_tower: { color: '#8b5cf6', label: 'SIG' },
    };

    const getFilteredNodes = () => {
       if (variant === 'hydro') return infrastructureNodes.filter(n => n.type === 'water_pump');
       if (variant === 'emergency') return infrastructureNodes.filter(n => n.type === 'hospital' || n.type === 'comm_tower');
       return infrastructureNodes;
    };

    getFilteredNodes().forEach((node) => {
      if (!node.lat || !node.lon) return;
      const c = cfg[node.type] ?? { color: '#64748b', label: 'LOC' };
      const icon = L.divIcon({
        html: `<div style="
          width:24px;height:24px;border-radius:8px;
          background:${c.color}20; border:1.5px solid ${c.color}80;
          backdrop-filter:blur(var(--glass-blur));
          display:flex;align-items:center;justify-content:center;
          font-size:7px; font-weight:900; color:${c.color};
          box-shadow:0 4px 12px ${c.color}15;
          cursor:pointer; transform:rotate(45deg);">
            <div style="transform:rotate(-45deg)">${c.label}</div>
          </div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      const marker = L.marker([node.lat, node.lon], { icon }).addTo(map);
      const threshold = (node as InfrastructureNode & { flood_threshold?: number }).flood_threshold;
      const thresholdLabel = typeof threshold === 'number' ? `${threshold}m` : 'N/A';
      marker.bindTooltip(
        `<b>${node.name}</b><br/>${node.type.replace(/_/g, ' ')}<br/>Threshold: ${thresholdLabel}`,
        { direction: 'top' }
      );
      nodeLayersRef.current.push(marker);
    });
  }, [infrastructureNodes, variant]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Risk Legend */}
      {variant !== 'railway' && (
      <div className="glass-card" style={{
        position: 'absolute', bottom: 20, right: 20, zIndex: 1000,
        borderRadius: 20, padding: '12px 16px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
      }}>
        <div style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#334155', marginBottom: 10, opacity: 1 }}>
          Risk Matrix
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {([['#ef4444', 'CRITICAL'], ['#f97316', 'SEVERE'], ['#f59e0b', 'ELEVATED'], ['#10b981', 'STABLE']] as const).map(([color, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 10px ${color}40` }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#020617', letterSpacing: '0.05em' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Geospatial Intelligence Card */}
      {variant !== 'railway' && (
      <div className="glass-card shadow-2xl overflow-visible border-white/60" style={{
        position: 'absolute', top: 20, left: 60, zIndex: 1000,
        borderRadius: 24, padding: '16px',
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(32px)',
        width: 220
      }}>
        <div className="glass-blur-fix" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600">
             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
          </div>
          <div>
            <div className="text-[12px] font-black text-gray-950 uppercase leading-none mb-0.5">Geospatial Intelligence</div>
            <div className="text-[9px] font-bold text-blue-600/60 uppercase tracking-tighter">Riva Engine v1.0</div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-gray-500 uppercase">Projection Mode</span>
            <span className="text-gray-950 uppercase">Satellite Flood Map</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-gray-500 uppercase">Analysis Target</span>
            <span className="text-gray-950 uppercase">Mumbai Sector</span>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold">
            <span className="text-gray-500 uppercase">Temporal Sync</span>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-emerald-600">LIVE RELAY</span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-black/5">
             <div className="text-[9px] font-black text-gray-400 uppercase mb-2">Model Confidence Stream</div>
             <ProgressBar
               value={94}
               className="h-1"
               trackClassName="bg-gray-100"
               fillClassName="bg-blue-600"
               animated
             />
          </div>
        </div>
      </div>
      )}

      {/* Loading overlay while predictions not yet arrived */}
      {variant !== 'railway' && predictions.length === 0 && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center bg-transparent pointer-events-none">
          <div className="flex items-center justify-center glass-card px-8 py-5 rounded-2xl shrink-0">
            <span className="text-[13px] font-black text-blue-600 uppercase whitespace-nowrap animate-pulse">
              Synchronizing AI Data...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
