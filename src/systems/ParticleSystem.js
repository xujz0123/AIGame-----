/**
 * 粒子特效系统
 * 处理爆炸等视觉特效
 */

import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
  }
  
  /**
   * 创建爆炸特效
   * @param {THREE.Vector3} position - 爆炸位置
   * @param {number} color - 颜色
   * @param {number} count - 粒子数量
   */
  createExplosion(position, color = 0xff6600, count = 30) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    const colors = [];
    
    // 生成粒子
    for (let i = 0; i < count; i++) {
      // 初始位置
      positions.push(position.x, position.y, position.z);
      
      // 随机速度（向四周扩散）
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 3 + Math.random() * 3;
      
      velocities.push(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 2, // 向上偏移
        Math.sin(phi) * Math.sin(theta) * speed
      );
      
      // 颜色（带点随机变化）
      const c = new THREE.Color(color);
      c.r += (Math.random() - 0.5) * 0.2;
      c.g += (Math.random() - 0.5) * 0.2;
      c.b += (Math.random() - 0.5) * 0.2;
      colors.push(c.r, c.g, c.b);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const particleSystem = new THREE.Points(geometry, material);
    particleSystem.userData.velocities = velocities;
    particleSystem.userData.lifetime = 1.0;
    particleSystem.userData.maxLifetime = 1.0;
    
    this.scene.add(particleSystem);
    this.particles.push(particleSystem);
    
    return particleSystem;
  }
  
  /**
   * 创建收集特效（物体飞向玩家）
   * @param {THREE.Vector3} position - 起始位置
   * @param {number} color - 颜色
   */
  createCollectEffect(position, color = 0x00ff00) {
    const geometry = new THREE.SphereGeometry(0.3, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    sphere.userData.isCollectEffect = true;
    sphere.userData.lifetime = 0.5;
    
    this.scene.add(sphere);
    this.particles.push(sphere);
    
    return sphere;
  }
  
  /**
   * 更新粒子系统
   * @param {number} deltaTime - 时间增量
   */
  update(deltaTime) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      if (particle.userData.isCollectEffect) {
        // 收集特效：向上移动并淡出
        particle.position.y += 3 * deltaTime;
        particle.userData.lifetime -= deltaTime;
        particle.material.opacity = particle.userData.lifetime * 1.6;
        
        if (particle.userData.lifetime <= 0) {
          this.removeParticle(i);
        }
      } else {
        // 爆炸特效
        const positions = particle.geometry.attributes.position.array;
        const velocities = particle.userData.velocities;
        
        // 更新每个粒子的位置
        for (let j = 0; j < positions.length; j += 3) {
          positions[j] += velocities[j] * deltaTime;
          positions[j + 1] += velocities[j + 1] * deltaTime;
          positions[j + 2] += velocities[j + 2] * deltaTime;
          
          // 应用重力
          velocities[j + 1] -= 9.8 * deltaTime;
        }
        
        particle.geometry.attributes.position.needsUpdate = true;
        
        // 更新生命周期和透明度
        particle.userData.lifetime -= deltaTime;
        const lifeRatio = particle.userData.lifetime / particle.userData.maxLifetime;
        particle.material.opacity = lifeRatio;
        
        // 移除死亡的粒子
        if (particle.userData.lifetime <= 0) {
          this.removeParticle(i);
        }
      }
    }
  }
  
  /**
   * 移除粒子
   * @param {number} index - 粒子索引
   */
  removeParticle(index) {
    const particle = this.particles[index];
    this.scene.remove(particle);
    particle.geometry.dispose();
    particle.material.dispose();
    this.particles.splice(index, 1);
  }
  
  /**
   * 清除所有粒子
   */
  clear() {
    this.particles.forEach(particle => {
      this.scene.remove(particle);
      particle.geometry.dispose();
      particle.material.dispose();
    });
    this.particles = [];
  }
}
