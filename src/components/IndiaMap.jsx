"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";

/**
 * Canvas map of India's states that can draw tens of thousands of fire
 * points smoothly.
 *
 * props
 *  outlines        GeoJSON FeatureCollection of states
 *  points          [{ lat, lon, color, r, data }]  — drawn with additive glow
 *  cells           [{ lat, lon, v, color }]        — optional 0.25° squares (heat)
 *  cellSize        degrees (for cells)
 *  selected        state id to highlight
 *  onSelect(id)    click a state
 *  marker          { lat, lon, radiusKm } — "you are here" + search circle
 *  onPick(lat,lon) click anywhere (used by the "near me" tool)
 *  tooltip(p)      returns a node for the hovered point
 *  aspect          height / width
 */
export default function IndiaMap({
  outlines,
  points = [],
  cells = null,
  cellSize = 0.25,
  selected = null,
  onSelect,
  marker = null,
  onPick,
  tooltip,
  aspect = 1.08,
  glow = true,
  className = "",
}) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrap.current;
    const ro = new ResizeObserver(([e]) => {
      const w = Math.round(e.contentRect.width);
      setSize({ w, h: Math.round(w * aspect) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  const projection = useMemo(() => {
    if (!outlines || !size.w) return null;
    return d3.geoMercator().fitExtent(
      [
        [8, 8],
        [size.w - 8, size.h - 8],
      ],
      outlines
    );
  }, [outlines, size]);

  // Project once per data / size change; quadtree for hover.
  const projected = useMemo(() => {
    if (!projection) return [];
    return points.map((p) => {
      const [x, y] = projection([p.lon, p.lat]);
      return { ...p, x, y };
    });
  }, [points, projection]);
  const tree = useMemo(() => d3.quadtree(projected.filter((d) => d.data), (d) => d.x, (d) => d.y), [projected]);

  useEffect(() => {
    const c = canvas.current;
    if (!c || !projection) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    const ctx = c.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);
    const path = d3.geoPath(projection, ctx);

    // States
    for (const f of outlines.features) {
      ctx.beginPath();
      path(f);
      ctx.fillStyle = f.id === selected ? "#2c1b14" : "#1b1e24";
      ctx.fill();
    }
    ctx.lineWidth = 0.6;
    ctx.strokeStyle = "#3a3f49";
    for (const f of outlines.features) {
      ctx.beginPath();
      path(f);
      ctx.stroke();
    }

    // Heat cells
    if (cells) {
      for (const cl of cells) {
        const [x0, y0] = projection([cl.lon - cellSize / 2, cl.lat + cellSize / 2]);
        const [x1, y1] = projection([cl.lon + cellSize / 2, cl.lat - cellSize / 2]);
        ctx.fillStyle = cl.color;
        ctx.fillRect(x0, y0, Math.max(1, x1 - x0 + 0.4), Math.max(1, y1 - y0 + 0.4));
      }
    }

    // Fire points — additive so clusters glow
    if (projected.length) {
      ctx.globalCompositeOperation = glow ? "lighter" : "source-over";
      for (const p of projected) {
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha ?? 0.75;
        ctx.arc(p.x, p.y, p.r ?? 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }

    // Selected state outline on top
    if (selected != null) {
      const f = outlines.features.find((x) => x.id === selected);
      if (f) {
        ctx.beginPath();
        path(f);
        ctx.lineWidth = 1.6;
        ctx.strokeStyle = "#ff8a3d";
        ctx.stroke();
      }
    }

    // You-are-here marker + search radius
    if (marker) {
      const [mx, my] = projection([marker.lon, marker.lat]);
      if (marker.radiusKm) {
        const circle = d3.geoCircle().center([marker.lon, marker.lat]).radius(marker.radiusKm / 111.2)();
        ctx.beginPath();
        path(circle);
        ctx.fillStyle = "rgba(124,192,255,0.08)";
        ctx.fill();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(124,192,255,0.8)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.beginPath();
      ctx.arc(mx, my, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#7cc0ff";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#0a0b0d";
      ctx.stroke();
    }
  }, [projection, outlines, projected, cells, cellSize, selected, marker, size, glow]);

  const locate = (e) => {
    const b = canvas.current.getBoundingClientRect();
    return [e.clientX - b.left, e.clientY - b.top];
  };
  const onMove = (e) => {
    if (!tooltip || !tree.size()) return;
    const [x, y] = locate(e);
    const p = tree.find(x, y, 10);
    setHover(p ? { p, x, y } : null);
  };
  const onClick = (e) => {
    if (!projection) return;
    const [x, y] = locate(e);
    const [lon, lat] = projection.invert([x, y]);
    if (onPick) onPick(lat, lon);
    if (onSelect) {
      const f = outlines.features.find((ft) => d3.geoContains(ft, [lon, lat]));
      onSelect(f ? (f.id === selected ? null : f.id) : null);
    }
  };

  return (
    <div ref={wrap} className={`relative w-full ${className}`} style={{ height: size.h || undefined }}>
      <canvas
        ref={canvas}
        style={{ width: size.w, height: size.h }}
        className={onSelect || onPick ? "cursor-crosshair" : ""}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onClick={onClick}
        role="img"
        aria-label="Map of India showing fire detections"
      />
      {hover && tooltip && (
        <div
          className="pointer-events-none absolute z-10 w-max max-w-[16rem] rounded-xl border border-edge bg-ink/95 px-3 py-2 text-sm shadow-xl backdrop-blur"
          style={{
            left: Math.min(hover.x + 14, size.w - 200),
            top: Math.max(hover.y - 10, 0),
          }}
        >
          {tooltip(hover.p.data)}
        </div>
      )}
    </div>
  );
}
