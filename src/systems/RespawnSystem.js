/**
 * 物体重生系统
 * 处理被吞噬物体的重生逻辑
 */

import * as THREE from 'three';

export class RespawnSystem {
  constructor(scene, collisionSystem, volumeLabel, player) {
    this.scene = scene;
    this.collisionSystem = collisionSystem;
    this.volumeLabel = volumeLabel;
    this.player = player;
    
    // 重生队列
    this.respawnQueue = [];
    
    // 重生配置
    this.config = {
      respawnDelay: 30000, // 30秒重生时间
      minDistanceFromPlayer: 20, // 距离玩家最小距离
      maxDistanceFromPlayer: 40, // 距离玩家最大距离
      spawnHeight: 1 // 生成高度
    };
    
    // 物体模板库
    this.objectTemplates = [
      { geometry: new THREE.ConeGeometry(0.3, 1, 8), color: 0x2ecc71, volume: 0.3, name: '小草' },
      { geometry: new THREE.SphereGeometry(0.4, 8, 8), color: 0x27ae60, volume: 0.5, name: '灌木' },
      { geometry: new THREE.BoxGeometry(0.6, 0.6, 0.6), color: 0x3498db, volume: 0.7, name: '木桩' },
      { geometry: new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8), color: 0x8b4513, volume: 0.9, name: '小树' },
      { geometry: new THREE.BoxGeometry(1, 1, 1), color: 0xe67e22, volume: 1.2, name: '石头' },
      { geometry: new THREE.DodecahedronGeometry(0.6), color: 0x95a5a6, volume: 1.5, name: '栅栏' },
      { geometry: new THREE.CylinderGeometry(0.4, 0.4, 2, 8), color: 0x34495e, volume: 1.8, name: '大树' }
    ];
  }
  
  /**
   * 添加物体到重生队列
   * @param {THREE.Mesh} object - 被吞噬的物体
   * @param {number} volume - 物体体积
   */
  addToRespawnQueue(object, volume) {
    // 记录物体信息
    const respawnInfo = {
      geometry: object.geometry.clone(),
      color: object.material.color.getHex(),
      volume: volume,
      respawnTime: Date.now() + this.config.respawnDelay,
      name: object.userData.name || '未命名物体'
    };
    
    this.respawnQueue.push(respawnInfo);
    
    console.log(`🕐 ${respawnInfo.name} 将在 ${this.config.respawnDelay / 1000} 秒后重生`);
  }
  
  /**
   * 更新重生系统
   */
  update() {
    const currentTime = Date.now();
    
    // 检查重生队列
    for (let i = this.respawnQueue.length - 1; i >= 0; i--) {
      const respawnInfo = this.respawnQueue[i];
      
      if (currentTime >= respawnInfo.respawnTime) {
        // 时间到，重生物体
        this.respawnObject(respawnInfo);
        
        // 从队列移除
        this.respawnQueue.splice(i, 1);
      }
    }
  }
  
  /**
   * 重生物体
   * @param {Object} respawnInfo - 重生信息
   */
  respawnObject(respawnInfo) {
    // 生成远离玩家的位置
    const position = this.getSpawnPosition();
    
    // 创建新物体
    const material = new THREE.MeshLambertMaterial({ color: respawnInfo.color });
    const mesh = new THREE.Mesh(respawnInfo.geometry, material);
    
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.name = respawnInfo.name;
    
    // 添加到场景
    this.scene.add(mesh);
    
    // 添加到碰撞系统
    this.collisionSystem.addObject(mesh, respawnInfo.volume);
    
    // 添加体积标签
    const playerVolume = this.player.scale.x ** 3;
    const canEat = respawnInfo.volume < playerVolume * 0.8;
    const labelColor = canEat ? '#00ff00' : '#ff0000';
    this.volumeLabel.createLabel(mesh, respawnInfo.volume, labelColor);
    
    console.log(`✨ ${respawnInfo.name} 已重生！位置: (${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
  }
  
  /**
   * 获取重生位置（远离玩家）
   * @returns {THREE.Vector3} 重生位置
   */
  getSpawnPosition() {
    const playerPos = this.player.position;
    const minDist = this.config.minDistanceFromPlayer;
    const maxDist = this.config.maxDistanceFromPlayer;
    
    // 随机角度
    const angle = Math.random() * Math.PI * 2;
    
    // 随机距离（在最小和最大距离之间）
    const distance = minDist + Math.random() * (maxDist - minDist);
    
    // 计算位置
    const x = playerPos.x + Math.cos(angle) * distance;
    const z = playerPos.z + Math.sin(angle) * distance;
    const y = this.config.spawnHeight;
    
    return new THREE.Vector3(x, y, z);
  }
  
  /**
   * 随机生成新物体（用于补充场景物体）
   * @param {number} count - 生成数量
   */
  spawnRandomObjects(count = 1) {
    for (let i = 0; i < count; i++) {
      const template = this.objectTemplates[Math.floor(Math.random() * this.objectTemplates.length)];
      const position = this.getSpawnPosition();
      
      const material = new THREE.MeshLambertMaterial({ color: template.color });
      const mesh = new THREE.Mesh(template.geometry.clone(), material);
      
      mesh.position.copy(position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.name = template.name;
      
      this.scene.add(mesh);
      this.collisionSystem.addObject(mesh, template.volume);
      
      const playerVolume = this.player.scale.x ** 3;
      const canEat = template.volume < playerVolume * 0.8;
      const labelColor = canEat ? '#00ff00' : '#ff0000';
      this.volumeLabel.createLabel(mesh, template.volume, labelColor);
      
      console.log(`🌟 新物体生成: ${template.name}`);
    }
  }
  
  /**
   * 获取重生队列长度
   * @returns {number}
   */
  getQueueLength() {
    return this.respawnQueue.length;
  }
  
  /**
   * 获取最近重生时间
   * @returns {number} 秒数，-1表示队列为空
   */
  getNextRespawnTime() {
    if (this.respawnQueue.length === 0) return -1;
    
    const nextRespawn = Math.min(...this.respawnQueue.map(r => r.respawnTime));
    const timeLeft = Math.max(0, nextRespawn - Date.now());
    
    return Math.ceil(timeLeft / 1000);
  }
  
  /**
   * 清空重生队列
   */
  clearQueue() {
    this.respawnQueue = [];
  }
}
