/**
 * 体积标签系统
 * 在物体上方显示体积数值
 */

import * as THREE from 'three';

export class VolumeLabel {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.labels = [];
  }
  
  /**
   * 创建体积标签
   * @param {THREE.Mesh} object - 物体
   * @param {number} volume - 体积值
   * @param {string} color - 颜色
   */
  createLabel(object, volume, color = '#ffffff') {
    // 创建canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    
    // 绘制背景
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.roundRect(10, 10, 236, 108, 10);
    context.fill();
    
    // 绘制文字
    context.fillStyle = color;
    context.font = 'bold 48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(volume.toFixed(2), 128, 64);
    
    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // 创建精灵材质
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false
    });
    
    // 创建精灵
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(2, 1, 1);
    
    // 保存引用
    object.userData.volumeSprite = sprite;
    object.userData.volumeValue = volume;
    
    this.scene.add(sprite);
    this.labels.push({ object, sprite, volume });
    
    return sprite;
  }
  
  /**
   * 更新所有标签位置
   */
  update() {
    this.labels.forEach(({ object, sprite }) => {
      if (object && sprite) {
        // 获取物体大小
        const box = new THREE.Box3().setFromObject(object);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        // 标签位置：物体上方
        sprite.position.copy(object.position);
        sprite.position.y += size.y / 2 + 1;
      }
    });
  }
  
  /**
   * 移除标签
   * @param {THREE.Mesh} object - 物体
   */
  removeLabel(object) {
    const index = this.labels.findIndex(item => item.object === object);
    if (index !== -1) {
      const { sprite } = this.labels[index];
      this.scene.remove(sprite);
      sprite.material.map.dispose();
      sprite.material.dispose();
      this.labels.splice(index, 1);
    }
  }
  
  /**
   * 更新标签颜色和数值
   * @param {THREE.Mesh} object - 物体
   * @param {number} volume - 新体积
   * @param {string} color - 新颜色
   */
  updateLabel(object, volume, color = '#ffffff') {
    if (object.userData.volumeSprite) {
      this.removeLabel(object);
      this.createLabel(object, volume, color);
    }
  }
}
