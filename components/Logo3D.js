"use client";
import { useEffect, useRef, useState } from "react";
import LogoMark from "./LogoMark";

export default function Logo3D({ size = 32 }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let disposed = false;
    let frameId;
    let cleanupFns = [];

    async function setup() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      let THREE;
      try {
        THREE = await import("three");
      } catch (e) {
        setFailed(true);
        return;
      }

      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      } catch (e) {
        setFailed(true);
        return;
      }
      if (disposed) { renderer.dispose(); return; }

      const DPR = Math.min(window.devicePixelRatio || 1, 2) * 2;
      renderer.setPixelRatio(DPR);
      renderer.setSize(size, size, false);

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
      camera.position.set(0, 0, 5.4);

      const group = new THREE.Group();
      scene.add(group);

      // soft additive glow behind the mark, same technique as the marketing site
      const gc = document.createElement("canvas");
      gc.width = gc.height = 128;
      const gctx = gc.getContext("2d");
      const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, "rgba(255,255,255,0.85)");
      grad.addColorStop(0.4, "rgba(255,255,255,0.22)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      gctx.fillStyle = grad;
      gctx.fillRect(0, 0, 128, 128);
      const glowTex = new THREE.CanvasTexture(gc);
      const glowSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.5
      }));
      glowSprite.scale.set(3.1, 3.1, 1);
      scene.add(glowSprite);

      // Fibonacci-distributed node sphere, same density-per-size as the marketing mark
      const NODE_COUNT = 46;
      const nodes = [];
      const GOLDEN = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < NODE_COUNT; i++) {
        const y = 1 - (i / (NODE_COUNT - 1)) * 2;
        const rY = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = GOLDEN * i;
        const r = 1.25 + (Math.random() - 0.5) * 0.25;
        const bx = Math.cos(theta) * rY * r, by = y * r, bz = Math.sin(theta) * rY * r;
        nodes.push({
          base: new THREE.Vector3(bx, by, bz),
          cur: new THREE.Vector3(bx, by, bz),
          amp: 0.16 + Math.random() * 0.16,
          fx: 0.12 + Math.random() * 0.22,
          fy: 0.12 + Math.random() * 0.22,
          fz: 0.12 + Math.random() * 0.22,
          px: Math.random() * Math.PI * 2,
          py: Math.random() * Math.PI * 2,
          pz: Math.random() * Math.PI * 2
        });
      }

      const edgeIdx = [];
      const es = {};
      nodes.forEach((p, ii) => {
        nodes
          .map((q, jj) => ({ j: jj, d: ii === jj ? Infinity : p.base.distanceTo(q.base) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 3)
          .forEach((d) => {
            const k = ii < d.j ? ii + "_" + d.j : d.j + "_" + ii;
            if (!es[k]) { es[k] = 1; edgeIdx.push([ii, d.j]); }
          });
      });

      const edgePositions = new Float32Array(edgeIdx.length * 6);
      const eg = new THREE.BufferGeometry();
      const edgeAttr = new THREE.BufferAttribute(edgePositions, 3);
      eg.setAttribute("position", edgeAttr);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xd6d6dc, transparent: true, opacity: 0.72 });
      const lines = new THREE.LineSegments(eg, lineMat);
      group.add(lines);

      const dimMat = new THREE.MeshBasicMaterial({ color: 0xd6d6dc });
      const brightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const activeIdx = {};
      let activeCount = 0;
      while (activeCount < 8) {
        const pick = Math.floor(Math.random() * NODE_COUNT);
        if (!activeIdx[pick]) { activeIdx[pick] = 1; activeCount++; }
      }
      const geoms = [];
      const meshes = [];
      nodes.forEach((n, ii) => {
        const active = !!activeIdx[ii];
        const s = active ? 0.075 + Math.random() * 0.03 : 0.032 + Math.random() * 0.026;
        const geo = new THREE.SphereGeometry(s, 7, 7);
        geoms.push(geo);
        const m = new THREE.Mesh(geo, active ? brightMat : dimMat);
        m.userData = { active, phase: Math.random() * Math.PI * 2, node: n };
        group.add(m);
        meshes.push(m);
      });
      const hubGeo = new THREE.SphereGeometry(0.09, 10, 10);
      geoms.push(hubGeo);
      const hub = new THREE.Mesh(hubGeo, brightMat);
      hub.userData = { active: true, phase: 0, node: null };
      group.add(hub);
      meshes.push(hub);

      let speed = 0.005, targetSpeed = 0.005, t = 0;
      const wrap = wrapRef.current;
      function onEnter() { targetSpeed = 0.026; }
      function onLeave() { targetSpeed = 0.005; }
      if (wrap) {
        wrap.addEventListener("mouseenter", onEnter);
        wrap.addEventListener("mouseleave", onLeave);
        cleanupFns.push(() => {
          wrap.removeEventListener("mouseenter", onEnter);
          wrap.removeEventListener("mouseleave", onLeave);
        });
      }

      function animate() {
        if (disposed) return;
        t += 0.016;
        speed += (targetSpeed - speed) * 0.06;
        group.rotation.y += speed;
        group.rotation.x = Math.sin(t * 0.15) * 0.16;

        nodes.forEach((n) => {
          n.cur.set(
            n.base.x + Math.sin(t * n.fx + n.px) * n.amp,
            n.base.y + Math.sin(t * n.fy + n.py) * n.amp,
            n.base.z + Math.sin(t * n.fz + n.pz) * n.amp
          );
        });
        meshes.forEach((m) => {
          if (m.userData.node) m.position.copy(m.userData.node.cur);
          if (m.userData.active) m.scale.setScalar(1 + Math.sin(t * 2 + m.userData.phase) * 0.25);
        });
        const arr = edgeAttr.array;
        for (let e = 0; e < edgeIdx.length; e++) {
          const a = nodes[edgeIdx[e][0]].cur, b = nodes[edgeIdx[e][1]].cur, o = e * 6;
          arr[o] = a.x; arr[o + 1] = a.y; arr[o + 2] = a.z;
          arr[o + 3] = b.x; arr[o + 4] = b.y; arr[o + 5] = b.z;
        }
        edgeAttr.needsUpdate = true;

        renderer.render(scene, camera);
        frameId = requestAnimationFrame(animate);
      }
      animate();

      cleanupFns.push(() => {
        if (frameId) cancelAnimationFrame(frameId);
        renderer.dispose();
        eg.dispose();
        lineMat.dispose();
        dimMat.dispose();
        brightMat.dispose();
        glowTex.dispose();
        geoms.forEach((g) => g.dispose());
      });
    }

    setup();

    return () => {
      disposed = true;
      cleanupFns.forEach((fn) => fn());
    };
  }, [size]);

  if (failed) return <LogoMark size={size} />;

  return (
    <span ref={wrapRef} className="iv-logo3d-wrap" style={{ width: size, height: size }}>
      <canvas ref={canvasRef} width={size} height={size} style={{ width: size, height: size, display: "block" }} />
    </span>
  );
}
