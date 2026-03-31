'use client';

import { useEffect, useRef } from 'react';

const COLS = ['#00f5ff', '#00d4aa', '#00ff88', '#7c3aed', '#ff4d6d', '#fbbf24'];
function hex2rgba(h: string, a: number): string {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function randCol() { return COLS[Math.floor(Math.random() * COLS.length)]; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ── Types ─────────────────────────────────────────────────
interface TreeNode { x: number; y: number; val: number; left?: TreeNode; right?: TreeNode; depth: number; }
interface BinaryTree { root: TreeNode; color: string; alpha: number; baseX: number; baseY: number; breathPhase: number; }
interface LinkedListNode { x: number; y: number; }
interface LinkedList { nodes: LinkedListNode[]; color: string; alpha: number; flowOffset: number; speed: number; }
interface GraphNode { x: number; y: number; vx: number; vy: number; color: string; }
interface GraphEdge { a: number; b: number; }
interface Graph { nodes: GraphNode[]; edges: GraphEdge[]; traversalIdx: number; traversalTimer: number; color: string; alpha: number; }
interface SortBar { height: number; targetHeight: number; color: string; }
interface SortVis { x: number; y: number; bars: SortBar[]; width: number; barW: number; color: string; alpha: number; swapTimer: number; }
interface StackBlock { val: string; y: number; targetY: number; }
interface StackVis { x: number; y: number; blocks: StackBlock[]; color: string; alpha: number; timer: number; pushing: boolean; }
interface BigOLabel { x: number; y: number; text: string; color: string; alpha: number; vx: number; vy: number; size: number; breathPhase: number; }
interface HashBucket { x: number; y: number; items: number[]; color: string; }
interface HashVis { buckets: HashBucket[]; color: string; alpha: number; flowParticle: { x: number; y: number; targetBucket: number; active: boolean; val: number; }; timer: number; }
interface RecursionBranch { x1: number; y1: number; x2: number; y2: number; depth: number; }
interface RecursionTree { branches: RecursionBranch[]; color: string; alpha: number; breathPhase: number; }
interface Particle { x: number; y: number; vx: number; vy: number; r: number; alpha: number; color: string; }
interface EnergyWave { cx: number; cy: number; radius: number; maxRadius: number; color: string; alpha: number; }
interface CircuitNode { x: number; y: number; glow: boolean; color: string; pulse: number; baseAlpha: number; }
interface CircuitTrace { n1: number; n2: number; color: string; alpha: number; progress: number; active: boolean; }

export default function CircuitBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    let circuitNodes: CircuitNode[] = [];
    let circuitTraces: CircuitTrace[] = [];
    let particles: Particle[] = [];
    let binaryTrees: BinaryTree[] = [];
    let linkedLists: LinkedList[] = [];
    let graphs: Graph[] = [];
    let sortVisuals: SortVis[] = [];
    let stacks: StackVis[] = [];
    let bigOLabels: BigOLabel[] = [];
    let hashVisuals: HashVis[] = [];
    let recursionTrees: RecursionTree[] = [];
    let energyWaves: EnergyWave[] = [];

    const DSA_LABELS = ['O(1)', 'O(n)', 'O(log n)', 'O(n²)', 'O(n log n)', 'O(2ⁿ)', 'BFS', 'DFS', 'DP', 'BST',
      'AVL', 'HEAP', 'QUEUE', 'STACK', 'HASH', 'TRIE', 'GRAPH', 'TREE', 'ARRAY', 'MERGE', 'QUICK', 'LINKED LIST'];

    // ── Build binary tree recursively ──
    function buildTree(x: number, y: number, depth: number, spread: number, maxD: number): TreeNode {
      const node: TreeNode = { x, y, val: Math.floor(Math.random() * 99), depth };
      if (depth < maxD && Math.random() > 0.2) {
        node.left = buildTree(x - spread, y + 50, depth + 1, spread * 0.55, maxD);
      }
      if (depth < maxD && Math.random() > 0.2) {
        node.right = buildTree(x + spread, y + 50, depth + 1, spread * 0.55, maxD);
      }
      return node;
    }

    // ── Build fractal recursion tree ──
    function buildRecursion(x: number, y: number, angle: number, len: number, depth: number, maxD: number): RecursionBranch[] {
      if (depth > maxD || len < 5) return [];
      const x2 = x + Math.cos(angle) * len;
      const y2 = y + Math.sin(angle) * len;
      const branches: RecursionBranch[] = [{ x1: x, y1: y, x2, y2, depth }];
      const spread = 0.4 + Math.random() * 0.3;
      branches.push(...buildRecursion(x2, y2, angle - spread, len * 0.7, depth + 1, maxD));
      branches.push(...buildRecursion(x2, y2, angle + spread, len * 0.7, depth + 1, maxD));
      return branches;
    }

    function init() {
      const W = canvas!.width, H = canvas!.height;

      const isMobile = W < 768;

      // ── Circuit network (subtle base layer) ──
      circuitNodes = []; circuitTraces = [];
      const cellSize = isMobile ? 260 : 130;
      const cols = Math.ceil(W / cellSize), rows = Math.ceil(H / cellSize);
      for (let r = 0; r <= rows; r++) for (let c = 0; c <= cols; c++) {
        circuitNodes.push({
          x: c * cellSize + (Math.random() - 0.5) * 50, y: r * cellSize + (Math.random() - 0.5) * 50,
          glow: Math.random() < 0.12, color: randCol(), pulse: 0, baseAlpha: 0.06 + Math.random() * 0.08,
        });
      }
      for (let i = 0; i < circuitNodes.length; i++) {
        for (let j = i + 1; j < circuitNodes.length; j++) {
          if (Math.hypot(circuitNodes[i].x - circuitNodes[j].x, circuitNodes[i].y - circuitNodes[j].y) < 160 && Math.random() < 0.3) {
            circuitTraces.push({ n1: i, n2: j, color: randCol(), alpha: 0.03 + Math.random() * 0.04, progress: -1, active: false });
          }
        }
      }

      // ── Particles ──
      particles = [];
      const numParticles = isMobile ? 15 : 50;
      for (let i = 0; i < numParticles; i++) {
        particles.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, r: Math.random() * 1.2 + 0.3, alpha: Math.random() * 0.35 + 0.05, color: randCol() });
      }

      // ── Binary Trees ──
      binaryTrees = [];
      const numTrees = isMobile ? 1 : 3;
      for (let i = 0; i < numTrees; i++) {
        const bx = 100 + Math.random() * (W - 200);
        const by = 60 + Math.random() * (H - 250);
        binaryTrees.push({
          root: buildTree(0, 0, 0, 120 + Math.random() * 60, 4),
          color: randCol(), alpha: 0.14 + Math.random() * 0.08,
          baseX: bx, baseY: by, breathPhase: Math.random() * Math.PI * 2,
        });
      }

      // ── Linked Lists (flowing chains) ──
      linkedLists = [];
      const numLists = isMobile ? 1 : 4;
      for (let i = 0; i < numLists; i++) {
        const nodeCount = 4 + Math.floor(Math.random() * 5);
        const llNodes: LinkedListNode[] = [];
        let lx = -50 + Math.random() * W * 0.3;
        const ly = 50 + Math.random() * (H - 100);
        for (let j = 0; j < nodeCount; j++) {
          llNodes.push({ x: lx, y: ly + (Math.random() - 0.5) * 30 });
          lx += 70 + Math.random() * 40;
        }
        linkedLists.push({ nodes: llNodes, color: randCol(), alpha: 0.15 + Math.random() * 0.08, flowOffset: 0, speed: 0.3 + Math.random() * 0.5 });
      }

      // ── Graphs with traversal animation ──
      graphs = [];
      const numGraphs = isMobile ? 1 : 2;
      for (let i = 0; i < numGraphs; i++) {
        const cx = 150 + Math.random() * (W - 300);
        const cy = 150 + Math.random() * (H - 300);
        const gNodes: GraphNode[] = [];
        const gEdges: GraphEdge[] = [];
        const count = 8 + Math.floor(Math.random() * 5);
        for (let j = 0; j < count; j++) {
          gNodes.push({ x: cx + (Math.random() - 0.5) * 200, y: cy + (Math.random() - 0.5) * 200, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, color: randCol() });
        }
        for (let a = 0; a < count; a++) {
          for (let b = a + 1; b < count; b++) {
            if (Math.hypot(gNodes[a].x - gNodes[b].x, gNodes[a].y - gNodes[b].y) < 150 && Math.random() < 0.5) {
              gEdges.push({ a, b });
            }
          }
        }
        graphs.push({ nodes: gNodes, edges: gEdges, traversalIdx: 0, traversalTimer: 0, color: randCol(), alpha: 0.14 + Math.random() * 0.06 });
      }

      // ── Sorting visualization (mini bar charts being sorted) ──
      sortVisuals = [];
      const numSortVis = isMobile ? 1 : 3;
      for (let i = 0; i < numSortVis; i++) {
        const barCount = 12 + Math.floor(Math.random() * 10);
        const bars: SortBar[] = [];
        for (let j = 0; j < barCount; j++) {
          const h = 15 + Math.random() * 80;
          bars.push({ height: h, targetHeight: h, color: randCol() });
        }
        sortVisuals.push({
          x: 80 + Math.random() * (W - 200), y: 100 + Math.random() * (H - 200),
          bars, width: barCount * 10, barW: 8, color: randCol(), alpha: 0.13 + Math.random() * 0.06, swapTimer: 0,
        });
      }

      // ── Stack visualizations ──
      stacks = [];
      const numStacks = isMobile ? 1 : 2;
      for (let i = 0; i < numStacks; i++) {
        const blocks: StackBlock[] = [];
        const count = 3 + Math.floor(Math.random() * 3);
        for (let j = 0; j < count; j++) {
          blocks.push({ val: String(Math.floor(Math.random() * 99)), y: j * 18, targetY: j * 18 });
        }
        stacks.push({
          x: 100 + Math.random() * (W - 200), y: 150 + Math.random() * (H - 300),
          blocks, color: randCol(), alpha: 0.15 + Math.random() * 0.06, timer: 0, pushing: true,
        });
      }

      // ── Big-O / DSA labels floating ──
      bigOLabels = [];
      const numLabels = isMobile ? 6 : 18;
      for (let i = 0; i < numLabels; i++) {
        bigOLabels.push({
          x: Math.random() * W, y: Math.random() * H,
          text: DSA_LABELS[Math.floor(Math.random() * DSA_LABELS.length)],
          color: randCol(), alpha: 0.06 + Math.random() * 0.08,
          vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
          size: 14 + Math.random() * 22, breathPhase: Math.random() * Math.PI * 2,
        });
      }

      // ── Hash table visualizations ──
      hashVisuals = [];
      const numHashVis = isMobile ? 0 : 2;
      for (let i = 0; i < numHashVis; i++) {
        const buckets: HashBucket[] = [];
        for (let j = 0; j < 5; j++) {
          const items: number[] = [];
          for (let k = 0; k < Math.floor(Math.random() * 3); k++) items.push(Math.floor(Math.random() * 99));
          buckets.push({ x: j * 35, y: 0, items, color: randCol() });
        }
        hashVisuals.push({
          buckets, color: randCol(), alpha: 0.13 + Math.random() * 0.05,
          flowParticle: { x: 0, y: -30, targetBucket: 0, active: false, val: 0 }, timer: 0,
        });
      }

      // ── Recursion / fractal trees ──
      recursionTrees = [];
      const numRecursion = isMobile ? 1 : 3;
      for (let i = 0; i < numRecursion; i++) {
        const rx = 100 + Math.random() * (W - 200);
        const ry = H * 0.3 + Math.random() * H * 0.4;
        recursionTrees.push({
          branches: buildRecursion(rx, ry, -Math.PI / 2, 55 + Math.random() * 35, 0, 6 + Math.floor(Math.random() * 3)),
          color: randCol(), alpha: 0.08 + Math.random() * 0.07, breathPhase: Math.random() * Math.PI * 2,
        });
      }

      energyWaves = [];
    }

    function resize() { canvas!.width = window.innerWidth; canvas!.height = window.innerHeight; init(); }

    // ── Draw helpers ──
    function drawTreeNode(node: TreeNode, bx: number, by: number, color: string, alpha: number) {
      if (node.left) {
        ctx!.beginPath(); ctx!.moveTo(bx + node.x, by + node.y); ctx!.lineTo(bx + node.left.x, by + node.left.y);
        ctx!.strokeStyle = hex2rgba(color, alpha * 0.8); ctx!.lineWidth = 1; ctx!.stroke();
        drawTreeNode(node.left, bx, by, color, alpha);
      }
      if (node.right) {
        ctx!.beginPath(); ctx!.moveTo(bx + node.x, by + node.y); ctx!.lineTo(bx + node.right.x, by + node.right.y);
        ctx!.strokeStyle = hex2rgba(color, alpha * 0.8); ctx!.lineWidth = 1; ctx!.stroke();
        drawTreeNode(node.right, bx, by, color, alpha);
      }
      // Node circle
      ctx!.beginPath(); ctx!.arc(bx + node.x, by + node.y, 12, 0, Math.PI * 2);
      ctx!.fillStyle = hex2rgba(color, alpha * 0.35); ctx!.fill();
      ctx!.strokeStyle = hex2rgba(color, alpha * 1.2); ctx!.lineWidth = 1.5; ctx!.stroke();
      // Value text
      ctx!.fillStyle = hex2rgba(color, alpha * 2);
      ctx!.font = "10px 'Space Grotesk',cursive";
      ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
      ctx!.fillText(String(node.val), bx + node.x, by + node.y);
    }

    function draw() {
      const W = canvas!.width, H = canvas!.height;
      frame++;

      ctx!.fillStyle = '#000000';
      ctx!.fillRect(0, 0, W, H);

      // ── 1. CIRCUIT TRACES (base layer) ──
      circuitTraces.forEach(t => {
        const n1 = circuitNodes[t.n1], n2 = circuitNodes[t.n2];
        if (t.active && t.progress >= 0) {
          t.progress = Math.min(1, t.progress + 0.02);
          const ex = n1.x + (n2.x - n1.x) * t.progress, ey = n1.y + (n2.y - n1.y) * t.progress;
          ctx!.beginPath(); ctx!.moveTo(n1.x, n1.y); ctx!.lineTo(ex, ey);
          ctx!.strokeStyle = hex2rgba(t.color, 0.4); ctx!.lineWidth = 1.2; ctx!.stroke();
          ctx!.beginPath(); ctx!.arc(ex, ey, 2, 0, Math.PI * 2);
          ctx!.fillStyle = hex2rgba(t.color, 0.7); ctx!.fill();
          if (t.progress >= 1) { t.active = false; t.progress = -1; circuitNodes[t.n2].pulse = 1; }
        } else {
          ctx!.beginPath(); ctx!.moveTo(n1.x, n1.y); ctx!.lineTo(n2.x, n2.y);
          ctx!.strokeStyle = hex2rgba(t.color, t.alpha); ctx!.lineWidth = 0.5; ctx!.stroke();
        }
      });
      circuitNodes.forEach(n => {
        if (n.pulse > 0) {
          const gr = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.pulse * 18);
          gr.addColorStop(0, hex2rgba(n.color, n.pulse * 0.4)); gr.addColorStop(1, 'transparent');
          ctx!.fillStyle = gr; ctx!.beginPath(); ctx!.arc(n.x, n.y, n.pulse * 18, 0, Math.PI * 2); ctx!.fill();
          n.pulse = Math.max(0, n.pulse - 0.03);
        }
        ctx!.beginPath(); ctx!.arc(n.x, n.y, n.glow ? 3 : 1.5, 0, Math.PI * 2);
        ctx!.fillStyle = hex2rgba(n.color, n.baseAlpha); ctx!.fill();
      });

      // ── 2. RECURSION FRACTAL TREES ──
      recursionTrees.forEach(rt => {
        const breath = 0.8 + 0.2 * Math.sin(frame * 0.008 + rt.breathPhase);
        rt.branches.forEach(b => {
          const depthFade = Math.max(0.2, 1 - b.depth * 0.12);
          ctx!.beginPath(); ctx!.moveTo(b.x1, b.y1); ctx!.lineTo(b.x2, b.y2);
          ctx!.strokeStyle = hex2rgba(rt.color, rt.alpha * depthFade * breath);
          ctx!.lineWidth = Math.max(0.3, 2.5 - b.depth * 0.3); ctx!.stroke();
        });
      });

      // ── 3. BINARY TREES ──
      binaryTrees.forEach(bt => {
        const breath = 0.85 + 0.15 * Math.sin(frame * 0.012 + bt.breathPhase);
        drawTreeNode(bt.root, bt.baseX, bt.baseY, bt.color, bt.alpha * breath);
      });

      // ── 4. LINKED LISTS (flowing chains with arrows) ──
      linkedLists.forEach(ll => {
        ll.flowOffset += ll.speed;
        const pulse = 0.7 + 0.3 * Math.sin(frame * 0.015 + ll.flowOffset * 0.1);
        ll.nodes.forEach((n, i) => {
          // Arrow to next
          if (i < ll.nodes.length - 1) {
            const next = ll.nodes[i + 1];
            ctx!.beginPath(); ctx!.moveTo(n.x + 12, n.y); ctx!.lineTo(next.x - 12, next.y);
            ctx!.strokeStyle = hex2rgba(ll.color, ll.alpha * pulse); ctx!.lineWidth = 1; ctx!.stroke();
            // Arrowhead
            const ax = next.x - 12, ay = next.y;
            ctx!.beginPath(); ctx!.moveTo(ax, ay); ctx!.lineTo(ax - 6, ay - 3); ctx!.lineTo(ax - 6, ay + 3); ctx!.closePath();
            ctx!.fillStyle = hex2rgba(ll.color, ll.alpha * pulse); ctx!.fill();
            // Flow dot
            const flowT = ((ll.flowOffset / 30 + i * 0.3) % 1);
            const fx = lerp(n.x, next.x, flowT), fy = lerp(n.y, next.y, flowT);
            ctx!.beginPath(); ctx!.arc(fx, fy, 2, 0, Math.PI * 2);
            ctx!.fillStyle = hex2rgba(ll.color, ll.alpha * 2); ctx!.fill();
          }
          // Node box
          ctx!.strokeStyle = hex2rgba(ll.color, ll.alpha * pulse); ctx!.lineWidth = 1;
          ctx!.strokeRect(n.x - 12, n.y - 9, 24, 18);
          // Null pointer at end
          if (i === ll.nodes.length - 1) {
            ctx!.beginPath(); ctx!.moveTo(n.x + 14, n.y - 6); ctx!.lineTo(n.x + 22, n.y + 6);
            ctx!.strokeStyle = hex2rgba(ll.color, ll.alpha * 0.6); ctx!.lineWidth = 1.5; ctx!.stroke();
          }
        });
      });

      // ── 5. GRAPHS with traversal glow ──
      graphs.forEach(g => {
        g.traversalTimer++;
        if (g.traversalTimer > 40) { g.traversalTimer = 0; g.traversalIdx = (g.traversalIdx + 1) % g.nodes.length; }
        // Edges
        g.edges.forEach(e => {
          const a = g.nodes[e.a], b = g.nodes[e.b];
          ctx!.beginPath(); ctx!.moveTo(a.x, a.y); ctx!.lineTo(b.x, b.y);
          ctx!.strokeStyle = hex2rgba(g.color, g.alpha * 0.7); ctx!.lineWidth = 0.8; ctx!.stroke();
        });
        // Nodes
        g.nodes.forEach((n, i) => {
          n.x += n.vx; n.y += n.vy;
          // Bounce softly
          if (n.x < 50 || n.x > W - 50) n.vx *= -1;
          if (n.y < 50 || n.y > H - 50) n.vy *= -1;
          const isActive = i === g.traversalIdx;
          ctx!.beginPath(); ctx!.arc(n.x, n.y, isActive ? 7 : 5, 0, Math.PI * 2);
          ctx!.fillStyle = hex2rgba(g.color, isActive ? g.alpha * 3 : g.alpha);
          ctx!.fill();
          ctx!.strokeStyle = hex2rgba(g.color, g.alpha * 1.5); ctx!.lineWidth = 1; ctx!.stroke();
          if (isActive) {
            ctx!.beginPath(); ctx!.arc(n.x, n.y, 14, 0, Math.PI * 2);
            ctx!.strokeStyle = hex2rgba(g.color, g.alpha * 0.8); ctx!.lineWidth = 0.6; ctx!.stroke();
          }
        });
      });

      // ── 6. SORTING BARS (animated swaps) ──
      sortVisuals.forEach(sv => {
        sv.swapTimer++;
        if (sv.swapTimer > 30) {
          sv.swapTimer = 0;
          const i = Math.floor(Math.random() * sv.bars.length);
          const j = Math.floor(Math.random() * sv.bars.length);
          const tmp = sv.bars[i].targetHeight;
          sv.bars[i].targetHeight = sv.bars[j].targetHeight;
          sv.bars[j].targetHeight = tmp;
        }
        sv.bars.forEach((bar, i) => {
          bar.height = lerp(bar.height, bar.targetHeight, 0.08);
          const bx = sv.x + i * (sv.barW + 2);
          const by = sv.y;
          ctx!.fillStyle = hex2rgba(sv.color, sv.alpha * (0.5 + bar.height / 80));
          ctx!.fillRect(bx, by - bar.height, sv.barW, bar.height);
          ctx!.strokeStyle = hex2rgba(sv.color, sv.alpha * 0.5);
          ctx!.lineWidth = 0.5;
          ctx!.strokeRect(bx, by - bar.height, sv.barW, bar.height);
        });
        // Base line
        ctx!.beginPath(); ctx!.moveTo(sv.x - 4, sv.y); ctx!.lineTo(sv.x + sv.bars.length * (sv.barW + 2) + 2, sv.y);
        ctx!.strokeStyle = hex2rgba(sv.color, sv.alpha * 0.6); ctx!.lineWidth = 0.8; ctx!.stroke();
      });

      // ── 7. STACKS (push/pop animation) ──
      stacks.forEach(st => {
        st.timer++;
        if (st.timer > 80) {
          st.timer = 0;
          if (st.pushing && st.blocks.length < 7) {
            st.blocks.push({ val: String(Math.floor(Math.random() * 99)), y: -20, targetY: st.blocks.length * 18 });
          } else if (!st.pushing && st.blocks.length > 1) {
            st.blocks.pop();
          }
          if (st.blocks.length >= 7) st.pushing = false;
          if (st.blocks.length <= 1) st.pushing = true;
        }
        // Draw bracket
        const stackH = st.blocks.length * 18 + 4;
        ctx!.strokeStyle = hex2rgba(st.color, st.alpha);
        ctx!.lineWidth = 1;
        ctx!.beginPath(); ctx!.moveTo(st.x - 16, st.y - stackH); ctx!.lineTo(st.x - 16, st.y + 2); ctx!.lineTo(st.x + 16, st.y + 2); ctx!.lineTo(st.x + 16, st.y - stackH);
        ctx!.stroke();
        // "STACK" label
        ctx!.font = "7px 'Space Grotesk',cursive"; ctx!.textAlign = 'center';
        ctx!.fillStyle = hex2rgba(st.color, st.alpha * 0.6);
        ctx!.fillText('STACK', st.x, st.y + 14);
        // Blocks
        st.blocks.forEach((b, i) => {
          b.y = lerp(b.y, b.targetY, 0.12);
          const by = st.y - b.y - 16;
          ctx!.fillStyle = hex2rgba(st.color, st.alpha * 0.4);
          ctx!.fillRect(st.x - 14, by, 28, 15);
          ctx!.strokeStyle = hex2rgba(st.color, st.alpha);
          ctx!.strokeRect(st.x - 14, by, 28, 15);
          ctx!.fillStyle = hex2rgba(st.color, st.alpha * 1.5);
          ctx!.font = "8px 'Space Grotesk',cursive"; ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
          ctx!.fillText(b.val, st.x, by + 8);
        });
      });

      // ── 8. HASH TABLE VISUALIZATIONS ──
      hashVisuals.forEach((hv, hvIdx) => {
        const ox = 100 + hvIdx * 350, oy = H * 0.7 + hvIdx * 80;
        hv.timer++;
        // Buckets
        hv.buckets.forEach((b, i) => {
          const bx = ox + i * 35, by = oy;
          ctx!.strokeStyle = hex2rgba(hv.color, hv.alpha); ctx!.lineWidth = 1;
          ctx!.strokeRect(bx, by, 28, 22);
          ctx!.fillStyle = hex2rgba(hv.color, hv.alpha * 0.5);
          ctx!.font = "7px 'Space Grotesk',cursive"; ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
          ctx!.fillText(`[${i}]`, bx + 14, by + 11);
          // Chained items
          b.items.forEach((item, j) => {
            const iy = by + 26 + j * 16;
            ctx!.strokeStyle = hex2rgba(hv.color, hv.alpha * 0.8);
            ctx!.strokeRect(bx + 2, iy, 24, 13);
            ctx!.fillStyle = hex2rgba(hv.color, hv.alpha * 1.2);
            ctx!.fillText(String(item), bx + 14, iy + 7);
            // Connector
            if (j === 0) {
              ctx!.beginPath(); ctx!.moveTo(bx + 14, by + 22); ctx!.lineTo(bx + 14, iy);
              ctx!.strokeStyle = hex2rgba(hv.color, hv.alpha * 0.5); ctx!.lineWidth = 0.7; ctx!.stroke();
            }
          });
        });
        // "HASH" label
        ctx!.fillStyle = hex2rgba(hv.color, hv.alpha * 0.5);
        ctx!.font = "7px 'Space Grotesk',cursive"; ctx!.textAlign = 'left';
        ctx!.fillText('HASH TABLE', ox, oy - 6);
      });

      // ── 9. BIG-O / DSA LABELS (floating) ──
      bigOLabels.forEach(label => {
        label.x += label.vx; label.y += label.vy;
        if (label.x < 0 || label.x > W) label.vx *= -1;
        if (label.y < 0 || label.y > H) label.vy *= -1;
        const breath = 0.7 + 0.3 * Math.sin(frame * 0.01 + label.breathPhase);
        ctx!.font = `${label.size}px 'Space Grotesk',cursive`;
        ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
        ctx!.fillStyle = hex2rgba(label.color, label.alpha * breath);
        ctx!.fillText(label.text, label.x, label.y);
      });

      // ── 10. ENERGY WAVES ──
      if (frame % 200 === 0) {
        energyWaves.push({ cx: Math.random() * W, cy: Math.random() * H, radius: 0, maxRadius: 120 + Math.random() * 150, color: randCol(), alpha: 0.08 });
      }
      energyWaves = energyWaves.filter(w => w.radius < w.maxRadius);
      energyWaves.forEach(w => {
        w.radius += 1;
        const fade = 1 - w.radius / w.maxRadius;
        ctx!.beginPath(); ctx!.arc(w.cx, w.cy, w.radius, 0, Math.PI * 2);
        ctx!.strokeStyle = hex2rgba(w.color, w.alpha * fade); ctx!.lineWidth = 1.5; ctx!.stroke();
      });

      // ── 11. PARTICLES with trails ──
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = hex2rgba(p.color, p.alpha); ctx!.fill();
      });

      // ── 12. SCAN LINE ──
      const scanY = (frame * 0.4) % H;
      const scanGrad = ctx!.createLinearGradient(0, scanY - 15, 0, scanY + 15);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(0.5, 'rgba(0,245,255,0.018)');
      scanGrad.addColorStop(1, 'transparent');
      ctx!.fillStyle = scanGrad;
      ctx!.fillRect(0, scanY - 15, W, 30);

      animId = requestAnimationFrame(draw);
    }

    const traceIv = setInterval(() => {
      const t = circuitTraces[Math.floor(Math.random() * circuitTraces.length)];
      if (t && t.progress < 0) { t.active = true; t.progress = 0; }
    }, 140);

    window.addEventListener('resize', resize);
    resize(); draw();
    return () => { cancelAnimationFrame(animId); clearInterval(traceIv); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />;
}
