
import React from 'react';
import { track, useEditor } from 'tldraw';
import { Combine, Scissors, Union, Square, Target, MousePointer2 } from 'lucide-react';
import { vectorManager, PathfinderOp } from '../../../engines/lumina/core/VectorManager';
import { toast } from 'sonner';

export const VectorInspector = track(() => {
    const editor = useEditor();
    const selection = editor.getSelectedShapes();
    const isVector = selection.length === 1 && selection[0].type === 'lumina-vector';
    const canCombine = selection.length === 2 && selection.every(s => s.type === 'lumina-vector');

    const handlePathOp = async (op: PathfinderOp) => {
        if (!canCombine) return;
        const [shapeA, shapeB] = selection as any[];
        
        const tid = toast.loading("Calculando Geometria Skia...");
        try {
            const newPathData = await vectorManager.combinePaths(shapeA.props.pathData, shapeB.props.pathData, op);
            if (newPathData) {
                editor.createShape({
                    type: 'lumina-vector',
                    x: shapeA.x,
                    y: shapeA.y,
                    props: { ...shapeA.props, pathData: newPathData }
                });
                editor.deleteShapes([shapeA.id, shapeB.id]);
                toast.success("Formas Combinadas", { id: tid });
            }
        } catch (e) {
            toast.error("Erro na operação booleana", { id: tid });
        }
    };

    return (
        <div className="p-6 space-y-10 bg-[#0c0c0e]">
            <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <Combine size={18} className="text-indigo-400" />
                    <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Pathfinder Engine</h3>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    {[
                        { id: PathfinderOp.UNION, icon: Union, label: 'Unir' },
                        { id: PathfinderOp.DIFFERENCE, icon: Scissors, label: 'Subtrair' },
                        { id: PathfinderOp.INTERSECT, icon: Target, label: 'Interseção' },
                        { id: PathfinderOp.XOR, icon: Combine, label: 'Excluir' }
                    ].map(btn => (
                        <button 
                            key={btn.id}
                            onClick={() => handlePathOp(btn.id)}
                            disabled={!canCombine}
                            className="p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:bg-indigo-600 disabled:opacity-20 transition-all flex flex-col items-center gap-2 group"
                            title={btn.label}
                        >
                            <btn.icon size={16} className="text-zinc-400 group-hover:text-white" />
                            <span className="text-[6px] font-black uppercase text-zinc-600 group-hover:text-white">{btn.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {isVector && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                    <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <MousePointer2 size={18} className="text-pink-500" />
                        <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Direct Edit</h3>
                    </div>

                    <button 
                        onClick={() => editor.updateShape({ id: selection[0].id, props: { isEditingNodes: !(selection[0].props as any).isEditingNodes } as any })}
                        className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${(selection[0].props as any).isEditingNodes ? 'bg-pink-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-400'}`}
                    >
                        <Square size={14} /> {(selection[0].props as any).isEditingNodes ? 'Sair da Edição de Nós' : 'Ativar Edição de Nós'}
                    </button>
                </div>
            )}
        </div>
    );
});
