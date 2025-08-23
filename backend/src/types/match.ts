// Re-export enums from competition types
export { Cabang, JenisKelamin } from './competition';

// Match status enum
export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  POSTPONED = 'POSTPONED',
}

// Match result enum
export enum MatchResult {
  WIN_A = 'WIN_A',
  WIN_B = 'WIN_B',
  DRAW = 'DRAW',
  NO_CONTEST = 'NO_CONTEST',
  DISQUALIFIED_A = 'DISQUALIFIED_A',
  DISQUALIFIED_B = 'DISQUALIFIED_B',
  WALKOVER_A = 'WALKOVER_A',
  WALKOVER_B = 'WALKOVER_B',
}

// Score input method enum
export enum ScoreInputMethod {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  IMPORTED = 'IMPORTED',
}

// Match interfaces based on database schema
export interface MatchInfo {
  id_match: number;
  id_bagan: number;
  ronde: number;
  id_peserta_a?: number;
  id_peserta_b?: number;
  skor_a: number;
  skor_b: number;
  id_venue?: number;
  
  // Extended fields not in database
  status?: MatchStatus;
  result?: MatchResult;
  start_time?: Date;
  end_time?: Date;
  duration?: number; // in seconds
  
  // Relations (from database)
  bagan?: {
    id_bagan: number;
    id_kompetisi: number;
    id_kelas_kejuaraan: number;
  };
  peserta_a?: PesertaInfo;
  peserta_b?: PesertaInfo;
  venue?: VenueInfo;
  match_audit?: MatchAuditInfo[];
  
  // Calculated fields
  winner_id?: number;
  is_completed: boolean;
  score_difference: number;
}

// Participant info for matches
export interface PesertaInfo {
  id_peserta_kompetisi: number;
  id_atlet: number;
  status: string;
  atlet?: {
    id_atlet: number;
    nama_atlet: string;
    jenis_kelamin: JenisKelamin;
    berat_badan: number;
    dojang?: {
      nama_dojang: string;
      provinsi?: string;
    };
  };
}

// Venue info for matches
export interface VenueInfo {
  id_venue: number;
  nama_venue: string;
  lokasi?: string;
}

// Match audit info
export interface MatchAuditInfo {
  id_audit: number;
  id_match: number;
  id_user: number;
  aksi: string;
  payload?: any;
  created_at: Date;
}

// Score input interface
export interface ScoreInput {
  id_match: number;
  skor_a: number;
  skor_b: number;
  input_method?: ScoreInputMethod;
  notes?: string;
  timestamp?: Date;
  input_by?: number; // user id
}

// Round information
export interface RoundInfo {
  round_number: number;
  round_name: string;
  total_matches: number;
  completed_matches: number;
  is_final: boolean;
  next_round?: number;
}

// Bracket structure
export interface BracketStructure {
  id_bagan: number;
  id_kelas_kejuaraan: number;
  total_participants: number;
  total_rounds: number;
  bracket_type: BracketType;
  rounds: RoundInfo[];
  matches: MatchInfo[];
  seeds: SeedInfo[];
}

// Bracket type enum
export enum BracketType {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  SWISS = 'SWISS',
}

// Seed information
export interface SeedInfo {
  id_seed: number;
  id_peserta_kompetisi: number;
  seed_num: number;
  peserta?: PesertaInfo;
}

// Match scheduling interface
export interface MatchSchedule {
  id_match: number;
  scheduled_time: Date;
  estimated_duration: number; // in minutes
  actual_start_time?: Date;
  actual_end_time?: Date;
  delay_reason?: string;
  id_venue?: number;
}

// Live scoring interface
export interface LiveScore {
  id_match: number;
  current_round?: number;
  time_elapsed?: number; // in seconds
  skor_a: number;
  skor_b: number;
  last_updated: Date;
  status: MatchStatus;
}

// Match statistics
export interface MatchStatistics {
  id_match: number;
  total_duration: number;
  points_scored_a: number;
  points_scored_b: number;
  fouls_a?: number;
  fouls_b?: number;
  warnings_a?: number;
  warnings_b?: number;
  techniques_used?: string[];
}

// Tournament progression
export interface TournamentProgression {
  id_bagan: number;
  current_round: number;
  total_rounds: number;
  completed_matches: number;
  total_matches: number;
  remaining_participants: number;
  is_completed: boolean;
  champion?: PesertaInfo;
  runner_up?: PesertaInfo;
}

// Match creation request
export interface CreateMatchRequest {
  id_bagan: number;
  ronde: number;
  id_peserta_a?: number;
  id_peserta_b?: number;
  id_venue?: number;
  scheduled_time?: Date;
}

// Match update request
export interface UpdateMatchRequest {
  skor_a?: number;
  skor_b?: number;
  status?: MatchStatus;
  start_time?: Date;
  end_time?: Date;
  id_venue?: number;
  notes?: string;
}

// Match filter parameters
export interface MatchFilterParams {
  id_kompetisi?: number;
  id_kelas_kejuaraan?: number;
  id_bagan?: number;
  ronde?: number;
  status?: MatchStatus;
  id_venue?: number;
  date_from?: Date;
  date_to?: Date;
  search?: string; // participant name
}

// Match list response
export interface MatchListItem {
  id_match: number;
  ronde: number;
  peserta_a_nama?: string;
  peserta_b_nama?: string;
  skor_a: number;
  skor_b: number;
  status?: MatchStatus;
  venue_nama?: string;
  scheduled_time?: Date;
  is_completed: boolean;
  winner_nama?: string;
}

// Score validation result
export interface ScoreValidationResult {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

// Bracket generation options
export interface BracketGenerationOptions {
  bracket_type: BracketType;
  seeding_method: SeedingMethod;
  randomize_seeds: boolean;
  bye_placement: ByePlacement;
  allow_same_dojang_early?: boolean;
}

// Seeding method enum
export enum SeedingMethod {
  RANDOM = 'RANDOM',
  BY_RANK = 'BY_RANK',
  BY_EXPERIENCE = 'BY_EXPERIENCE',
  MANUAL = 'MANUAL',
}

// Bye placement enum
export enum ByePlacement {
  TOP_SEEDS = 'TOP_SEEDS',
  BOTTOM_SEEDS = 'BOTTOM_SEEDS',
  DISTRIBUTED = 'DISTRIBUTED',
  RANDOM = 'RANDOM',
}