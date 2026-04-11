import type { 
  ZonePrediction, 
  StakeholderAction, 
  VulnerabilityAnalysis, 
  ROIAnalysis,
  GraphResponse,
  PredictionResponse,
  AlertsResponse,
  LeadTimeTicker,
  SensorReading
} from '@schema';

// ─── Fetch Robustness ─────────────────────────────────────────────────────────

const IS_DEV = import.meta.env.DEV;
const DEFAULT_TIMEOUT_MS = IS_DEV ? 5000 : 30000;  // Fail fast in dev for snappy UI fallback
const SLOW_TIMEOUT_MS = IS_DEV ? 15000 : 120000;   // Still allow heavier endpoints in production
const DEFAULT_RETRIES = IS_DEV ? 0 : 2;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

// Minimal in-memory cache to prevent duplicate rapid requests
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 30000; // 30s cache

function cacheGet<T>(key: string): T | null {
  const item = cache[key];
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.data;
  }
  return null;
}

function cacheSet(key: string, data: any) {
  cache[key] = { data, timestamp: Date.now() };
}

async function fetchJsonWithRetry<T>(url: string, options: { 
  retries?: number; 
  timeoutMs?: number;
  skipCache?: boolean;
} = {}): Promise<T | null> {
  const { retries = DEFAULT_RETRIES, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetchWithTimeout(url, {}, timeoutMs);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      if (i === retries) {
        return null;
      }
      await wait(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
  return null;
}

// ─── Shared Persistence API ────────────────────────────────────────────────────

export async function fetchZones(): Promise<any[]> {
  const data = await fetchJsonWithRetry<any>('/api/wards/geojson');
  return data || { type: 'FeatureCollection', features: [] };
}

export async function fetchInfrastructure(): Promise<GraphResponse> {
  const cacheKey = 'infrastructure';
  const cached = cacheGet<GraphResponse>(cacheKey);
  if (cached) return cached;

  const data = await fetchJsonWithRetry<GraphResponse>('/api/v1/infrastructure/graph');
  if (data) {
    cacheSet(cacheKey, data);
    return data;
  }

  return { nodes: [], edges: [] };
}


export async function fetchActiveAlerts(role: string, scenario: string = '2024_peak'): Promise<StakeholderAction[]> {
  const cacheKey = `alerts_${role}_${scenario}`;
  const cached = cacheGet<StakeholderAction[]>(cacheKey);
  if (cached) return cached;

  // Use new agent alerts endpoint
  const data = await fetchJsonWithRetry<StakeholderAction[]>('/api/agent/alerts');
  if (data) {
    const filteredActions = data.filter(action => !role || action.department.toLowerCase() === role.toLowerCase());
    cacheSet(cacheKey, filteredActions);
    return filteredActions;
  }
  return [];
}


export async function fetchSensorReadings(zoneId: string): Promise<SensorReading[]> {
  const latestData = await fetchJsonWithRetry<any>(`/api/detection/ward/${zoneId}`, {
    retries: 1,
    timeoutMs: 5000,
  });
  if (latestData) {
    return [{
       zone_id: latestData.ward_id,
       reservoir_pct: 0, // Not in new schema directly
       flow_rate: latestData.rainfall_rate,
       rainfall_mm: latestData.rainfall_rate,
       timestamp: new Date().toISOString()
    }];
  }
  return [];
}

export async function fetchEnvironmentalData(): Promise<any> {
  return await fetchJsonWithRetry<any>('/api/detection/environmental');
}

export async function fetchVulnerabilities(): Promise<VulnerabilityAnalysis | null> {
  const cacheKey = 'vulnerabilities';
  const cached = cacheGet<VulnerabilityAnalysis>(cacheKey);
  if (cached) return cached;

  const data = await fetchJsonWithRetry<VulnerabilityAnalysis>('/api/cascade/audit', { timeoutMs: SLOW_TIMEOUT_MS });
  if (data) {
    cacheSet(cacheKey, data);
    return data;
  }
  return null;
}


export async function fetchLeadTimes(scenario: string = '2024_peak'): Promise<LeadTimeTicker[]> {
  // Map from detection status
  const data = await fetchJsonWithRetry<any[]>('/api/detection/status');
  if (data) {
    return data.map(w => ({
      zone_id: w.ward_id,
      hours_until_peak: w.flood_status === 'CRITICAL' ? 0.5 : 2,
      severity: w.flood_status
    }));
  }
  return [];
}

export async function fetchROIRankings(): Promise<ROIAnalysis[]> {
  return []; // ROI not yet in new backend
}

export async function fetchPredictions(scenario: string = '2024_peak'): Promise<ZonePrediction[]> {
  const data = await fetchJsonWithRetry<any[]>('/api/detection/status');
  if (data) {
    return data.map(w => ({
      zone_id: w.ward_id,
      zone_name: w.ward_name,
      flood_probability: w.flood_status === 'CRITICAL' ? 0.95 : (w.flood_status === 'WARNING' ? 0.75 : 0.2),
      lead_time_hours: w.flood_status === 'CRITICAL' ? 0.5 : 2
    }));
  }
  return [];
}
