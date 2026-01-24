/**
 * 模型加载器
 * 负责加载和管理GLTF恐龙模型
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

export class ModelLoader {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();
    this.objLoader = new OBJLoader();
    this.mtlLoader = new MTLLoader();
    this.loadedModels = new Map();
    this.mixer = null; // 动画混合器
    
    // 恐龙模型配置
    this.dinoModels = {
      1: { 
        name: '迅猛龙', 
        url: '/models/Velociraptor.obj',
        mtl: '/models/Velociraptor.mtl',
        fallback: false, // 启用真实OBJ模型
        scale: 0.008, // 增加10倍以匹配场景物体
        color: 0x00ff00
      },
      2: { 
        name: '三角龙', 
        url: '/models/Triceratops.obj',
        mtl: '/models/Triceratops.mtl',
        fallback: false,
        scale: 0.012, // 稍大
        color: 0x0088ff
      },
      3: { 
        name: '剑龙', 
        url: '/models/Stegosaurus.obj',
        mtl: '/models/Stegosaurus.mtl',
        fallback: false,
        scale: 0.016, // 中等
        color: 0xff8800
      },
      4: { 
        name: '霸王龙', 
        url: '/models/Trex.obj',
        mtl: '/models/Trex.mtl',
        fallback: false,
        scale: 0.020, // 较大
        color: 0xff0000
      },
      5: { 
        name: '副栉龙', // Parasaurolophus
        url: '/models/Parasaurolophus.obj',
        mtl: '/models/Parasaurolophus.mtl',
        fallback: false,
        scale: 0.024, // 最大
        color: 0x8800ff
      }
    };
  }
  
  /**
   * 加载恐龙模型
   * @param {number} level - 进化等级
   * @returns {Promise<THREE.Object3D>} 模型对象
   */
  async loadDinoModel(level) {
    const config = this.dinoModels[level];
    
    if (!config) {
      console.error(`❌ 未找到等级 ${level} 的恐龙配置`);
      return this.createFallbackModel(level);
    }
    
    // 如果已加载，直接返回克隆
    if (this.loadedModels.has(level)) {
      console.log(`✅ 使用缓存模型: ${config.name}`);
      return this.loadedModels.get(level).clone();
    }
    
    // 如果配置为使用占位符或模型文件不存在
    if (config.fallback) {
      console.log(`🎨 使用占位符模型: ${config.name}`);
      const fallbackModel = this.createFallbackModel(level);
      this.loadedModels.set(level, fallbackModel);
      return fallbackModel.clone();
    }
    
    // 尝试加载模型（自动检测格式）
    try {
      console.log(`📦 开始加载模型: ${config.name} (${config.url})`);
      
      // 根据文件扩展名选择加载器
      const ext = config.url.split('.').pop().toLowerCase();
      let model, animations = [];
      
      if (ext === 'glb' || ext === 'gltf') {
        const result = await this.loadGLTF(config.url);
        model = result.scene;
        animations = result.animations || [];
      } else if (ext === 'fbx') {
        model = await this.loadFBX(config.url);
        // FBX动画可能有兼容性问题，暂时不加载
        animations = [];
      } else if (ext === 'obj') {
        // 如果有MTL文件，先加载材质
        if (config.mtl) {
          model = await this.loadOBJWithMTL(config.url, config.mtl);
        } else {
          model = await this.loadOBJ(config.url);
        }
        animations = [];
      } else {
        throw new Error(`不支持的文件格式: ${ext}`);
      }
      
      // 检查模型是否有效
      if (!model || !model.children || model.children.length === 0) {
        throw new Error('模型加载失败或为空');
      }
      
      // 设置模型属性
      model.scale.setScalar(config.scale);
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          // 如果是OBJ但没有材质文件，使用默认材质
          if (ext === 'obj' && !config.mtl && !child.material) {
            child.material = new THREE.MeshLambertMaterial({ color: config.color });
          }
          
          // 确保材质存在
          if (!child.material) {
            child.material = new THREE.MeshLambertMaterial({ color: config.color });
          }
          
          // 如果材质是数组，遍历所有材质
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach(mat => {
            if (mat) {
              // 确保材质支持阴影
              mat.side = THREE.DoubleSide; // 双面渲染
            }
          });
        }
      });
      
      // 如果有动画（过滤并验证动画）
      if (animations && animations.length > 0) {
        // 验证并过滤有效的动画
        const validAnimations = animations.filter(clip => {
          if (!clip || !clip.tracks || clip.tracks.length === 0) return false;
          
          // 检查每个轨道是否有效
          return clip.tracks.every(track => {
            return track && typeof track.createInterpolant === 'function';
          });
        });
        
        if (validAnimations.length > 0) {
          model.userData.animations = validAnimations;
          console.log(`🎬 加载了 ${validAnimations.length} 个有效动画`);
        } else {
          console.log(`⚠️ 模型包含动画但无有效轨道，跳过动画加载`);
        }
      }
      
      this.loadedModels.set(level, model);
      console.log(`✅ 模型加载完成: ${config.name}`);
      
      return model.clone();
      
    } catch (error) {
      console.warn(`⚠️ 模型加载失败: ${config.name}，使用占位符`);
      console.error(error);
      const fallbackModel = this.createFallbackModel(level);
      this.loadedModels.set(level, fallbackModel); // 缓存占位符，避免重复尝试加载
      return fallbackModel;
    }
  }
  
  /**
   * 加载GLTF文件
   * @param {string} url - 模型URL
   * @returns {Promise}
   */
  loadGLTF(url) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => resolve(gltf),
        (progress) => {
          const percent = (progress.loaded / progress.total * 100).toFixed(2);
          console.log(`📊 GLTF加载进度: ${percent}%`);
        },
        (error) => reject(error)
      );
    });
  }
  
  /**
   * 加载FBX文件
   * @param {string} url - 模型URL
   * @returns {Promise}
   */
  loadFBX(url) {
    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (fbx) => {
          console.log(`✅ FBX文件加载成功: ${url}`);
          resolve(fbx);
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total * 100).toFixed(2);
            console.log(`📊 FBX加载进度: ${percent}%`);
          }
        },
        (error) => {
          console.error(`❌ FBX加载失败: ${url}`, error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * 加载OBJ文件
   * @param {string} url - 模型URL
   * @returns {Promise}
   */
  loadOBJ(url) {
    return new Promise((resolve, reject) => {
      this.objLoader.load(
        url,
        (obj) => {
          console.log(`✅ OBJ文件加载成功: ${url}`);
          resolve(obj);
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total * 100).toFixed(2);
            console.log(`📊 OBJ加载进度: ${percent}%`);
          }
        },
        (error) => {
          console.error(`❌ OBJ加载失败: ${url}`, error);
          reject(error);
        }
      );
    });
  }
  
  /**
   * 加载带材质的OBJ文件
   * @param {string} objUrl - OBJ文件URL
   * @param {string} mtlUrl - MTL文件URL
   * @returns {Promise}
   */
  loadOBJWithMTL(objUrl, mtlUrl) {
    return new Promise((resolve, reject) => {
      // 先加载MTL材质文件
      this.mtlLoader.load(
        mtlUrl,
        (materials) => {
          materials.preload();
          console.log(`✅ MTL材质加载成功: ${mtlUrl}`);
          
          // 设置材质到OBJ加载器
          this.objLoader.setMaterials(materials);
          
          // 加载OBJ文件
          this.objLoader.load(
            objUrl,
            (obj) => {
              console.log(`✅ OBJ模型加载成功: ${objUrl}`);
              resolve(obj);
            },
            (progress) => {
              if (progress.total > 0) {
                const percent = (progress.loaded / progress.total * 100).toFixed(2);
                console.log(`📊 OBJ加载进度: ${percent}%`);
              }
            },
            (error) => {
              console.error(`❌ OBJ加载失败: ${objUrl}`, error);
              reject(error);
            }
          );
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total * 100).toFixed(2);
            console.log(`📊 MTL加载进度: ${percent}%`);
          }
        },
        (error) => {
          console.error(`❌ MTL加载失败: ${mtlUrl}`, error);
          // MTL加载失败时，尝试只加载OBJ
          console.log(`⚠️ 尝试不使用材质加载OBJ...`);
          this.loadOBJ(objUrl).then(resolve).catch(reject);
        }
      );
    });
  }
  
  /**
   * 创建占位符模型（当GLTF模型不可用时）
   * @param {number} level - 进化等级
   * @returns {THREE.Group}
   */
  createFallbackModel(level) {
    const config = this.dinoModels[level];
    const group = new THREE.Group();
    group.userData.isFallback = true;
    
    // 根据等级创建不同形状的占位符
    let bodyGeometry, headGeometry;
    
    switch(level) {
      case 1: // 迅猛龙 - 小而灵活
        bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 8, 16);
        headGeometry = new THREE.ConeGeometry(0.2, 0.4, 8);
        break;
      case 2: // 三角龙 - 有角
        bodyGeometry = new THREE.BoxGeometry(0.6, 0.5, 1.0);
        headGeometry = new THREE.ConeGeometry(0.3, 0.5, 3); // 三角形头
        break;
      case 3: // 剑龙 - 背部有刺
        bodyGeometry = new THREE.BoxGeometry(0.5, 0.6, 1.2);
        headGeometry = new THREE.SphereGeometry(0.25, 8, 8);
        break;
      case 4: // 霸王龙 - 高大威猛
        bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
        headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.5);
        break;
      case 5: // 棘龙 - 背鳍
        bodyGeometry = new THREE.CapsuleGeometry(0.45, 1.4, 8, 16);
        headGeometry = new THREE.ConeGeometry(0.3, 0.6, 8);
        break;
      default:
        bodyGeometry = new THREE.CapsuleGeometry(0.5, 1, 8, 16);
        headGeometry = new THREE.SphereGeometry(0.3, 8, 8);
    }
    
    const material = new THREE.MeshLambertMaterial({ color: config.color });
    
    // 身体
    const body = new THREE.Mesh(bodyGeometry, material);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    
    // 头部
    const head = new THREE.Mesh(headGeometry, material);
    head.position.set(0, 0.8, 0.4);
    head.rotation.x = Math.PI / 6;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);
    
    // 剑龙和棘龙添加背刺/背鳍
    if (level === 3 || level === 5) {
      const spineGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.05);
      const spineMaterial = new THREE.MeshLambertMaterial({ 
        color: level === 3 ? 0xffaa00 : 0xaa00ff 
      });
      
      for (let i = 0; i < 4; i++) {
        const spine = new THREE.Mesh(spineGeometry, spineMaterial);
        spine.position.set(0, 0.3, -0.3 + i * 0.2);
        spine.rotation.x = Math.PI / 4;
        spine.castShadow = true;
        group.add(spine);
      }
    }
    
    // 三角龙添加角
    if (level === 2) {
      const hornGeometry = new THREE.ConeGeometry(0.05, 0.3, 8);
      const hornMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
      
      // 三个角
      const positions = [
        { x: 0, y: 1.0, z: 0.5 },     // 中间
        { x: 0.15, y: 0.9, z: 0.4 },  // 左
        { x: -0.15, y: 0.9, z: 0.4 }  // 右
      ];
      
      positions.forEach(pos => {
        const horn = new THREE.Mesh(hornGeometry, hornMaterial);
        horn.position.set(pos.x, pos.y, pos.z);
        horn.rotation.x = -Math.PI / 6;
        horn.castShadow = true;
        group.add(horn);
      });
    }
    
    group.userData.level = level;
    group.userData.name = config.name;
    
    return group;
  }
  
  /**
   * 创建动画混合器
   * @param {THREE.Object3D} model - 模型对象
   * @returns {THREE.AnimationMixer|null}
   */
  createAnimationMixer(model) {
    if (model.userData.animations && model.userData.animations.length > 0) {
      try {
        const mixer = new THREE.AnimationMixer(model);
        
        // 播放第一个动画（通常是待机或行走）
        const action = mixer.clipAction(model.userData.animations[0]);
        action.play();
        
        console.log(`🎬 动画已启动: ${model.userData.animations[0].name || '未命名'}`);
        return mixer;
      } catch (error) {
        console.warn(`⚠️ 动画混合器创建失败:`, error);
        return null;
      }
    }
    return null;
  }
  
  /**
   * 预加载所有模型
   * @returns {Promise<void>}
   */
  async preloadAllModels() {
    console.log('📦 开始预加载所有恐龙模型...');
    const promises = [];
    
    for (let level = 1; level <= 5; level++) {
      promises.push(this.loadDinoModel(level));
    }
    
    try {
      await Promise.all(promises);
      console.log('✅ 所有模型预加载完成！');
    } catch (error) {
      console.warn('⚠️ 部分模型加载失败，将使用占位符');
    }
  }
  
  /**
   * 清理缓存
   */
  dispose() {
    this.loadedModels.forEach((model, level) => {
      model.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          child.material?.dispose();
        }
      });
    });
    this.loadedModels.clear();
  }
}
