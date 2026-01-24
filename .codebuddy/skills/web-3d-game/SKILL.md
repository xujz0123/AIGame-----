---
name: web-3d-game
description: This skill should be used when developing browser-based 3D games using WebGL technologies (Three.js, Babylon.js, etc.). It provides workflows, best practices, and utilities for building interactive 3D game experiences including scene management, physics, player controls, collision detection, and performance optimization.
---

# Web 3D Game Development

## Overview

This skill enables efficient development of browser-based 3D games using WebGL. It provides structured workflows for common game development tasks including scene setup, player controls, physics integration, collision systems, and performance optimization specifically tailored for web environments.

## Core Capabilities

### 1. Project Initialization & Architecture

When starting a new 3D web game project:

**Recommended Tech Stack:**
- **3D Engine**: Three.js (lightweight, best docs) or Babylon.js (feature-rich)
- **Physics**: Cannon.js (simple) or Ammo.js (advanced)
- **Animation**: Tween.js for smooth transitions
- **Audio**: Howler.js for cross-browser sound management
- **Build Tool**: Vite (fast) or Webpack
- **Model Format**: GLTF/GLB (optimized, standard)

**Project Structure:**
```
project/
├── src/
│   ├── core/
│   │   ├── SceneManager.js      // Scene initialization & management
│   │   ├── GameLoop.js          // Main game loop
│   │   └── AssetLoader.js       // Model/texture loading
│   ├── systems/
│   │   ├── PlayerController.js  // Input & movement
│   │   ├── CollisionSystem.js   // Collision detection
│   │   ├── PhysicsSystem.js     // Physics integration
│   │   └── ParticleSystem.js    // Visual effects
│   ├── entities/
│   │   ├── Player.js
│   │   └── GameObject.js
│   ├── ui/
│   │   └── UIManager.js         // HUD & menus
│   └── main.js
├── public/
│   ├── models/                  // GLTF/GLB files
│   ├── textures/
│   └── audio/
├── index.html
└── package.json
```

### 2. Scene Management

**Basic Scene Setup (Three.js):**
```javascript
class SceneManager {
  constructor() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 10, 100);
    
    // Camera
    this.camera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 1000
    );
    this.camera.position.set(0, 5, 10);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);
    
    // Lighting
    this.setupLights();
    
    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }
  
  setupLights() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    
    // Directional light (sun)
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(50, 50, 25);
    sun.castShadow = true;
    sun.shadow.camera.left = -50;
    sun.shadow.camera.right = 50;
    sun.shadow.camera.top = 50;
    sun.shadow.camera.bottom = -50;
    this.scene.add(sun);
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
```

### 3. Player Controller (WASD + Mouse)

**Movement & Camera Control:**
```javascript
class PlayerController {
  constructor(player, camera) {
    this.player = player;
    this.camera = camera;
    this.moveSpeed = 5;
    this.rotateSpeed = Math.PI;
    
    this.keys = { w: false, a: false, s: false, d: false, shift: false };
    this.mouseDown = false;
    this.mouseDelta = { x: 0, y: 0 };
    
    this.setupInputListeners();
  }
  
  setupInputListeners() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) this.keys[key] = true;
    });
    
    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) this.keys[key] = false;
    });
    
    // Mouse for camera rotation
    window.addEventListener('mousedown', () => this.mouseDown = true);
    window.addEventListener('mouseup', () => this.mouseDown = false);
    window.addEventListener('mousemove', (e) => {
      if (this.mouseDown) {
        this.mouseDelta.x = e.movementX;
        this.mouseDelta.y = e.movementY;
      }
    });
  }
  
  update(deltaTime) {
    const speed = this.moveSpeed * (this.keys.shift ? 1.5 : 1.0);
    const direction = new THREE.Vector3();
    
    // Calculate movement direction
    if (this.keys.w) direction.z -= 1;
    if (this.keys.s) direction.z += 1;
    if (this.keys.a) direction.x -= 1;
    if (this.keys.d) direction.x += 1;
    
    if (direction.length() > 0) {
      direction.normalize();
      
      // Apply camera rotation to movement
      const angle = Math.atan2(this.camera.position.x - this.player.position.x,
                               this.camera.position.z - this.player.position.z);
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
      
      // Move player
      this.player.position.x += direction.x * speed * deltaTime;
      this.player.position.z += direction.z * speed * deltaTime;
      
      // Rotate player to face movement direction
      this.player.rotation.y = Math.atan2(direction.x, direction.z);
    }
    
    // Camera follow (third-person)
    const cameraOffset = new THREE.Vector3(0, 5, 10);
    const targetPosition = this.player.position.clone().add(cameraOffset);
    this.camera.position.lerp(targetPosition, 0.1);
    this.camera.lookAt(this.player.position);
    
    // Reset mouse delta
    this.mouseDelta.x = 0;
    this.mouseDelta.y = 0;
  }
}
```

### 4. Collision Detection System

**For volume-based collision (like the dino game):**
```javascript
class CollisionSystem {
  constructor() {
    this.objects = [];
  }
  
  addObject(obj, baseVolume) {
    obj.userData.baseVolume = baseVolume;
    this.objects.push(obj);
  }
  
  checkCollision(player, playerVolume) {
    const collisions = [];
    
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      const distance = player.position.distanceTo(obj.position);
      
      // Simple sphere collision for head
      const collisionRadius = 0.5;
      
      if (distance < collisionRadius) {
        const objVolume = this.getVolume(obj);
        
        // Can attack if object is smaller
        if (objVolume < playerVolume * 0.8) {
          collisions.push({
            object: obj,
            volume: objVolume,
            index: i
          });
        }
      }
    }
    
    return collisions;
  }
  
  getVolume(obj) {
    const scale = obj.scale;
    return obj.userData.baseVolume * scale.x * scale.y * scale.z;
  }
  
  removeObject(index) {
    this.objects.splice(index, 1);
  }
}
```

### 5. Growth & Evolution System

**Experience and scaling system:**
```javascript
class EvolutionSystem {
  constructor(player) {
    this.player = player;
    this.experience = 0;
    this.currentStage = 0;
    this.baseScale = 1.0;
    
    this.stages = [
      { threshold: 0, name: '迅猛龙', model: 'raptor.glb' },
      { threshold: 100, name: '三角龙', model: 'triceratops.glb' },
      { threshold: 300, name: '剑龙', model: 'stegosaurus.glb' },
      { threshold: 600, name: '霸王龙', model: 'trex.glb' },
      { threshold: 1000, name: '棘龙', model: 'spinosaurus.glb' }
    ];
  }
  
  addExperience(amount) {
    this.experience += amount;
    
    // Update scale within current stage
    this.updateScale();
    
    // Check for evolution
    if (this.shouldEvolve()) {
      this.evolve();
    }
  }
  
  updateScale() {
    const currentThreshold = this.stages[this.currentStage].threshold;
    const nextThreshold = this.stages[this.currentStage + 1]?.threshold || Infinity;
    
    const stageExp = this.experience - currentThreshold;
    const stageRequired = nextThreshold - currentThreshold;
    const progress = Math.min(stageExp / stageRequired, 1.0);
    
    // Grow from 1x to 2x within stage
    const growthFactor = 1 + progress;
    this.player.scale.setScalar(this.baseScale * growthFactor);
  }
  
  shouldEvolve() {
    const nextStage = this.stages[this.currentStage + 1];
    return nextStage && this.experience >= nextStage.threshold;
  }
  
  async evolve() {
    this.currentStage++;
    const stage = this.stages[this.currentStage];
    
    // Play evolution animation
    await this.playEvolutionAnimation();
    
    // Load new model
    await this.loadModel(stage.model);
    
    // Reset scale
    this.player.scale.setScalar(this.baseScale);
    
    // Show UI notification
    this.showEvolutionNotification(stage.name);
  }
  
  async playEvolutionAnimation() {
    // Glow and spin effect
    return new Promise(resolve => {
      const tween = new TWEEN.Tween(this.player.rotation)
        .to({ y: this.player.rotation.y + Math.PI * 2 }, 2000)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(resolve)
        .start();
    });
  }
  
  getVolume() {
    const scale = this.player.scale.x;
    return scale * scale * scale;
  }
}
```

### 6. Particle Effects System

**Explosion effect for destroyed objects:**
```javascript
class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
  }
  
  createExplosion(position, color = 0xff6600) {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions.push(position.x, position.y, position.z);
      
      // Random velocity
      velocities.push(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      );
    }
    
    geometry.setAttribute('position', 
      new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: color,
      size: 0.2,
      transparent: true,
      opacity: 1
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.velocities = velocities;
    particles.userData.lifetime = 1.0;
    this.scene.add(particles);
    
    return particles;
  }
  
  update(deltaTime) {
    this.scene.children.forEach(child => {
      if (child instanceof THREE.Points && child.userData.lifetime) {
        const positions = child.geometry.attributes.position.array;
        const velocities = child.userData.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] += velocities[i] * deltaTime;
          positions[i + 1] += velocities[i + 1] * deltaTime;
          positions[i + 2] += velocities[i + 2] * deltaTime;
          
          // Apply gravity
          velocities[i + 1] -= 9.8 * deltaTime;
        }
        
        child.geometry.attributes.position.needsUpdate = true;
        
        // Fade out
        child.userData.lifetime -= deltaTime;
        child.material.opacity = child.userData.lifetime;
        
        // Remove when done
        if (child.userData.lifetime <= 0) {
          this.scene.remove(child);
          child.geometry.dispose();
          child.material.dispose();
        }
      }
    });
  }
}
```

### 7. Object Spawner

**Dynamic object generation:**
```javascript
class ObjectSpawner {
  constructor(scene, collisionSystem) {
    this.scene = scene;
    this.collisionSystem = collisionSystem;
    this.spawnRadius = 50;
    this.minDistance = 20;
    
    this.objectTypes = [
      { type: 'grass', volume: 0.5, geometry: 'cone', color: 0x2ecc71 },
      { type: 'bush', volume: 1.0, geometry: 'sphere', color: 0x27ae60 },
      { type: 'tree', volume: 2.0, geometry: 'cylinder', color: 0x8b4513 },
      { type: 'rock', volume: 0.8, geometry: 'dodecahedron', color: 0x95a5a6 },
      { type: 'house', volume: 3.0, geometry: 'box', color: 0xe67e22 }
    ];
  }
  
  spawnInitialObjects(count = 50) {
    for (let i = 0; i < count; i++) {
      this.spawnRandomObject();
    }
  }
  
  spawnRandomObject(playerPos = new THREE.Vector3()) {
    const type = this.objectTypes[
      Math.floor(Math.random() * this.objectTypes.length)
    ];
    
    // Random position
    const angle = Math.random() * Math.PI * 2;
    const distance = this.minDistance + Math.random() * this.spawnRadius;
    const position = new THREE.Vector3(
      playerPos.x + Math.cos(angle) * distance,
      0,
      playerPos.z + Math.sin(angle) * distance
    );
    
    // Create geometry
    let geometry;
    switch(type.geometry) {
      case 'cone':
        geometry = new THREE.ConeGeometry(0.3, 1, 8);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(0.5, 8, 8);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
        break;
      case 'dodecahedron':
        geometry = new THREE.DodecahedronGeometry(0.5);
        break;
      case 'box':
        geometry = new THREE.BoxGeometry(1, 1, 1);
        break;
    }
    
    const material = new THREE.MeshLambertMaterial({ color: type.color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    this.scene.add(mesh);
    this.collisionSystem.addObject(mesh, type.volume);
    
    return mesh;
  }
  
  respawnObject(delay = 30000, playerPos) {
    setTimeout(() => {
      this.spawnRandomObject(playerPos);
    }, delay);
  }
}
```

### 8. UI Manager

**HUD and game interface:**
```javascript
class UIManager {
  constructor(evolutionSystem) {
    this.evolutionSystem = evolutionSystem;
    this.createHUD();
  }
  
  createHUD() {
    // Experience bar
    this.expBar = document.createElement('div');
    this.expBar.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      width: 400px;
      height: 30px;
      background: rgba(0,0,0,0.5);
      border-radius: 15px;
      overflow: hidden;
    `;
    
    this.expFill = document.createElement('div');
    this.expFill.style.cssText = `
      height: 100%;
      background: linear-gradient(90deg, #2ecc71, #27ae60);
      width: 0%;
      transition: width 0.3s;
    `;
    this.expBar.appendChild(this.expFill);
    
    // Info display
    this.infoDisplay = document.createElement('div');
    this.infoDisplay.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 18px;
      background: rgba(0,0,0,0.5);
      padding: 15px;
      border-radius: 10px;
    `;
    
    document.body.appendChild(this.expBar);
    document.body.appendChild(this.infoDisplay);
  }
  
  update() {
    const system = this.evolutionSystem;
    const currentStage = system.stages[system.currentStage];
    const nextStage = system.stages[system.currentStage + 1];
    
    if (nextStage) {
      const progress = ((system.experience - currentStage.threshold) / 
                       (nextStage.threshold - currentStage.threshold)) * 100;
      this.expFill.style.width = `${Math.min(progress, 100)}%`;
    } else {
      this.expFill.style.width = '100%';
    }
    
    this.infoDisplay.innerHTML = `
      <strong>恐龙:</strong> ${currentStage.name}<br>
      <strong>经验:</strong> ${system.experience}${nextStage ? `/${nextStage.threshold}` : ''}<br>
      <strong>体型:</strong> ${(system.player.scale.x).toFixed(2)}x
    `;
  }
  
  showEvolutionNotification(dinoName) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 30px 60px;
      border-radius: 20px;
      font-size: 32px;
      font-weight: bold;
      z-index: 1000;
      animation: fadeInOut 3s;
    `;
    notification.textContent = `进化成功！\n${dinoName}`;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
  }
}
```

### 9. Main Game Loop

**Putting it all together:**
```javascript
class Game {
  constructor() {
    this.sceneManager = new SceneManager();
    this.clock = new THREE.Clock();
    
    this.init();
  }
  
  async init() {
    // Load player model (or create placeholder)
    this.player = await this.loadPlayer();
    this.sceneManager.scene.add(this.player);
    
    // Initialize systems
    this.evolutionSystem = new EvolutionSystem(this.player);
    this.playerController = new PlayerController(
      this.player, 
      this.sceneManager.camera
    );
    this.collisionSystem = new CollisionSystem();
    this.particleSystem = new ParticleSystem(this.sceneManager.scene);
    this.objectSpawner = new ObjectSpawner(
      this.sceneManager.scene, 
      this.collisionSystem
    );
    this.uiManager = new UIManager(this.evolutionSystem);
    
    // Spawn initial objects
    this.objectSpawner.spawnInitialObjects(50);
    
    // Start game loop
    this.animate();
  }
  
  async loadPlayer() {
    // Simple placeholder (replace with GLTF loader)
    const geometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    const player = new THREE.Mesh(geometry, material);
    player.castShadow = true;
    return player;
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    const deltaTime = this.clock.getDelta();
    
    // Update systems
    this.playerController.update(deltaTime);
    
    // Check collisions
    const playerVolume = this.evolutionSystem.getVolume();
    const collisions = this.collisionSystem.checkCollision(
      this.player, 
      playerVolume
    );
    
    // Handle collisions
    collisions.forEach(collision => {
      // Create explosion effect
      this.particleSystem.createExplosion(
        collision.object.position,
        collision.object.material.color
      );
      
      // Remove object
      this.sceneManager.scene.remove(collision.object);
      this.collisionSystem.removeObject(collision.index);
      
      // Add experience
      const exp = Math.floor(collision.volume * 10);
      this.evolutionSystem.addExperience(exp);
      
      // Respawn later
      this.objectSpawner.respawnObject(30000, this.player.position);
    });
    
    // Update particles
    this.particleSystem.update(deltaTime);
    
    // Update UI
    this.uiManager.update();
    
    // Update tweens (if using TWEEN.js)
    TWEEN.update();
    
    // Render
    this.sceneManager.renderer.render(
      this.sceneManager.scene,
      this.sceneManager.camera
    );
  }
}

// Start game
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
});
```

### 10. Performance Optimization

**Best practices for web 3D games:**

**Asset Optimization:**
- Use GLTF/GLB with Draco compression
- Keep texture sizes reasonable (512x512 or 1024x1024)
- Use texture atlases to reduce draw calls
- Implement Level of Detail (LOD) for distant objects

**Rendering Optimization:**
```javascript
// Frustum culling (built-in, but ensure it's working)
// Use instanced meshes for repeated objects
const instancedGeometry = new THREE.InstancedMesh(geometry, material, count);

// Limit shadow casting
mesh.castShadow = false; // for small objects
mesh.receiveShadow = false;

// Use simplified geometries for physics
// Reduce polygon count for background objects

// Monitor performance
const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // ... rendering code ...
  stats.end();
}
```

**Memory Management:**
```javascript
// Dispose of removed objects
function removeObject(object) {
  object.geometry.dispose();
  object.material.dispose();
  scene.remove(object);
}

// Implement object pooling for frequently spawned items
class ObjectPool {
  constructor(createFn, maxSize = 100) {
    this.pool = [];
    this.createFn = createFn;
    this.maxSize = maxSize;
  }
  
  acquire() {
    return this.pool.pop() || this.createFn();
  }
  
  release(object) {
    if (this.pool.length < this.maxSize) {
      object.visible = false;
      this.pool.push(object);
    }
  }
}
```

### 11. Mobile Support

**Touch controls and responsive design:**
```javascript
class MobileController {
  constructor(player, camera) {
    this.player = player;
    this.camera = camera;
    this.joystick = this.createJoystick();
  }
  
  createJoystick() {
    // Virtual joystick for mobile
    const joystickBase = document.createElement('div');
    joystickBase.style.cssText = `
      position: fixed;
      bottom: 50px;
      left: 50px;
      width: 100px;
      height: 100px;
      background: rgba(255,255,255,0.3);
      border-radius: 50%;
      touch-action: none;
    `;
    
    const joystickStick = document.createElement('div');
    joystickStick.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 40px;
      height: 40px;
      background: rgba(255,255,255,0.8);
      border-radius: 50%;
    `;
    
    joystickBase.appendChild(joystickStick);
    document.body.appendChild(joystickBase);
    
    // Touch handling
    let touching = false;
    this.direction = { x: 0, y: 0 };
    
    joystickBase.addEventListener('touchstart', (e) => {
      touching = true;
      e.preventDefault();
    });
    
    joystickBase.addEventListener('touchmove', (e) => {
      if (!touching) return;
      const touch = e.touches[0];
      const rect = joystickBase.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = touch.clientX - centerX;
      const deltaY = touch.clientY - centerY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = 40;
      
      this.direction.x = (deltaX / maxDistance);
      this.direction.y = (deltaY / maxDistance);
      
      // Update stick position
      joystickStick.style.transform = 
        `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
      
      e.preventDefault();
    });
    
    joystickBase.addEventListener('touchend', () => {
      touching = false;
      this.direction = { x: 0, y: 0 };
      joystickStick.style.transform = 'translate(-50%, -50%)';
    });
    
    return joystickBase;
  }
  
  update(deltaTime) {
    if (this.direction.x !== 0 || this.direction.y !== 0) {
      const speed = 5;
      this.player.position.x += this.direction.x * speed * deltaTime;
      this.player.position.z += this.direction.y * speed * deltaTime;
    }
  }
}
```

## Development Workflow

When building a web 3D game:

1. **Start with MVP**: Get basic scene + player movement working first
2. **Iterate systems**: Add one system at a time (collision → growth → effects)
3. **Test early**: Run in browser frequently, check console for errors
4. **Optimize incrementally**: Don't premature optimize, but monitor performance
5. **Mobile test**: Check touch controls and performance on actual devices

## Common Pitfalls

- **Loading models**: Always handle async loading, show loading screen
- **Physics overhead**: Physics engines can be CPU-intensive, use sparingly
- **Memory leaks**: Always dispose geometries/materials when removing objects
- **Cross-browser**: Test in Chrome, Firefox, Safari - WebGL support varies
- **Mobile performance**: Reduce draw calls, lower poly counts significantly

## Resources

This skill includes example resource directories that demonstrate how to organize different types of bundled resources:

### scripts/
Executable code (Python/Bash/etc.) that can be run directly to perform specific operations.

**Examples from other skills:**
- PDF skill: `fill_fillable_fields.py`, `extract_form_field_info.py` - utilities for PDF manipulation
- DOCX skill: `document.py`, `utilities.py` - Python modules for document processing

**Appropriate for:** Python scripts, shell scripts, or any executable code that performs automation, data processing, or specific operations.

**Note:** Scripts may be executed without loading into context, but can still be read by Claude for patching or environment adjustments.

### references/
Documentation and reference material intended to be loaded into context to inform Claude's process and thinking.

**Examples from other skills:**
- Product management: `communication.md`, `context_building.md` - detailed workflow guides
- BigQuery: API reference documentation and query examples
- Finance: Schema documentation, company policies

**Appropriate for:** In-depth documentation, API references, database schemas, comprehensive guides, or any detailed information that Claude should reference while working.

### assets/
Files not intended to be loaded into context, but rather used within the output Claude produces.

**Examples from other skills:**
- Brand styling: PowerPoint template files (.pptx), logo files
- Frontend builder: HTML/React boilerplate project directories
- Typography: Font files (.ttf, .woff2)

**Appropriate for:** Templates, boilerplate code, document templates, images, icons, fonts, or any files meant to be copied or used in the final output.

---

**Any unneeded directories can be deleted.** Not every skill requires all three types of resources.
