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
import styles from './TechTreeFlow.module.css';

import { buildGraph } from "./layout";
import { TechNode } from "./TechNode";
import { TechFlowContext } from "@/context/TechFlowContext";
import { useTechTreeContext } from "@/context/TechTreeContext";

const nodeTypes: NodeTypes = { techNode: TechNode };

export function TechTreeFlow() {
    const { tree, xp, loading, purchaseTech } = useTechTreeContext();

    const { nodes, edges } = useMemo(() => {
        if (!tree) {
            return {
                nodes: [], edges: []
            }
        }

        const { nodes, edges } = buildGraph(tree);

        const unlocked = new Set(tree.upgrades);
        const styledEdges = edges.map(e => ({
            ...e,
            style: {
                stroke: unlocked.has(e.source) ? '#8dc63f' : 'rgba(255,255,255,0.18)',
                strokeWidth: 1.5,
            },
            markerEnd: {
                type: MarkerType.ArrowClosed, color: unlocked.has(e.source) ? '#8dc63f' : 'rgba(255,255,255,0.18)'
            },
        }));

        const fixedNodes: Node[] = nodes.map(n => ({ ...n, draggable: true }));

        return { nodes: fixedNodes, edges: styledEdges };
    }, [tree]);

    const ctx = useMemo(() => ({
        currentXp: xp,
        purchasing: loading,
        onPurchase: purchaseTech,
    }), [xp, loading, purchaseTech]);

    return (
        <TechFlowContext.Provider value={ctx}>
            <div className={`${styles.flow} h-[70vh] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[rgba(14,14,22,0.75)]`}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    minZoom={0.3}
                    maxZoom={1.5}
                    proOptions={{ hideAttribution: true }}
                >
                    <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="rgba(255,255,255,0.08)" />
                    <Controls />
                    <MiniMap
                        pannable
                        zoomable
                        nodeColor={(n: Node) => {
                            const d = n.data as { unlocked?: boolean; available?: boolean };
                            if (d.unlocked) {
                                return '#8dc63f';
                            }
                            if (d.available) {
                                return '#1c75bc';
                            }
                            return 'rgba(255,255,255,0.2)';
                        }}
                    />
                </ReactFlow>
            </div>
        </TechFlowContext.Provider>
    );
}