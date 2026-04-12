export type AlertLevel = 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | 'AMBER';

export interface ZonePrediction {
  zone_id: string;
  zone_name: string;
  flood_probability: number;
  lead_time_hours: number;
}

export interface InfrastructureNode {
  id: string;
  name?: string;
  type: string;
  lat: number;
  lon: number;
}

export interface InfrastructureEdge {
  source: string;
  target: string;
  weight?: number;
}

export interface StakeholderAction {
  department: string;
  action: string;
  alert_level: AlertLevel;
  priority: string;
  source: string;
  time_window_hours?: number;
  is_distress?: boolean;
  alert_id?: string;
  status?: string;
  timestamp?: string;
}

export interface VulnerabilityAnalysis {
  ranked_zones?: Array<{ zone_id: string; score: number }>;
  permanently_undrained_wards?: string[];
}

export interface ROIAnalysis {
  zone_id: string;
  roi_score: number;
  recommendation: string;
}

export interface GraphResponse {
  nodes: InfrastructureNode[];
  edges: InfrastructureEdge[];
}

export interface PredictionResponse {
  predictions: ZonePrediction[];
}

export interface AlertsResponse {
  action_plan: {
    action_plans: StakeholderAction[];
  };
}

export interface LeadTimeTicker {
  zone_id: string;
  hours_until_peak: number;
  severity?: string;
}

export interface SensorReading {
  zone_id: string;
  reservoir_pct: number;
  flow_rate: number;
  rainfall_mm?: number;
  timestamp?: string;
}
