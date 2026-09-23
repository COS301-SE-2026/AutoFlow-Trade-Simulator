import dagre from 'dagre'
import { Node, Edge, Position } from 'reactflow'
import { TechNode } from '@/hooks/useTechTree'

export function buildGraph(tree: { nodes: TechNode[] }): {
    nodes: Node<TechNode>[];
    edges: Edge[];
} {
    const nodeWidth = 240;
    const nodeHeight = 140;

    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
        rankdir: "TB",
        nodesep: 48,
        ranksep: 80,
        marginx: 24,
        marginy: 24,
    });

    const nodeNames = new Set(tree.nodes.map(n => n.name));

    for (const n of tree.nodes) {
        g.setNode(n.name, { width: nodeWidth, height: nodeHeight });
    }

    const edges: Edge[] = [];
    for (const n of tree.nodes) {
        for (const prereq of n.prerequisites) {
            if (!nodeNames.has(prereq)) {
                continue;
            }
            g.setEdge(prereq, n.name);
            edges.push({
                id: `${prereq}->${n.name}`,
                source: prereq,
                target: n.name,
                type: 'smoothstep',
                animated: false,
                style: { strokeWidth: 1.5 }
            });
        }
    }

    dagre.layout(g);

    const nodes: Node<TechNode>[] = tree.nodes.map(n => {
        const { x, y } = g.node(n.name);
        return {
            id: n.name,
            type: 'techNode',
            position: {
                x: x - nodeWidth / 2,
                y: y - nodeHeight / 2,
            },
            data: n,
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
        };
    });

    return { nodes, edges };
}