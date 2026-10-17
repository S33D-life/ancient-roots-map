import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { roster, type CompanionKey } from './registry';

/** Plain doorway frames, not substitute portraits or verified field geometry. */
export function SpatialCouncil({ open }: { open: (key: CompanionKey) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState('Preparing the spatial study…');
  useEffect(() => {
    const target = host.current;
    if (!target) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { setStatus('3D unavailable on this device. All ten companion doorways remain available below.'); return; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, .1, 80);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.domElement.setAttribute('aria-label', 'Ten plain companion frames in roster order, five above and five below. Readable named doorways follow.');
    renderer.domElement.setAttribute('role', 'img');
    target.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xfff2cd, 0x354938, 3));
    const material = (color: number) => new THREE.MeshStandardMaterial({ color, roughness: .92 });
    const wood = material(0x795a3c), green = material(0x527d54), red = material(0xa74335), cream = material(0xf0debd), fieldMaterial=material(0x23392e);
    const hits: THREE.Mesh[] = [];
    function mesh(geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, key: CompanionKey) {
      const m = new THREE.Mesh(geometry, mat); m.position.set(x,y,z); m.userData.key=key; scene.add(m); hits.push(m); return m;
    }
    roster.forEach((c,index)=>{
      const x=(index%5-2)*2, y=index<5?2.6:0, key=c.key as CompanionKey;
      mesh(new THREE.BoxGeometry(1.85,2.1,.09),wood,x,y,-.72,key);
      mesh(new THREE.BoxGeometry(1.63,1.88,.1),fieldMaterial,x,y,-.65,key);
      // Reuse the two reviewed pilot presences; no new portraits or bespoke models.
      if(key==='noku'){
        mesh(new THREE.CylinderGeometry(.12,.2,1.05,10),wood,x,y-.15,0,key);
        mesh(new THREE.SphereGeometry(.48,16,10),green,x,y+.46,0,key);
      }
      if(key==='fly-agaric'){
        mesh(new THREE.CylinderGeometry(.11,.17,.65,12),cream,x,y-.24,0,key);
        const cap=mesh(new THREE.SphereGeometry(.52,20,12,0,Math.PI*2,0,Math.PI/2),red,x,y+.1,0,key);cap.scale.y=.66;
      }
    });
    const resize = () => {
      const w=target.clientWidth;
      renderer.setSize(w,340); camera.aspect=w/340;
      camera.position.set(0,1.3,Math.max(9,5.2/Math.tan(THREE.MathUtils.degToRad(21))/camera.aspect));
      camera.lookAt(0,1.3,0); camera.updateProjectionMatrix(); renderer.render(scene,camera);
    };
    const observer = new ResizeObserver(resize); observer.observe(target); resize();
    const ray = new THREE.Raycaster();
    const select = (event: MouseEvent) => {
      const r=renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(new THREE.Vector2((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1),camera);
      const hit=ray.intersectObjects(hits)[0]; if(hit) open(hit.object.userData.key as CompanionKey);
    };
    renderer.domElement.addEventListener('click',select);
    setStatus('Spatial study ready · ten companion frames. Tap a frame or a presence.');
    return () => {
      observer.disconnect(); renderer.domElement.removeEventListener('click',select);
      const materials=new Set<THREE.Material>();
      scene.traverse(o=>{ if(o instanceof THREE.Mesh) {o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));} });
      materials.forEach(m=>m.dispose());renderer.dispose();renderer.domElement.remove();
    };
  }, [open]);
  return <><div className="spatial" ref={host} data-testid="spatial-council" /><p role="status">{status}</p><p className="muted">Plain frames awaiting approved portraits, with the existing two interpretive presences. All ten named doorways and readable introductions follow.</p></>;
}
