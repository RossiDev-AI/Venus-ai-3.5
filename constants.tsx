
import React from 'react';
import { 
  Clapperboard, 
  Languages, 
  Gavel, 
  PenTool, 
  ScanEye, 
  Eye, 
  Archive, 
  Sun, 
  CloudFog, 
  Activity, 
  Fingerprint, 
  Palette, 
  Scissors, 
  Aperture, 
  Layers, 
  Workflow, 
  Video, 
  Sparkles, 
  Mic
} from 'lucide-react';

export const ICONS: Record<string, React.ReactNode> = {
  // Core & Management
  Director: <Clapperboard size={20} strokeWidth={1.5} />,
  'Meta-Prompt Translator': <Languages size={20} strokeWidth={1.5} />,
  'Consensus Judge': <Gavel size={20} strokeWidth={1.5} />,
  'Scriptwriter': <PenTool size={20} strokeWidth={1.5} />,
  'Visual Scout': <ScanEye size={20} strokeWidth={1.5} />,
  'Visual Quality Judge': <Eye size={20} strokeWidth={1.5} />,
  'Visual Archivist': <Archive size={20} strokeWidth={1.5} />,

  // 1. Gaffer Team (Lighting)
  'Luminance Critic': <Sun size={20} strokeWidth={1.5} />,
  'Shadow Specialist': <CloudFog size={20} strokeWidth={1.5} />,
  'Ray-Trace Agent': <Activity size={20} strokeWidth={1.5} />,
  'Atmospheric Critic': <CloudFog size={20} strokeWidth={1.5} />,

  // 2. SFX Team (Texture)
  'Epidermal Specialist': <Fingerprint size={20} strokeWidth={1.5} />,
  'Material Alchemist': <Palette size={20} strokeWidth={1.5} />,
  'Textile Critic': <Scissors size={20} strokeWidth={1.5} />,
  'Hair & Fur Groomer': <Scissors size={20} strokeWidth={1.5} />,

  // 3. Casting Team
  'Identity Guard': <Fingerprint size={20} strokeWidth={1.5} />,
  'Anatomy Critic': <Activity size={20} strokeWidth={1.5} />,
  'Emotion Sculptor': <Eye size={20} strokeWidth={1.5} />,

  // 4. Lens Team
  'Bokeh & DOF Agent': <Aperture size={20} strokeWidth={1.5} />,
  'Chromatic Aberration Critic': <Aperture size={20} strokeWidth={1.5} />,
  'Composition Judge': <Layers size={20} strokeWidth={1.5} />,

  // 5. Finalization
  'Master Colorist': <Palette size={20} strokeWidth={1.5} />,
  'Grain & Noise Manager': <CloudFog size={20} strokeWidth={1.5} />,
  'Consistency Judge': <Workflow size={20} strokeWidth={1.5} />,

  // 6. Puppeteer Team
  'IK Rig Agent': <Activity size={20} strokeWidth={1.5} />,
  'Weight Distribution Critic': <Activity size={20} strokeWidth={1.5} />,
  'Contact Point Specialist': <ScanEye size={20} strokeWidth={1.5} />,
  'Gesture Nuance Agent': <PenTool size={20} strokeWidth={1.5} />,

  // 7. Camera Op Team
  'Angle Architect': <Video size={20} strokeWidth={1.5} />,
  'Lens Distortion Specialist': <Aperture size={20} strokeWidth={1.5} />,
  'Eye-Level Coordinator': <Eye size={20} strokeWidth={1.5} />,
  'Z-Depth Manager': <Layers size={20} strokeWidth={1.5} />,

  // Cinema Lab Agents
  'Temporal Architect': <Workflow size={20} strokeWidth={1.5} />,
  'Motion Sculptor': <Activity size={20} strokeWidth={1.5} />,
  'Fluidity Critic': <Video size={20} strokeWidth={1.5} />,
  'Latent Optimizer': <Sparkles size={20} strokeWidth={1.5} />,
  
  // New
  'Audio Synchronizer': <Mic size={20} strokeWidth={1.5} />
};
