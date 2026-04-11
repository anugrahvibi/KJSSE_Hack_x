import React, { useEffect, useRef } from 'react';
import * as L from 'leaflet';

interface CascadeStep {
  step: number;
  node_id: string;
  node_label: string;
  lat: number;
  lng: number;
  t_plus_minutes: number;
  population_affected: number;
  failure_condition: string;
  cascade_weight: number;
}

interface CascadeOverlayProps {
  map: L.Map | null;
  isActive: boolean;
}

export const CascadeOverlay: React.FC<CascadeOverlayProps> = ({ map, isActive }) => {
  const wsRef = useRef<WebSocket | null>(null);
  const layerGroupRef = useRef<L.LayerGroup>(() => L.layerGroup());

  useEffect(() => {
    if (!map) return;
    
    if (isActive) {
      if (!layerGroupRef.current) layerGroupRef.current = L.layerGroup();
      layerGroupRef.current.addTo(map);
      
      const wsUrl = `ws://${window.location.hostname}:8000/ws/cascade`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        socket.send(JSON.stringify({ trigger: "WARD_H_EAST" }));
      };

      let prevStep: CascadeStep | null = null;

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "cascade_step") {
          const step: CascadeStep = data.payload;

          const radius = Math.sqrt(step.population_affected) * 2;
          let color = "#eab308";
          if (step.t_plus_minutes < 60) color = "#ef4444";
          else if (step.t_plus_minutes < 120) color = "#f97316";

          const circle = L.circle([step.lat, step.lng], {
            radius,
            color,
            fillColor: color,
            fillOpacity: 0.45,
            weight: 2
          });

          circle.bindPopup(`<b>${step.node_label}</b> — fails at T+${step.t_plus_minutes} min<br/>(${step.population_affected.toLocaleString()} affected)`);
          circle.addTo(layerGroupRef.current);

          if (prevStep) {
            const polyline = L.polyline(
              [[prevStep.lat, prevStep.lng], [step.lat, step.lng]], 
              { color: '#ef4444', dashArray: '5, 10', weight: 2, className: 'animated-dash' }
            );
            polyline.addTo(layerGroupRef.current);
          }
          prevStep = step;
        }
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
        if (layerGroupRef.current) {
            layerGroupRef.current.clearLayers();
            layerGroupRef.current.remove();
        }
      };
    } else {
      if (layerGroupRef.current) {
          layerGroupRef.current.clearLayers();
          layerGroupRef.current.remove();
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
  }, [map, isActive]);

  return null;
};
