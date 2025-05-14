'use client';

import React, { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });

export default function ForceGraph({ nodes, links }) {
  const fgRef = useRef();
  const [is3D, setIs3D] = useState(false);

  // Helper to normalize IDs to string with .0
  function normalizeId(id) {
    if (typeof id === 'number') return id + '.0';
    if (typeof id === 'string') {
      if (id.endsWith('.0')) return id;
      if (/^\d+$/.test(id)) return id + '.0';
      return id;
    }
    return String(id);
  }
  const nodeIds = new Set(nodes.map(node => normalizeId(node.id)));
  const filteredLinks = links
    .filter(link => nodeIds.has(normalizeId(link.source)) && nodeIds.has(normalizeId(link.target)))
    .map(link => ({
      ...link,
      source: normalizeId(link.source),
      target: normalizeId(link.target)
    }));

  // Build a set of node IDs actually referenced by filtered links
  const referencedNodeIds = new Set();
  filteredLinks.forEach(link => {
    referencedNodeIds.add(normalizeId(link.source));
    referencedNodeIds.add(normalizeId(link.target));
  });

  // Filter nodes to only those referenced by links
  const filteredNodes = nodes.filter(node => referencedNodeIds.has(normalizeId(node.id)));

  // Preload the person icon image
  const personImgRef = useRef();
  useEffect(() => {
    const img = new window.Image();
    img.src = '/man.png';
    personImgRef.current = img;
  }, []);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400);
    }

    // Log missing node references
    links.forEach(link => {
      if (!nodeIds.has(normalizeId(link.source)) || !nodeIds.has(normalizeId(link.target))) {
        console.warn('Link with missing node:', link);
      }
    });
  }, [nodes, links, is3D]);

  const GraphComponent = is3D ? ForceGraph3D : ForceGraph2D;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg text-white">Transaction Graph ({is3D ? '3D' : '2D'} Mode)</h2>
        <button
          onClick={() => setIs3D(prev => !prev)}
          className="px-4 py-1 rounded bg-gray-800 text-white hover:bg-gray-700 transition"
        >
          Switch to {is3D ? '2D' : '3D'}
        </button>
      </div>

      <div className="h-[600px] bg-black rounded">
        <GraphComponent
          ref={fgRef}
          graphData={{ nodes: filteredNodes, links: filteredLinks }}
          nodeAutoColorBy={null}
          nodeColor={undefined}
          nodeCanvasObject={
            is3D ? undefined : (node, ctx) => {
              const size = 20;
              const img = personImgRef.current;
              if (img && img.complete) {
                ctx.save();
                ctx.drawImage(img, node.x - size / 2, node.y - size / 2, size, size);
                ctx.restore();
              } else {
                ctx.beginPath();
                ctx.arc(node.x, node.y, size / 2, 0, 2 * Math.PI, false);
                ctx.fillStyle = '#888';
                ctx.fill();
              }
            }
          }
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkWidth={link => link.anomaly ? 2 : link.fraud ? 3 : 1}
          linkColor={link => link.anomaly ? '#ffa500' : link.fraud ? '#ff0000' : '#ffffff'}
          linkLabel={link => `${link.weight} USD`}
          nodeLabel={node => node.label || node.id}
          backgroundColor="#000000"
          onNodeDragEnd={node => {
            node.fx = node.x;
            node.fy = node.y;
          }}
          cooldownTicks={100}
        />
      </div>
    </div>
  );
}