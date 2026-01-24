/**
 * 碰撞检测系统
 * 处理玩家与场景物体的碰撞检测
 */

import * as THREE from 'three';

export class CollisionSystem {
  constructor(scene) {
    this.scene = scene;
    this.objects = [];
  }
  
  /**
   * 添加可碰撞物体
   * @param {THREE.Mesh} mesh - 3D物体
   * @param {number} baseVolume - 基础体积值
   */
  addObject(mesh, baseVolume) {
    mesh.userData.baseVolume = baseVolume;
    mesh.userData.collidable = true;
    this.objects.push(mesh);
  }
  
  /**
   * 检测玩家与物体的碰撞
   * @param {THREE.Mesh} player - 玩家对象
   * @param {number} playerVolume - 玩家当前体积
   * @returns {Array} 碰撞的物体列表
   */
  checkCollision(player, playerVolume) {
    const collisions = [];
    
    // 计算玩家头部位置（碰撞判定点）
    const headPosition = player.position.clone();
    headPosition.y += 0.5; // 头部高度调整
    
    for (let i = this.objects.length - 1; i >= 0; i--) {
      const obj = this.objects[i];
      
      if (!obj.userData.collidable) continue;
      
      // 计算水平距离（忽略Y轴）
      const distance = Math.sqrt(
        Math.pow(player.position.x - obj.position.x, 2) +
        Math.pow(player.position.z - obj.position.z, 2)
      );
      
      // 碰撞半径：玩家半径 + 物体半径
      const playerSize = player.scale.x * 1.5; // 玩家大小
      const objSize = this.getObjectSize(obj);
      const collisionRadius = playerSize + objSize;
      
      // 检测是否发生碰撞
      if (distance < collisionRadius) {
        const objVolume = this.getVolume(obj);
        
        // 只能攻击比自己小的物体
        if (objVolume < playerVolume * 0.8) {
          collisions.push({
            object: obj,
            volume: objVolume,
            index: i,
            position: obj.position.clone()
          });
        }
      }
    }
    
    return collisions;
  }
  
  /**
   * 获取物体的体积
   * @param {THREE.Mesh} obj - 物体
   * @returns {number} 体积值
   */
  getVolume(obj) {
    const scale = obj.scale;
    return obj.userData.baseVolume * scale.x * scale.y * scale.z;
  }
  
  /**
   * 获取物体的大小（用于碰撞半径）
   * @param {THREE.Mesh} obj - 物体
   * @returns {number} 大小值
   */
  getObjectSize(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    return Math.max(size.x, size.y, size.z) / 2;
  }
  
  /**
   * 移除物体
   * @param {number} index - 物体索引
   */
  removeObject(index) {
    const obj = this.objects[index];
    if (obj) {
      this.scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
      this.objects.splice(index, 1);
    }
  }
  
  /**
   * 移除指定物体
   * @param {THREE.Mesh} object - 要移除的物体
   */
  removeObjectByReference(object) {
    const index = this.objects.indexOf(object);
    if (index !== -1) {
      this.removeObject(index);
    }
  }
  
  /**
   * 获取所有可碰撞物体
   * @returns {Array} 物体列表
   */
  getObjects() {
    return this.objects;
  }
  
  /**
   * 获取物体数量
   * @returns {number} 数量
   */
  getObjectCount() {
    return this.objects.length;
  }
  
  /**
   * 清除所有物体
   */
  clear() {
    this.objects.forEach(obj => {
      this.scene.remove(obj);
      obj.geometry.dispose();
      obj.material.dispose();
    });
    this.objects = [];
  }
}
