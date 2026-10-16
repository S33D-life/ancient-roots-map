import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { PilotKey } from './registry';

/** Local interpretive geometry only. No field geometry, remote models, photos or network. */
export function SpatialCouncil({ open }: { open: (key: PilotKey) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Preparing the spatial study…');
  useEffect(() => {
    const target = host.current;
    if (!target) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setStatus('3D unavailable on this device. Both companion doorways remain available below.'); return; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 40);
    camera.position.set(0, 2.4, 8); camera.lookAt(0, 1, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.setAttribute('aria-label', 'Interpretive tree on the left, fungus on the right. Accessible companion doorways follow.');
    renderer.domElement.setAttribute('role', 'img');
    target.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xfff2cd, 0x354938, 3));
    const material = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .92 });
    const wood = material(0x795a3c), green = material(0x527d54), red = material(0xa74335), cream = material(0xf0debd);
    const hits: THREE.Mesh[] = [];
    function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, key: PilotKey) {
      const m = new THREE.Mesh(geometry, mat); m.position.set(x, y, 0); m.userData.key = key; scene.add(m); hits.push(m); return m;
    }
    mesh(new THREE.CylinderGeometry(.18,.29,1.7,10), wood,-1.35,.9,'noku');
    mesh(new THREE.SphereGeometry(.83,16,10),green,-1.35,2,'noku');
    mesh(new THREE.CylinderGeometry(.13,.22,.9,12),cream,1.35,.53,'fly-agaric');
    const cap=mesh(new THREE.SphereGeometry(.65,20,12,0,Math.PI*2,0,Math.PI/2),red,1.35,1,'fly-agaric'); cap.scale.y=.66;
    // Text portraits are intentionally absent; these are plain doorway frames, not replacement artwork.
    for (const [x,key] of [[-1.35,'noku'],[1.35,'fly-agaric']] as const) {
      const frame=mesh(new THREE.BoxGeometry(1.95,2.85,.09),wood,x,1.35,key); frame.position.z=-.72;
      const field=mesh(new THREE.BoxGeometry(1.74,2.64,.1),material(0x23392e),x,1.35,key); field.position.z=-.65;
    }
    const resize = () => { const w=target.clientWidth; renderer.setSize(w,320); camera.aspect=w/320; camera.updateProjectionMatrix(); renderer.render(scene,camera); };
    const observer = new ResizeObserver(resize); observer.observe(target); resize();
    const ray = new THREE.Raycaster();
    const select = (event: MouseEvent) => {
      const r=renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1),camera);
      const hit=ray.intersectObjects(hits)[0]; if(hit) open(hit.object.userData.key as PilotKey);
    };
    renderer.domElement.addEventListener('click',select);
    setStatus('Spatial study ready · tap either presence or its frame.');
    return () => {
      observer.disconnect(); renderer.domElement.removeEventListener('click',select);
      scene.traverse(o=>{ if(o instanceof THREE.Mesh) { o.geometry.dispose(); const m=Array.isArray(o.material)?o.material:[o.material]; m.forEach(v=>v.dispose()); } });
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [open]);
  return <><div className="spatial" ref={host} data-testid="spatial-council" /><p role="status">{status}</p><p className="muted">Simple portal geometry, not Noku’s digital twin or a field observation. Portrait artwork is pending.</p></>;
}
