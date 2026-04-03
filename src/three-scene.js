import * as THREE from 'three';

export default function initThree() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 22);

  // ── Lights ──
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const pLight = new THREE.PointLight(0x6C8EF5, 2, 40);
  pLight.position.set(5, 8, 10);
  scene.add(pLight);
  const pLight2 = new THREE.PointLight(0xB8E4E4, 1.5, 40);
  pLight2.position.set(-8, -4, 6);
  scene.add(pLight2);

  // ── Neural Network ──
  const NODE_COUNT  = 60;
  const LINK_DIST   = 5.5;   // max distance to draw an edge
  const SPREAD      = 10;

  // Node positions
  const nodePositions = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodePositions.push(new THREE.Vector3(
      (Math.random() - 0.5) * SPREAD * 2,
      (Math.random() - 0.5) * SPREAD,
      (Math.random() - 0.5) * SPREAD
    ));
  }

  // Node velocities (slow drift)
  const nodeVelocities = nodePositions.map(() => new THREE.Vector3(
    (Math.random() - 0.5) * 0.008,
    (Math.random() - 0.5) * 0.008,
    (Math.random() - 0.5) * 0.005
  ));

  // Node meshes
  const nodeColors = [0x6C8EF5, 0xB8E4E4, 0xE8D8F8, 0x8EA0FF, 0x9FEFE0];
  const nodeMeshes = nodePositions.map((pos, i) => {
    const size = 0.10 + Math.random() * 0.18;
    const geo  = new THREE.SphereGeometry(size, 10, 10);
    const mat  = new THREE.MeshPhysicalMaterial({
      color: nodeColors[i % nodeColors.length],
      emissive: nodeColors[i % nodeColors.length],
      emissiveIntensity: 0.4,
      roughness: 0.2,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    scene.add(mesh);
    return mesh;
  });

  // Edges — LineSegments (rebuild each frame for moving nodes)
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x6C8EF5,
    transparent: true,
    opacity: 0.18,
    vertexColors: false,
  });
  let edgeMesh = null;

  function buildEdges() {
    const verts = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < LINK_DIST) {
          // fade opacity by distance — encode via alpha later
          verts.push(
            nodePositions[i].x, nodePositions[i].y, nodePositions[i].z,
            nodePositions[j].x, nodePositions[j].y, nodePositions[j].z
          );
        }
      }
    }
    if (edgeMesh) {
      scene.remove(edgeMesh);
      edgeMesh.geometry.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    edgeMesh = new THREE.LineSegments(geo, edgeMat);
    scene.add(edgeMesh);
  }

  buildEdges();

  // ── Pulse rings — highlight a random node every 1.5s ──
  const PULSE_COUNT = 3;
  const pulses = Array.from({ length: PULSE_COUNT }, () => {
    const geo  = new THREE.RingGeometry(0.15, 0.22, 20);
    const mat  = new THREE.MeshBasicMaterial({
      color: 0x6C8EF5,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { active: false, t: 0, nodeIdx: 0 };
    scene.add(mesh);
    return mesh;
  });

  let pulseTimer = 0;
  let pulseIdx   = 0;
  function triggerPulse() {
    const p = pulses[pulseIdx % PULSE_COUNT];
    const ni = Math.floor(Math.random() * NODE_COUNT);
    p.position.copy(nodePositions[ni]);
    p.scale.set(1, 1, 1);
    p.material.opacity = 0.9;
    p.userData = { active: true, t: 0, nodeIdx: ni };
    pulseIdx++;
  }

  // ── Mouse parallax ──
  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', e => {
    mouse.x = (e.clientX / window.innerWidth)  *  2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * -2 + 1;
  });

  // ── Resize ──
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ── Animate ──
  let t = 0;
  let edgeRebuildCounter = 0;

  function animate() {
    t += 0.012;
    edgeRebuildCounter++;

    // drift nodes
    for (let i = 0; i < NODE_COUNT; i++) {
      nodePositions[i].add(nodeVelocities[i]);

      // bounce off bounding box
      ['x','y','z'].forEach(axis => {
        const limit = axis === 'x' ? SPREAD : axis === 'y' ? SPREAD * 0.5 : SPREAD * 0.5;
        if (Math.abs(nodePositions[i][axis]) > limit) {
          nodeVelocities[i][axis] *= -1;
        }
      });

      nodeMeshes[i].position.copy(nodePositions[i]);
    }

    // rebuild edges every 3 frames (performance balance)
    if (edgeRebuildCounter % 3 === 0) buildEdges();

    // camera slow drift + parallax
    camera.position.x += (mouse.x * 1.8 - camera.position.x) * 0.025;
    camera.position.y += (mouse.y * 1.2 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, 0);

    // pulse animation
    pulseTimer += 0.016;
    if (pulseTimer > 0.9) { pulseTimer = 0; triggerPulse(); }

    pulses.forEach(p => {
      if (!p.userData.active) return;
      p.userData.t += 0.05;
      const pt = p.userData.t;
      p.scale.set(1 + pt * 3, 1 + pt * 3, 1);
      p.material.opacity = Math.max(0, 0.9 - pt * 1.1);
      p.lookAt(camera.position);
      if (pt > 0.85) p.userData.active = false;
    });

    // subtle node pulse glow
    nodeMeshes.forEach((m, i) => {
      m.material.emissiveIntensity = 0.3 + Math.sin(t * 1.2 + i * 0.7) * 0.2;
    });

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}
