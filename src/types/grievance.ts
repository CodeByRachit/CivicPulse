/**
 * CivicPulse - Civic Triage & Rapid Response Platform
 * Core domain types and interfaces for grievance triage, telemetry, and forensic analysis.
 */

export type DepartmentCode = 'PWD-ROADS' | 'WATER-SAN' | 'ENV-POLL' | 'ELEC-GRID';

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type GrievanceStatus = 'TRIAGED' | 'CLUSTERED' | 'DISPATCHED' | 'RESOLVED';

export type TriagePatchAction = 'UPVOTE' | 'DISPATCH' | 'RESOLVE';

export interface WeatherContext {
  temperature_2m: number | null;
  precipitation: number | null;
  wind_speed_10m: number | null;
  weather_code: number | null;
  condition_summary: string;
  fetched_at: string;
}

export interface DuplicateMergeEntry {
  timestamp: string;
  reporter_note: string;
  distance_meters: number;
  similarity: number;
}

export interface CryptographicAudit {
  encryption_cipher: 'AES-256-GCM';
  media_sha256_fingerprint: string | null;
  work_order_Encrypted_envelope?: string;
  citizen_pii_encrypted?: string | null;
  receipt_id: string;
  hmac_sha256_signature: string;
  magic_byte_format: string;
  verified_at: string;
}

export interface AIReasoningLog {
  is_valid_civic_issue: boolean;
  confidence_score: number;
  forensic_observations: string[];
  environmental_impact_analysis: string;
  routing_justification: string;
  official_work_order_draft: string;
  execution_latency_ms: number;
  duplicate_merge_history: DuplicateMergeEntry[];
  cryptographic_audit?: CryptographicAudit;
}

export interface DepartmentMetadata {
  id: string;
  code: DepartmentCode;
  name: string;
  sla_hours: number;
  escalation_email: string;
}

/**
 * Exact match to grievances table columns, omitting raw embedding vector
 * and location binary from frontend responses to optimize network payload.
 */
export interface GrievanceRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  department_code: DepartmentCode;
  severity_score: number;
  urgency_level: UrgencyLevel;
  status: GrievanceStatus;
  upvotes: number;
  media_url: string | null;
  media_type: string | null;
  lat: number;
  lng: number;
  address: string | null;
  weather_context: WeatherContext | null;
  ai_reasoning_log: AIReasoningLog;
  sla_deadline: string;
  created_at: string;
  departments?: DepartmentMetadata | null;
  department?: DepartmentMetadata | null;
}

export interface DuplicateMatchResult {
  matched_id: string;
  distance_meters: number;
  cosine_similarity: number;
  current_upvotes: number;
  current_severity: number;
}

export interface TriageCreatedResponse {
  action: 'CREATED_NEW';
  grievance: GrievanceRecord;
}

export interface TriageMergedResponse {
  action: 'MERGED_DUPLICATE';
  match_metrics: {
    distance_meters: number;
    cosine_similarity: number;
  };
  grievance: GrievanceRecord;
}

export interface TriageRejectedResponse {
  status: 'REJECTED';
  reason: string;
}

export interface TriageErrorResponse {
  error: string;
  details?: unknown;
}

export type TriageApiResponse =
  | TriageCreatedResponse
  | TriageMergedResponse
  | TriageRejectedResponse
  | TriageErrorResponse;

export interface GrievancesSummary {
  total: number;
  critical_count: number;
  clustered_count: number;
  avg_severity: number;
}

export interface GrievancesListResponse {
  grievances: GrievanceRecord[];
  summary: GrievancesSummary;
}

export interface GeminiTriageOutput {
  is_valid_civic_issue: boolean;
  rejection_reason: string;
  confidence_score: number;
  title: string;
  synthesized_description: string;
  category: string;
  department_code: DepartmentCode;
  base_severity: number;
  final_severity_score: number;
  urgency_level: UrgencyLevel;
  forensic_observations: string[];
  environmental_impact_analysis: string;
  routing_justification: string;
  official_work_order_draft: string;
}

