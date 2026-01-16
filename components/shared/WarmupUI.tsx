
import React, { useEffect, useState } from 'react';
import { warmupManager, WarmupTask } from '../../engines/lumina/core/WarmupManager';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@10.16.4';
import { Cpu, ShieldCheck, Zap } from 'lucide-react';

export const WarmupUI: React.FC = () => {
    const [tasks, setTasks] = useState<WarmupTask[]>(warmupManager.getTasks());
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleUpdate = (newTasks: WarmupTask[]) => {
            setTasks(newTasks);
            if (newTasks.every(t => t.status === 'ready')) {
                setTimeout(() => setIsVisible(false), 1000);
            }
        };
        warmupManager.on('update', handleUpdate);
        return () => { warmupManager.off('update', handleUpdate); };
    }, []);

    if (!isVisible) return null;

    const totalProgress = tasks.reduce((acc, t) => acc + t.progress, 0) / tasks.length;

    return (
        <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-[#050505] flex flex-col items-center justify-center p-8 text-center"
        >
            <div className="max-w-md w-full space-y-12">
                <div className="relative">
                    <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-[0_0_60px_rgba(79,70,229,0.3)] animate-pulse">
                        <Cpu size={40} className="text-white" />
                    </div>
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-indigo-500/20 rounded-full scale-150 border-t-indigo-500"
                    />
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Venus Kernel Ignite</h2>
                    <p className="text-[10px] mono text-zinc-500 uppercase tracking-[0.5em]">Synchronizing Industrial Subsystems</p>
                </div>

                <div className="space-y-4">
                    {tasks.map(task => (
                        <div key={task.id} className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{task.label}</span>
                                <span className={`text-[8px] font-black uppercase ${task.status === 'ready' ? 'text-emerald-500' : 'text-indigo-400'}`}>
                                    {task.status === 'ready' ? 'Ready' : `${Math.round(task.progress)}%`}
                                </span>
                            </div>
                            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden border border-white/5">
                                <motion.div 
                                    className={`h-full ${task.status === 'ready' ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${task.progress || (task.status === 'ready' ? 100 : 0)}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="pt-8 flex items-center justify-center gap-6 opacity-30">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500" />
                        <span className="text-[7px] font-black uppercase text-zinc-500">Cross-Origin Isolated</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Zap size={12} className="text-indigo-500" />
                        <span className="text-[7px] font-black uppercase text-zinc-500">WebGPU Backend</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
