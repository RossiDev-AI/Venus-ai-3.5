
export type AgentType = 
  | 'Director' | 'Meta-Prompt Translator' | 'Consensus Judge' | 'Scriptwriter' | 'Visual Scout'
  | 'Anatomy Specialist' | 'Texture Master' | 'Lighting Architect'
  | 'Anatomy Critic' | 'Luminance Critic' | 'Epidermal Specialist'
  | 'Lens Specialist' | 'Composition Analyst'
  | 'Neural Alchemist' | 'Latent Optimizer'
  | 'Puppeteer Agent' | 'Pose Extractor' | 'IK Solver'
  | 'Temporal Architect' | 'Motion Sculptor' | 'Fluidity Critic'
  | 'Identity Guard' | 'Visual Quality Judge' | 'Visual Archivist'
  | 'Digital DNA Curator' | 'Noise & Geometry Critic'
  | 'VAE Agent' | 'Texture Artist' | 'Lighting Lead' | 'Rigging Supervisor'
  | 'Surgical Repair Specialist' | 'Garment Architect' | 'Material Physicist'
  | 'Perspective Architect' | 'Gravity Analyst'
  | 'Style Transfer Specialist' | 'Chromatic Aberration Manager' | 'Lighting Harmonizer'
  | 'Semantic Router' | 'Vault Prioritizer'
  | 'Identity Anchor Manager' | 'Fabric Tension Analyst'
  | 'Spatial Synchronizer' | 'Vanishing Point Analyst'
  | 'Master Colorist' | 'Ray-Trace Agent' | 'Aesthetic Critic'
  | 'Vault Kernel' | 'Heuristic Optimizer'
  | 'Attribute Mapper' | 'Schema Validator'
  | 'Physics Analyst' | 'Shadow Projectionist' | 'Collision Engine'
  | 'Grading Specialist' | 'Chroma Manager' | 'Frequency Analyst'
  | 'Timeline Editor' | 'Audio Synchronizer' | 'Script Analyzer'
  | 'Data Architect' | 'Persistence Specialist' | 'Forensic Sync Agent';

export type LuminaBlendMode = 
  | 'normal' | 'multiply' | 'screen' | 'overlay' 
  | 'soft-light' | 'hard-light' | 'vivid-light' | 'difference';

export interface SmartObjectDefinition {
  id: string;
  shapes: any[]; 
  thumbnailUrl: string;
  lastUpdated: number;
}

export interface IAImage {
  id: string;
  url: string;
  prompt: string;
  maskLayer?: any; 
  dimensions: { width: number; height: number; };
  createdAt: number;
}

// Added missing CategorizedDNA interface
export interface CategorizedDNA {
  character?: string;
  environment?: string;
  pose?: string;
  technical_tags: string[];
  spatial_metadata?: {
    camera_angle?: string;
    depth_map?: string;
  };
  aesthetic_dna?: {
    lighting_setup?: string;
    color_palette?: string[];
  };
}

export interface VaultItem {
  id: string;
  shortId: string;
  name: string; 
  imageUrl: string;
  originalImageUrl: string;
  prompt: string;
  agentHistory: AgentStatus[];
  params: LatentParams;
  rating: number;
  timestamp: number;
  dna?: CategorizedDNA; // Updated to use CategorizedDNA
  usageCount: number;
  neuralPreferenceScore: number;
  isFavorite: boolean;
  vaultDomain: VaultDomain;
  grading?: LatentGrading;
}

export type VaultDomain = 'X' | 'Y' | 'Z' | 'L';
export type ProcessingSpeed = 'Fast' | 'Balanced' | 'Deliberate' | 'Debug';
export interface AgentAuthority { lighting: number; texture: number; structure: number; anatomy: number; }
export interface AgentStatus { type: AgentType; status: 'idle' | 'processing' | 'completed' | 'error'; message: string; timestamp: number; department?: string; flow_to?: AgentType; }
export interface LatentParams { z_anatomy: number; z_structure: number; z_lighting: number; z_texture: number; hz_range: string; structural_fidelity: number; scale_factor: number; temporal_stability?: number; motion_bias?: number; auto_tune_active?: boolean; neural_metrics: { loss_mse: number; ssim_index: number; tensor_vram: number; iteration_count: number; consensus_score: number; projection_coherence?: number; qc_verdict?: string; visual_critique?: string; }; dna?: CategorizedDNA; agent_authority?: AgentAuthority; vault_domain?: VaultDomain; active_slots?: Partial<Record<VaultDomain, string | null>>; processing_speed?: ProcessingSpeed; pose_control?: any; dna_type?: string; }
export interface LatentGrading { [key: string]: any; preset_name: string; css_filter_string: string; brightness: number; contrast: number; saturation: number; exposure: number; temperature: number; tint: number; hueRotate: number; blur: number; grain: number; vignette: number; bloom: number; chromatic: number; sharpness: number; }

export interface AnimationTrack {
  property: 'x' | 'y' | 'scale' | 'rotation' | 'opacity' | 'blur';
  keyframes: { time: number; value: number; easing?: string; }[];
}

export interface VideoExportSettings {
  format: 'mp4' | 'webm' | 'gif';
  fps: number;
  duration: number;
  width: number;
  height: number;
  transparent?: boolean;
}

export interface LuminaSnapshot {
  id: string;
  timestamp: number;
  label: string;
  yjsState: Uint8Array; // Delta/Update binary
  thumbnail: string; // Base64 low-res
  isAuto: boolean;
}

// --- Batch Types ---
export interface BatchAction {
    type: 'RESIZE' | 'GRAD_PRESET' | 'FILTER' | 'WATERMARK' | 'AI_ENHANCE';
    params: any;
}

export interface BatchMacro {
    id: string;
    name: string;
    actions: BatchAction[];
}

export interface BatchItem {
    id: string;
    file: File;
    status: 'waiting' | 'processing' | 'done' | 'error';
    progress: number;
    error?: string;
    resultId?: string; // ID no OPFS
}

// Added missing TimelineBeat interface
export interface TimelineBeat {
  id: string;
  timestamp: number;
  duration: number;
  assetUrl: string | null;
  caption: string;
  assetType: 'IMAGE' | 'VIDEO' | 'UPLOAD';
  scoutQuery?: string;
  sourceLink?: string;
  yOffset?: number;
}

// Added missing SubtitleSettings interface
export interface SubtitleSettings {
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  fontFamily: string;
  bgOpacity: number;
  textAlign: 'left' | 'center' | 'right';
  paddingHMult: number;
  paddingVMult: number;
  radiusMult: number;
  marginMult: number;
}

export interface CinemaProject {
  id: string;
  title: string;
  beats: TimelineBeat[]; // Updated to use TimelineBeat
  audioUrl: string | null;
  fps: number;
  aspectRatio: '16:9' | '9:16' | '1:1';
  subtitleSettings: SubtitleSettings; // Updated to use SubtitleSettings
}

// Added missing FusionManifest interface
export interface FusionManifest {
  pep_id: string;
  pop_id: string;
  pov_id: string;
  amb_id: string;
  weights: { pep: number; pop: number; pov: number; amb: number };
  style_modifiers: string[];
  surgicalSwap: boolean;
  fusionIntent: string;
  protectionStrength: number;
}

// Added missing AppSettings interface
export interface AppSettings {
  pexelsApiKey: string;
  unsplashAccessKey: string;
  pixabayApiKey: string;
}

// Added missing VisualAnchor interface
export interface VisualAnchor {
  id: string;
  type: string;
  pos: { x: number, y: number };
}

// Added missing DeliberationStep interface
export interface DeliberationStep {
  from: string;
  to: string;
  timestamp: number;
  action: string;
  impact: string;
}

// Added missing WarpMethod type
export type WarpMethod = 'affine' | 'thin_plate' | 'deformation';

// Added missing PoseData interface
export interface PoseData {
  imageUrl: string;
  strength: number;
  symmetry_strength: number;
  rigid_integrity: number;
  preserveIdentity: boolean;
  enabled: boolean;
  warpMethod: WarpMethod;
  dna?: CategorizedDNA;
  technicalDescription?: string;
}

// Added missing DNAToken interface
export interface DNAToken {
  id: string;
  domain: VaultDomain;
}

// Added missing ScoutCandidate interface
export interface ScoutCandidate {
  id: string;
  title: string;
  source_layer: string;
  composite_score: number;
  quality_metrics: {
    technical: number;
    aesthetic: number;
  };
  votes: {
    agent: string;
    score: number;
    critique: string;
  }[];
  dna_preview: {
    z_anatomy?: number;
    z_structure?: number;
    z_lighting?: number;
    z_texture?: number;
  };
}

// Added missing ScoutData interface
export interface ScoutData {
  candidates: ScoutCandidate[];
  consensus_report: string;
  winner_id: string;
  search_stats: {
    premium_hits: number;
    internal_hits: number;
  };
}

// Added missing PoseSkeleton interface
export interface PoseSkeleton {
   keypoints: { name: string, position: number[], confidence: number }[];
}
