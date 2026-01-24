/**
 * 恐龙进化 - 主入口文件
 * Dino Evolution Main Entry
 */

import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { PlayerController } from './systems/PlayerController.js';
import { CollisionSystem } from './systems/CollisionSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';
import { VolumeLabel } from './ui/VolumeLabel.js';
import { GrowthSystem } from './systems/GrowthSystem.js';
import { EvolutionSystem } from './systems/EvolutionSystem.js';
import { RespawnSystem } from './systems/RespawnSystem.js';
import { ModelLoader } from './systems/ModelLoader.js';

// 游戏配置
const CONFIG = {
  scene: {
    background: 0x87ceeb,
    fogNear: 20,  // 增加雾效距离
    fogFar: 150   // 增加雾效距离
  },
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 5, z: 10 }
  },
  player: {
    moveSpeed: 5,
    rotateSpeed: Math.PI,
    initialScale: 1.0
  }
};

class Game {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.clock = new THREE.Clock();
    this.player = null;
    this.playerController = null;
    this.collisionSystem = null;
    this.particleSystem = null;
    this.volumeLabel = null;
    this.growthSystem = null;
    this.evolutionSystem = null;
    this.respawnSystem = null;
    this.modelLoader = null;
    this.animationMixer = null;
    
    // 游戏数据
    this.experience = 0;
    this.playerVolume = 1.0;
    this.playerBaseScale = 1.0;
    
    this.init();
  }

  init() {
    // 等待游戏开始事件
    window.addEventListener('gameStart', async () => {
      try {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        
        // 初始化模型加载器
        this.modelLoader = new ModelLoader();
        
        // 先初始化系统
        this.collisionSystem = new CollisionSystem(this.scene);
        this.particleSystem = new ParticleSystem(this.scene);
        this.volumeLabel = new VolumeLabel(this.scene, this.camera);
        
        // 异步创建玩家（加载模型）
        await this.createPlayer();
        this.createGround();
        
        // 初始化成长系统
        this.growthSystem = new GrowthSystem(this.player);
        
        // 初始化进化系统
        this.evolutionSystem = new EvolutionSystem(this.player, this.scene, this.modelLoader);
        
        // 初始化重生系统
        this.respawnSystem = new RespawnSystem(
          this.scene, 
          this.collisionSystem, 
          this.volumeLabel, 
          this.player
        );
        
        // 为玩家添加体积标签
        this.updatePlayerVolume();
        
        // 最后初始化控制器
        this.playerController = new PlayerController(this.player, this.camera);
        
        // 监听模型更换事件
        window.addEventListener('playerModelChanged', (event) => {
          this.player = event.detail.newPlayer;
          this.playerController.setPlayer(this.player);
          this.growthSystem.setPlayer(this.player);
        });
        
        this.animate();
        
        console.log('✅ 游戏启动成功！');
        console.log('🎮 控制说明:');
        console.log('  WASD - 移动');
        console.log('  Shift - 加速冲刺');
        console.log('  鼠标拖拽 - 旋转视角');
        console.log('  滚轮 - 调整相机距离');
        console.log('  空格 - 跳跃');
        console.log('');
        console.log('💥 碰撞提示:');
        console.log('  移动靠近比你小的物体来吞噬它们！');
      } catch (error) {
        console.error('❌ 游戏初始化失败:', error);
        alert('游戏加载失败，请刷新页面重试。\n错误信息: ' + error.message);
      }
    });
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(CONFIG.scene.background);
    this.scene.fog = new THREE.Fog(
      CONFIG.scene.background,
      CONFIG.scene.fogNear,
      CONFIG.scene.fogFar
    );
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      window.innerWidth / window.innerHeight,
      CONFIG.camera.near,
      CONFIG.camera.far
    );
    this.camera.position.set(
      CONFIG.camera.position.x,
      CONFIG.camera.position.y,
      CONFIG.camera.position.z
    );
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // 处理窗口大小调整
    window.addEventListener('resize', () => this.onResize());
  }

  setupLights() {
    // 环境光
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    // 方向光 (太阳)
    const sun = new THREE.DirectionalLight(0xffffff, 0.8);
    sun.position.set(50, 50, 25);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.left = -100;   // 扩大阴影范围
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    this.scene.add(sun);
  }

  async createPlayer() {
    try {
      // 使用模型加载器加载初始恐龙模型（等级1：迅猛龙）
      console.log('🦖 正在加载恐龙模型...');
      const dinoModel = await this.modelLoader.loadDinoModel(1);
      
      if (!dinoModel) {
        throw new Error('模型加载失败');
      }
      
      this.player = dinoModel;
      this.player.position.y = 5; // 提高Y位置以适应放大的场景
      this.player.scale.set(this.playerBaseScale, this.playerBaseScale, this.playerBaseScale);
      this.scene.add(this.player);
      
      // 创建动画混合器（如果模型有动画）
      this.animationMixer = this.modelLoader.createAnimationMixer(this.player);

      console.log('✅ 恐龙模型已加载！初始等级: 1 (迅猛龙)');
    } catch (error) {
      console.error('❌ 玩家模型创建失败:', error);
      // 创建一个简单的占位符作为玩家
      const geometry = new THREE.CapsuleGeometry(5, 10, 8, 16); // 放大10倍
      const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
      this.player = new THREE.Mesh(geometry, material);
      this.player.position.y = 5;
      this.player.castShadow = true;
      this.player.receiveShadow = true;
      this.scene.add(this.player);
      console.log('⚠️ 使用备用玩家模型');
    }
  }

  createGround() {
    // 创建更大的地面
    const groundGeometry = new THREE.PlaneGeometry(200, 200); // 扩大到200x200
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x7ec850 
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // 添加一些示例物体
    this.createSampleObjects();
  }

  createSampleObjects() {
    // 创建多种类型的物体（尺寸增加10倍）
    const objectTypes = [
      { geometry: new THREE.ConeGeometry(3, 10, 8), color: 0x2ecc71, volume: 0.3, name: '小草' },
      { geometry: new THREE.SphereGeometry(4, 8, 8), color: 0x27ae60, volume: 0.5, name: '灌木' },
      { geometry: new THREE.BoxGeometry(6, 6, 6), color: 0x3498db, volume: 0.7, name: '木桩' },
      { geometry: new THREE.CylinderGeometry(3, 3, 15, 8), color: 0x8b4513, volume: 0.9, name: '小树' },
      { geometry: new THREE.BoxGeometry(10, 10, 10), color: 0xe67e22, volume: 1.2, name: '石头' },
      { geometry: new THREE.DodecahedronGeometry(6), color: 0x95a5a6, volume: 1.5, name: '栅栏' },
      { geometry: new THREE.CylinderGeometry(4, 4, 20, 8), color: 0x34495e, volume: 1.8, name: '大树' },
      { geometry: new THREE.TorusGeometry(5, 2, 8, 16), color: 0xe74c3c, volume: 2.0, name: '轮胎' },
      { geometry: new THREE.OctahedronGeometry(6), color: 0x9b59b6, volume: 2.2, name: '水晶' },
      { geometry: new THREE.TetrahedronGeometry(7), color: 0x1abc9c, volume: 2.5, name: '宝石' }
    ];

    // 增加物体数量到80个，更分散地放置
    for (let i = 0; i < 80; i++) {
      const type = objectTypes[Math.floor(Math.random() * objectTypes.length)];
      const material = new THREE.MeshLambertMaterial({ color: type.color });
      const mesh = new THREE.Mesh(type.geometry.clone(), material);
      
      // 更分散的随机位置（扩大到80单位范围）
      const angle = Math.random() * Math.PI * 2;
      const distance = 15 + Math.random() * 65; // 15-80单位的范围，更分散
      mesh.position.x = Math.cos(angle) * distance;
      mesh.position.z = Math.sin(angle) * distance;
      
      // 根据物体类型调整Y位置（让圆柱体站立在地面）
      if (type.name === '小树' || type.name === '大树') {
        mesh.position.y = 7.5; // 圆柱体高度的一半
      } else if (type.name === '小草') {
        mesh.position.y = 5;
      } else {
        mesh.position.y = 5; // 其他物体
      }
      
      // 随机旋转
      mesh.rotation.y = Math.random() * Math.PI * 2;
      
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.name = type.name;
      
      this.scene.add(mesh);
      
      // 添加到碰撞系统
      this.collisionSystem.addObject(mesh, type.volume);
      
      // 添加体积标签（根据是否可吞噬显示不同颜色）
      const canEat = type.volume < this.playerVolume * 0.8;
      const labelColor = canEat ? '#00ff00' : '#ff0000';
      this.volumeLabel.createLabel(mesh, type.volume, labelColor);
    }

    console.log('✨ 场景物体已生成！共 80 个可碰撞物体');
    console.log('📊 玩家体积:', this.playerVolume);
    console.log('🎯 可吞噬体积范围: < ' + (this.playerVolume * 0.8).toFixed(2));
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const deltaTime = this.clock.getDelta();

    // 更新玩家控制器
    if (this.playerController) {
      this.playerController.update(deltaTime);
    }
    
    // 更新动画混合器
    if (this.animationMixer) {
      try {
        this.animationMixer.update(deltaTime);
      } catch (error) {
        console.warn('动画更新错误:', error);
        this.animationMixer = null; // 禁用有问题的动画
      }
    }

    // 更新玩家体积
    this.playerVolume = this.growthSystem.getVolume();

    // 检测碰撞
    if (this.collisionSystem && this.player) {
      const collisions = this.collisionSystem.checkCollision(this.player, this.playerVolume);
      
      // 处理碰撞
      collisions.forEach(collision => {
        this.handleCollision(collision);
      });
    }

    // 更新粒子系统
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime);
    }
    
    // 更新重生系统
    if (this.respawnSystem) {
      this.respawnSystem.update();
    }

    // 更新体积标签
    if (this.volumeLabel) {
      this.volumeLabel.update();
    }

    // 更新调试信息UI
    this.updateDebugUI();

    // 更新动画
    TWEEN.update();

    // 渲染场景
    this.renderer.render(this.scene, this.camera);
  }
  
  /**
   * 更新调试UI
   */
  updateDebugUI() {
    const playerVolumeEl = document.getElementById('player-volume');
    const eatableVolumeEl = document.getElementById('eatable-volume');
    const objectCountEl = document.getElementById('object-count');
    const totalExpEl = document.getElementById('total-exp');
    const progressFillEl = document.getElementById('progress-fill');
    const currentScaleEl = document.getElementById('current-scale');
    const currentVolumeEl = document.getElementById('current-volume');
    const dinoNameEl = document.getElementById('dino-name');
    const dinoLevelEl = document.getElementById('dino-level');
    const nextEvoExpEl = document.getElementById('next-evo-exp');
    const respawnQueueEl = document.getElementById('respawn-queue');
    const nextRespawnEl = document.getElementById('next-respawn');
    
    if (playerVolumeEl) playerVolumeEl.textContent = this.playerVolume.toFixed(2);
    if (eatableVolumeEl) eatableVolumeEl.textContent = (this.playerVolume * 0.8).toFixed(2);
    if (objectCountEl) objectCountEl.textContent = this.collisionSystem.getObjectCount();
    if (totalExpEl) totalExpEl.textContent = this.experience;
    
    // 更新重生信息
    if (this.respawnSystem) {
      const queueLength = this.respawnSystem.getQueueLength();
      const nextRespawnTime = this.respawnSystem.getNextRespawnTime();
      
      if (respawnQueueEl) respawnQueueEl.textContent = queueLength;
      if (nextRespawnEl) {
        if (nextRespawnTime === -1) {
          nextRespawnEl.textContent = '--';
        } else {
          nextRespawnEl.textContent = `${nextRespawnTime}秒`;
        }
      }
    }
    
    // 更新成长进度条
    if (this.growthSystem) {
      const progress = this.growthSystem.getGrowthProgress();
      const scale = this.growthSystem.getScale();
      
      if (progressFillEl) {
        progressFillEl.style.width = `${progress}%`;
        progressFillEl.textContent = `${progress.toFixed(1)}%`;
      }
      if (currentScaleEl) currentScaleEl.textContent = scale.toFixed(2);
      if (currentVolumeEl) currentVolumeEl.textContent = this.playerVolume.toFixed(2);
    }
    
    // 更新进化信息
    if (this.evolutionSystem) {
      const currentStage = this.evolutionSystem.getCurrentStage();
      const nextStage = this.evolutionSystem.getNextStage();
      const expToNext = this.evolutionSystem.getExpToNextEvolution(this.experience);
      
      if (dinoNameEl) dinoNameEl.textContent = currentStage.name;
      if (dinoLevelEl) dinoLevelEl.textContent = `等级 ${currentStage.level}`;
      
      if (nextEvoExpEl) {
        if (expToNext === -1) {
          nextEvoExpEl.textContent = '已达最高等级';
        } else {
          nextEvoExpEl.textContent = `还需 ${expToNext} 经验进化`;
        }
      }
    }
  }
  
  /**
   * 处理碰撞事件
   */
  handleCollision(collision) {
    // 创建爆炸特效
    this.particleSystem.createExplosion(
      collision.position,
      collision.object.material.color.getHex()
    );
    
    // 创建收集特效
    this.particleSystem.createCollectEffect(
      collision.position,
      0x00ff00
    );
    
    // 计算获得的经验值
    const expGained = Math.floor(collision.volume * 10);
    this.experience += expGained;
    
    // 成长！
    const growthResult = this.growthSystem.grow(collision.volume);
    
    // 更新玩家体积标签
    this.updatePlayerVolume();
    
    // 更新所有物体标签颜色（因为可吞噬范围变了）
    this.updateObjectLabels();
    
    // 添加到重生队列
    this.respawnSystem.addToRespawnQueue(collision.object, collision.volume);
    
    // 移除体积标签
    this.volumeLabel.removeLabel(collision.object);
    
    // 移除物体
    this.collisionSystem.removeObjectByReference(collision.object);
    
    // 控制台输出
    console.log(`💥 吞噬成功！物体体积: ${collision.volume.toFixed(2)}, 经验 +${expGained}`);
    console.log(`📈 成长！体型: ${growthResult.newScale.toFixed(2)}x (+${growthResult.growthAmount.toFixed(3)})`);
    console.log(`📊 玩家当前体积: ${this.growthSystem.getVolume().toFixed(2)}`);
    console.log(`📊 成长进度: ${growthResult.newScale.toFixed(2)} / 3.0 (${this.growthSystem.getGrowthProgress().toFixed(1)}%)`);
    console.log(`📊 剩余物体: ${this.collisionSystem.getObjectCount()}`);
    
    if (growthResult.reachedMax) {
      console.log('🎉 恭喜！已达到最大体型！');
    }
    
    // 检查是否可以进化
    if (this.evolutionSystem && !this.evolutionSystem.isEvolving) {
      const canEvolve = this.evolutionSystem.checkEvolution(this.experience);
      if (canEvolve) {
        this.evolutionSystem.evolve(this.experience, (nextStage) => {
          // 进化完成，重置成长系统
          this.growthSystem.reset(nextStage.baseScale);
          this.updatePlayerVolume();
          this.updateObjectLabels();
          
          console.log(`🎊 进化完成！你现在是 ${nextStage.name}！`);
        });
      }
    }
  }
  
  /**
   * 更新玩家体积显示
   */
  updatePlayerVolume() {
    this.playerVolume = this.growthSystem.getVolume();
    
    // 移除旧标签
    if (this.player.userData.volumeSprite) {
      this.volumeLabel.removeLabel(this.player);
    }
    
    // 创建新标签（玩家用黄色）
    this.volumeLabel.createLabel(this.player, this.playerVolume, '#ffff00');
  }
  
  /**
   * 更新所有物体的标签颜色
   */
  updateObjectLabels() {
    const objects = this.collisionSystem.getObjects();
    objects.forEach(obj => {
      const objVolume = this.collisionSystem.getVolume(obj);
      const canEat = objVolume < this.playerVolume * 0.8;
      const labelColor = canEat ? '#00ff00' : '#ff0000';
      
      if (obj.userData.volumeSprite) {
        this.volumeLabel.updateLabel(obj, objVolume, labelColor);
      }
    });
  }
}

// 创建游戏实例
new Game();

console.log('🎮 游戏初始化完成！点击"开始游戏"按钮开始。');
