'use client';
import { useMemo } from "react";
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    Node,
    Edge,
    NodeTypes,
    BackgroundVariant,
    MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { TechTree } from "@/lib/types/techTree";
import { buildGraph } from "./layout";
import { TechNode } from "./TechNode";
import { TechTreeContext } from "@/context/TechTreeContext";

const nodeTypes: NodeTypes = { techNode: TechNode };

interface Props {
    tree: TechTree;
    purchasing: boolean;
    onPurchase: (name: string) => void;
}

export function TechTreeFlow({ tree, purchasing, onPurchase }: Props) {
    const { nodes, edges } = useMemo(() => {
        const { nodes, edges } = buildGraph(tree);

        const unlocked = new Set(tree.upgrades);
        const styledEdges = edges.map(e => ({
            ...e,
            style: {
                stroke: unlocked.has(e.source) ? '#34d399' : '#475569',
                strokeWidth: 1.5,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed, color: unlocked.has(e.source) ? '#34d399' : '#475569'
            },
        }));

        const fixedNodes: Node[] = nodes.map(n => ({ ...n, draggable: false }));

        return { nodes: fixedNodes, edges: styledEdges };
    }, [tree.nodes, tree.upgrades]);

    const ctx = useMemo(() => ({
        currentXp: tree.experience_points,
        purchasing,
        onPurchase,
    }), [tree.experience_points, purchasing, onPurchase]);

    return (
        <TechTreeContext.Provider value={ctx}>
            <div className="h-[70vh] w-full rounded-xl border border-slate-700/60 bg-slate-900/40">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.3}
                    maxZoom={1.5}
                    propOptions={{ hideAttribution: true }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
                    <Controls class="!bg-slate-800 !border-slate-700" />
                    <MiniMap
                        className="bg-slate-800"
                        nodeColor={(n) => {
                            const d = n.data as { unlocked?: boolean; available?: boolean };
                            if (d.unlocked) {
                                return '#34d399';
                            }
                            if (d.available) {
                                return '#0ea5e9';
                            }
                            return '#475569';
                        }}
                    />
                </ReactFlow>
            </div>
        </TechTreeContext.Provider>
    );
}