// Thế giới 3D (Three.js): chỉ ĐỌC trạng thái logic để vẽ, không đổi luật.
import * as THREE from 'three';

const C = {
  night: new THREE.Color(0x0b0a1f),
  dusk: new THREE.Color(0x2a1f3f),
  groundDark: new THREE.Color(0x1f2b3a),
  groundWarm: new THREE.Color(0x4f6b3c),
  warm: 0xffa640,
  warmSoft: 0xffd27a,
  ink: 0x14081f,
  inkGlow: 0x5b1e8c,
  stunned: 0x9c8fb0,
  cloud: 0x3b3466,
};

export function createWorld(container, cfg, level) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = C.night.clone();
  scene.fog = new THREE.Fog(C.night.clone(), 30, 120);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(0, 6, -10);

  const hemi = new THREE.HemisphereLight(0x7a6ad0, 0x1a1030, 0.6);
  scene.add(hemi);
  const moon = new THREE.DirectionalLight(0xa9b4ff, 0.5);
  moon.position.set(-30, 60, -20);
  scene.add(moon);

  buildIsland(scene, level);
  buildSky(scene);
  const groundMat = scene.getObjectByName('ground').material;

  // ---------- Mây ----------
  const player = buildPlayer();
  scene.add(player.group);

  // ---------- Đèn Lồng Lớn ----------
  const lanternViews = new Map();

  // ---------- Đom đóm & Bóng Mực ----------
  const moteGeo = new THREE.SphereGeometry(0.14, 10, 8);
  const moteMat = new THREE.MeshBasicMaterial({ color: 0xfff1a0 });
  const haloGeo = new THREE.SphereGeometry(0.4, 12, 10);
  const haloMat = new THREE.MeshBasicMaterial({
    color: C.warmSoft, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const moteViews = new Map();
  const shadeViews = new Map();
  const shadeGeo = new THREE.SphereGeometry(0.7, 20, 16);
  const tailGeo = new THREE.ConeGeometry(0.5, 1.0, 16);
  const eyeGeo = new THREE.SphereGeometry(0.09, 8, 6);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xe4c8ff });

  // ---------- Hiệu ứng ----------
  const effects = [];
  const ringGeo = new THREE.RingGeometry(0.85, 1, 64);

  let litFlash = 0;
  let hitFlash = 0;
  let lastPlayerPos = new THREE.Vector3();
  let facing = 0;
  const camPos = new THREE.Vector3(0, 6, -10);
  let time = 0;

  function clearMap(map) {
    for (const v of map.values()) scene.remove(v.group ?? v);
    map.clear();
  }

  function reset(s) {
    clearMap(moteViews);
    clearMap(shadeViews);
    for (const v of lanternViews.values()) scene.remove(v.group);
    lanternViews.clear();
    for (const l of s.lanterns) {
      const v = buildLantern(cfg);
      v.group.position.set(l.x, l.y, l.z);
      scene.add(v.group);
      lanternViews.set(l.id, v);
    }
    for (const e of effects) scene.remove(e.mesh);
    effects.length = 0;
    lastPlayerPos.set(s.player.x, s.player.y, s.player.z);
    facing = 0;
    litFlash = 0;
    hitFlash = 0;
  }

  function syncMotes(s) {
    const alive = new Set();
    for (const m of s.motes) {
      alive.add(m.id);
      let v = moteViews.get(m.id);
      if (!v) {
        v = new THREE.Group();
        v.add(new THREE.Mesh(moteGeo, moteMat));
        v.add(new THREE.Mesh(haloGeo, haloMat));
        v.userData.phase = hash(m.id);
        scene.add(v);
        moteViews.set(m.id, v);
      }
      v.position.set(m.x, 0.55 + 0.18 * Math.sin(time * 2.2 + v.userData.phase), m.z);
    }
    for (const [id, v] of moteViews) {
      if (!alive.has(id)) {
        scene.remove(v);
        moteViews.delete(id);
      }
    }
  }

  function syncShades(s) {
    const alive = new Set();
    for (const sh of s.shades) {
      alive.add(sh.id);
      let v = shadeViews.get(sh.id);
      if (!v) {
        v = buildShade(shadeGeo, tailGeo, eyeGeo, eyeMat);
        v.phase = hash(sh.id);
        scene.add(v.group);
        shadeViews.set(sh.id, v);
      }
      const stunned = sh.state === 'stunned';
      const bob = 0.12 * Math.sin(time * 3 + v.phase);
      v.group.position.set(sh.x, sh.y + bob, sh.z);
      v.group.lookAt(s.player.x, sh.y + bob, s.player.z);
      v.body.material.color.setHex(stunned ? C.stunned : C.ink);
      v.body.material.emissive.setHex(stunned ? 0x6c6280 : C.inkGlow);
      v.body.material.emissiveIntensity = stunned ? 0.25 : 0.55 + 0.25 * Math.sin(time * 5 + v.phase);
      const sc = stunned ? 0.8 + 0.05 * Math.sin(time * 20) : 1;
      v.group.scale.setScalar(sc);
      v.group.rotation.z = stunned ? 0.3 * Math.sin(time * 12) : 0;
    }
    for (const [id, v] of shadeViews) {
      if (!alive.has(id)) {
        scene.remove(v.group);
        shadeViews.delete(id);
      }
    }
  }

  function syncLanterns(s) {
    let lit = 0;
    for (const l of s.lanterns) {
      const v = lanternViews.get(l.id);
      if (!v) continue;
      v.group.position.set(l.x, l.y, l.z);
      const fill = Math.min(1, l.deposited / cfg.lantern_cost);
      if (l.lit) {
        lit++;
        const flicker = 1 + 0.06 * Math.sin(time * 9 + hash(l.id)) + 0.04 * Math.sin(time * 23);
        v.lamp.material.emissive.setHex(C.warm);
        v.lamp.material.emissiveIntensity = 1.6 * flicker;
        v.light.intensity = 40 * flicker;
        v.zone.material.opacity = 0.28;
        v.disc.material.opacity = 0.12;
      } else {
        v.lamp.material.emissive.setHex(0xff8a30);
        v.lamp.material.emissiveIntensity = 0.05 + 0.5 * fill;
        v.light.intensity = 6 * fill;
        v.zone.material.opacity = 0;
        v.disc.material.opacity = 0;
      }
    }
    // Đảo sáng dần lên theo số đèn đã thắp.
    const k = lit / Math.max(1, s.lanterns.length);
    hemi.intensity = 0.6 + 1.2 * k + litFlash;
    scene.background.lerpColors(C.night, C.dusk, k);
    scene.fog.color.copy(scene.background);
    scene.fog.far = 120 + 80 * k;
    groundMat.color.lerpColors(C.groundDark, C.groundWarm, k);
    return lit;
  }

  function syncPlayer(s, dt) {
    const p = s.player;
    const g = player.group;
    g.position.set(p.x, p.y, p.z);
    const dx = p.x - lastPlayerPos.x;
    const dz = p.z - lastPlayerPos.z;
    if (dx * dx + dz * dz > 1e-6) {
      const target = Math.atan2(dx, dz);
      let diff = target - facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      facing += diff * Math.min(1, dt * 12);
      player.body.position.y = 0.65 + Math.abs(Math.sin(time * 12)) * 0.06; // nhún khi chạy
    } else {
      player.body.position.y = 0.65;
    }
    g.rotation.y = facing;
    lastPlayerPos.set(p.x, p.y, p.z);

    // Đèn nhỏ trên nón sáng theo số đom đóm đang mang.
    const carry = p.carried / cfg.carry_capacity;
    player.light.intensity = 3 + 14 * carry;
    player.bulb.material.emissiveIntensity = 0.6 + 1.6 * carry;
    player.bulb.position.x = 0.0 + 0.04 * Math.sin(time * 4); // đung đưa
    // Nhấp nháy khi đang bất tử.
    g.visible = !(p.invuln > 0 && Math.floor(time * 15) % 2 === 0);
  }

  function syncCamera(s, yawDeg, dt) {
    const th = (yawDeg * Math.PI) / 180;
    const fx = Math.sin(th);
    const fz = Math.cos(th);
    const p = s.player;
    const target = new THREE.Vector3(p.x, p.y + 1.3, p.z);
    const want = new THREE.Vector3(p.x - fx * 9, p.y + 5, p.z - fz * 9);
    camPos.lerp(want, 1 - Math.exp(-dt * 10));
    if (hitFlash > 0) camPos.add(new THREE.Vector3(Math.sin(time * 60), 0, Math.cos(time * 55)).multiplyScalar(0.08 * hitFlash));
    camera.position.copy(camPos);
    camera.lookAt(target);
  }

  function updateEffects(dt) {
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      e.t += dt;
      const k = e.t / e.dur;
      if (k >= 1) {
        scene.remove(e.mesh);
        effects.splice(i, 1);
        continue;
      }
      e.mesh.scale.setScalar(0.5 + (e.radius - 0.5) * k);
      e.mesh.material.opacity = e.opacity * (1 - k);
    }
    litFlash = Math.max(0, litFlash - dt * 1.5);
    hitFlash = Math.max(0, hitFlash - dt * 3);
  }

  return {
    renderer,
    reset,
    pulse(s) {
      const mat = new THREE.MeshBasicMaterial({
        color: C.warmSoft, transparent: true, opacity: 0.8, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      const mesh = new THREE.Mesh(ringGeo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(s.player.x, 0.08, s.player.z);
      scene.add(mesh);
      effects.push({ mesh, t: 0, dur: 0.45, radius: cfg.pulse_radius, opacity: 0.8 });
    },
    lanternLit() {
      litFlash = 0.8;
    },
    hit() {
      hitFlash = 1;
    },
    // cam (tùy chọn): { pos: [x, y, z], lookAt: [x, y, z] } ghi đè camera bám theo Mây (dùng cho bench).
    frame(s, yawDeg, dt, cam = null) {
      time += dt;
      syncLanterns(s);
      syncMotes(s);
      syncShades(s);
      syncPlayer(s, dt);
      if (cam) {
        camera.position.set(...cam.pos);
        camera.lookAt(...cam.lookAt);
      } else {
        syncCamera(s, yawDeg, dt);
      }
      updateEffects(dt);
      renderer.render(scene, camera);
    },
    resize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    },
  };
}

// ---------------------------------------------------------------------------

function hash(id) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 1000;
  return h / 159;
}

function buildIsland(scene, level) {
  const R = level.radius;
  const ground = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R * 0.82, 4, 72),
    new THREE.MeshStandardMaterial({ color: C.groundDark.clone(), roughness: 0.95 }),
  );
  ground.name = 'ground';
  ground.position.y = -2;
  scene.add(ground);

  const rock = new THREE.Mesh(
    new THREE.ConeGeometry(R * 0.82, 22, 40),
    new THREE.MeshStandardMaterial({ color: 0x1c1726, roughness: 1 }),
  );
  rock.rotation.x = Math.PI;
  rock.position.y = -4 - 11;
  scene.add(rock);

  // Viền đá quanh mép đảo (người chơi bị chặn ở bán kính R).
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(R, 0.25, 8, 96),
    new THREE.MeshStandardMaterial({ color: 0x5a4f6b, roughness: 0.8 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.05;
  scene.add(rim);

  // Vài bụi cỏ / đá nhỏ trang trí.
  const tuftGeo = new THREE.ConeGeometry(0.35, 0.9, 6);
  const tuftMat = new THREE.MeshStandardMaterial({ color: 0x2f4a3a, roughness: 1 });
  for (let i = 0; i < 90; i++) {
    const a = i * 2.39996;
    const r = 4 + ((i * 37) % 34);
    const t = new THREE.Mesh(tuftGeo, tuftMat);
    t.position.set(r * Math.sin(a), 0.4, r * Math.cos(a));
    t.scale.setScalar(0.6 + ((i * 13) % 10) / 12);
    scene.add(t);
  }
}

function buildSky(scene) {
  // Biển mây bên dưới đảo.
  const sea = new THREE.Mesh(
    new THREE.CircleGeometry(400, 64),
    new THREE.MeshStandardMaterial({ color: C.cloud, roughness: 1 }),
  );
  sea.rotation.x = -Math.PI / 2;
  sea.position.y = -18;
  scene.add(sea);
  const puffGeo = new THREE.SphereGeometry(1, 12, 10);
  const puffMat = new THREE.MeshStandardMaterial({ color: 0x4a4280, roughness: 1 });
  for (let i = 0; i < 70; i++) {
    const a = i * 2.39996;
    const r = 55 + ((i * 53) % 120);
    const p = new THREE.Mesh(puffGeo, puffMat);
    p.position.set(r * Math.sin(a), -17 + ((i * 7) % 5), r * Math.cos(a));
    p.scale.set(6 + (i % 5) * 2, 2 + (i % 3), 5 + (i % 4) * 2);
    scene.add(p);
  }
  // Sao.
  const n = 600;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = (i * 0.618034) % 1;
    const v = (i * 0.754877) % 1;
    const th = u * Math.PI * 2;
    const ph = Math.acos(1 - v * 0.95); // nửa trên bầu trời
    const R = 300;
    pos[i * 3] = R * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = R * Math.cos(ph);
    pos[i * 3 + 2] = R * Math.sin(ph) * Math.sin(th);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff6d8, size: 1.2, fog: false })));
}

function buildPlayer() {
  const group = new THREE.Group();
  const body = new THREE.Group();
  group.add(body);

  const robe = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.33, 0.55, 6, 16),
    new THREE.MeshStandardMaterial({ color: 0xdfe8ff, roughness: 0.7 }),
  );
  body.add(robe);
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0xffdcb8, roughness: 0.8 }),
  );
  head.position.y = 0.68;
  body.add(head);
  // Nón lá.
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.78, 0.42, 28),
    new THREE.MeshStandardMaterial({ color: 0xd9b46a, roughness: 0.9 }),
  );
  hat.position.y = 0.98;
  body.add(hat);
  // Đèn lồng nhỏ treo trước vành nón.
  const string = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.32, 4),
    new THREE.MeshBasicMaterial({ color: 0x5a4a30 }),
  );
  string.position.set(0, 0.62, 0.7);
  body.add(string);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffc070, emissive: C.warm, emissiveIntensity: 1 }),
  );
  bulb.position.set(0, 0.42, 0.7);
  body.add(bulb);
  const light = new THREE.PointLight(C.warm, 4, 14, 1.4);
  light.position.copy(bulb.position);
  body.add(light);

  body.position.y = 0.65;
  return { group, body, bulb, light };
}

function buildLantern(cfg) {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a2f22, roughness: 0.9 });
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 3.2, 10), wood);
  post.position.y = 1.6;
  group.add(post);
  const lamp = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.9, 14),
    new THREE.MeshStandardMaterial({ color: 0x8a3b22, emissive: 0xff8a30, emissiveIntensity: 0.05, roughness: 0.6 }),
  );
  lamp.position.y = 3.65;
  group.add(lamp);
  for (const y of [3.15, 4.15]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.12, 14), wood);
    cap.position.y = y;
    group.add(cap);
  }
  const light = new THREE.PointLight(C.warm, 0, 30, 1.3);
  light.position.y = 3.65;
  group.add(light);
  // Vùng an toàn (chỉ hiện khi đèn đã thắp).
  const zone = new THREE.Mesh(
    new THREE.RingGeometry(cfg.safe_radius - 0.12, cfg.safe_radius, 72),
    new THREE.MeshBasicMaterial({ color: C.warmSoft, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
  );
  zone.rotation.x = -Math.PI / 2;
  zone.position.y = 0.03;
  group.add(zone);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(cfg.safe_radius, 48),
    new THREE.MeshBasicMaterial({
      color: C.warm, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.y = 0.02;
  group.add(disc);
  return { group, lamp, light, zone, disc };
}

function buildShade(bodyGeo, tailGeo, eyeGeo, eyeMat) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: C.ink, emissive: C.inkGlow, emissiveIntensity: 0.6, roughness: 0.35,
  });
  const body = new THREE.Mesh(bodyGeo, mat);
  body.scale.set(1, 0.9, 1);
  group.add(body);
  const tail = new THREE.Mesh(tailGeo, mat);
  tail.rotation.x = Math.PI;
  tail.position.y = -0.8;
  group.add(tail);
  for (const x of [-0.22, 0.22]) {
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(x, 0.12, 0.62);
    group.add(eye);
  }
  return { group, body };
}
