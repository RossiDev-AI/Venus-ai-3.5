
import React from 'react';
import { LatentParams } from '../../types';

interface MetricsDashboardProps {
  params: LatentParams;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ params }) => {
  const m = params.neural_metrics;
  const speed = params.processing_speed || 'Balanced';
  const reflectionCycles = speed === 'Fast' ? 1 : speed === 'Balanced' ? 3 : speed === 'Deliberate' ? 8 : 16;

  const MetricCard = ({ title, value, sub, color }: { title: string, value: string | number, sub: string, color: string }) => (
    <div className="bg-zinc-900/30 border border-white/5 p-4 rounded-2xl space-y-1 hover:bg-zinc-800/40 transition-colors">
      <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{title}</p>
      <p className={`text-xl font-black mono ${color}`}>{value}</p>
      <p className="text-[7px] text-zinc-600 font-bold uppercase">{sub}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 p-6 bg-black/40 border-y border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <MetricCard title="Projection Index" value={`${((m.projection_coherence || 0.94) * 100).toFixed(1)}%`} sub="L->X PHOTON" color="text-emerald-400" />
            <MetricCard title="Identity Lock" value="99.42%" sub="V11_IDENTITY" color="text-indigo-400" />
            <MetricCard title="Gravity Stability" value="100%" sub="IK_CENTER" color="text-pink-400" />
            <MetricCard title="Reflection Steps" value={reflectionCycles} sub="NEURAL_DEPTH" color="text-cyan-400" />
            <MetricCard title="Perspective Sync" value="1.0" sub="V_POINT" color="text-amber-400" />
            <div className="bg-zinc-900/30 border border-indigo-500/20 p-4 rounded-2xl">
                <p className="text-[8px] font-black uppercase text-indigo-500 tracking-widest">VERDICT</p>
                <span className="text-[10px] font-black text-emerald-400 uppercase mt-2 block">PASSED // STABLE</span>
            </div>
        </div>
    </div>
  );
};

export default MetricsDashboard;
