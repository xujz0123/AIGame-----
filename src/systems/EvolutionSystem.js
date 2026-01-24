/**
 * 进化系统
 * 处理恐龙进化逻辑和进化阶段管理
 */

import * as THREE from 'three';

export class EvolutionSystem {
  constructor(player, scene, modelLoader) {
    this.player = player;
    this.scene = scene;
    this.modelLoader = modelLoader;
    
    // 进化等级配置
    this.evolutionStages = [
      { 
        level: 1, 
        name: '迅猛龙', 
        expRequired: 0, 
        color: 0x00ff00, 
        baseScale: 1.0,
        description: '灵活快速'
      },
      { 
        level: 2, 
        name: '三角龙', 
        expRequired: 100, 
        color: 0x0088ff, 
        baseScale: 1.0,
        description: '防御力强'
      },
      { 
        level: 3, 
        name: '剑龙', 
        expRequired: 300, 
        color: 0xff8800, 
        baseScale: 1.0,
        description: '攻击范围大'
      },
      { 
        level: 4, 
        name: '霸王龙', 
        expRequired: 600, 
        color: 0xff0000, 
        baseScale: 1.0,
        description: '强大攻击力'
      },
      { 
        level: 5, 
        name: '副栉龙', 
        expRequired: 1000, 
        color: 0x8800ff, 
        baseScale: 1.0,
        description: '终极形态'
      }
    ];
    
    this.currentLevel = 1;
    this.isEvolving = false;
  }
  
  /**
   * 检查是否可以进化
   * @param {number} experience - 当前经验值
   * @returns {Object|null} 进化信息或null
   */
  checkEvolution(experience) {
    if (this.isEvolving) return null;
    
    // 查找下一个进化等级
    const nextStage = this.evolutionStages.find(
      stage => stage.level === this.currentLevel + 1 && experience >= stage.expRequired
    );
    
    return nextStage || null;
  }
  
  /**
   * 执行进化
   * @param {number} experience - 当前经验值
   * @param {Function} onComplete - 进化完成回调
   * @returns {boolean} 是否成功进化
   */
  async evolve(experience, onComplete) {
    const nextStage = this.checkEvolution(experience);
    
    if (!nextStage) return false;
    
    this.isEvolving = true;
    
    console.log(`🎉 开始进化！从 ${this.getCurrentStage().name} → ${nextStage.name}`);
    
    // 显示进化UI
    this.showEvolutionUI(nextStage);
    
    // 进化动画
    await this.playEvolutionAnimation(nextStage);
    
    // 更新等级
    this.currentLevel = nextStage.level;
    
    // 替换模型（如果有模型加载器）
    if (this.modelLoader) {
      await this.replacePlayerModel(nextStage.level);
    } else {
      // 没有模型加载器，只改变颜色
      this.updatePlayerColor(nextStage.color);
    }
    
    this.isEvolving = false;
    
    // 隐藏进化UI
    this.hideEvolutionUI();
    
    console.log(`✨ 进化完成！现在是 ${nextStage.name}`);
    
    // 回调
    if (onComplete) {
      onComplete(nextStage);
    }
    
    return true;
  }
  
  /**
   * 替换玩家模型
   * @param {number} level - 新的等级
   */
  async replacePlayerModel(level) {
    const oldPlayer = this.player;
    const oldPosition = oldPlayer.position.clone();
    const oldRotation = oldPlayer.rotation.clone();
    const oldScale = oldPlayer.scale.clone();
    
    // 加载新模型
    console.log(`🔄 加载新模型: 等级 ${level}`);
    const newModel = await this.modelLoader.loadDinoModel(level);
    
    // 设置新模型属性
    newModel.position.copy(oldPosition);
    newModel.rotation.copy(oldRotation);
    newModel.scale.copy(oldScale);
    
    // 复制 userData
    if (oldPlayer.userData) {
      Object.assign(newModel.userData, oldPlayer.userData);
    }
    
    // 从场景中移除旧模型
    this.scene.remove(oldPlayer);
    
    // 添加新模型到场景
    this.scene.add(newModel);
    
    // 更新引用
    this.player = newModel;
    
    console.log(`✅ 模型替换完成`);
    
    // 通知主游戏更新玩家引用
    window.dispatchEvent(new CustomEvent('playerModelChanged', { 
      detail: { newPlayer: newModel } 
    }));
  }
  
  /**
   * 更新玩家颜色（占位符模式）
   * @param {number} color - 新颜色
   */
  updatePlayerColor(color) {
    this.player.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.color.setHex(color);
      }
    });
  }
  
  /**
   * 播放进化动画
   * @param {Object} nextStage - 下一阶段信息
   * @returns {Promise<void>}
   */
  playEvolutionAnimation(nextStage) {
    return new Promise((resolve) => {
      const duration = 3000; // 3秒动画
      const startTime = Date.now();
      
      // 创建发光效果（使用简单的球体）
      const glowGeometry = new THREE.SphereGeometry(2, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: nextStage.color,
        transparent: true,
        opacity: 0.5,
        side: THREE.BackSide
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      glowMesh.position.copy(this.player.position);
      this.scene.add(glowMesh);
      
      // 动画循环
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 旋转玩家
        this.player.rotation.y = progress * Math.PI * 4;
        
        // 发光球脉动效果
        const pulse = Math.sin(progress * Math.PI * 6) * 0.3 + 1;
        glowMesh.scale.setScalar(pulse);
        
        // 透明度变化
        glowMaterial.opacity = 0.5 * (1 - progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // 动画结束
          this.scene.remove(glowMesh);
          glowGeometry.dispose();
          glowMaterial.dispose();
          this.player.rotation.y = 0;
          
          resolve();
        }
      };
      
      animate();
    });
  }
  
  /**
   * 显示进化UI
   * @param {Object} nextStage - 下一阶段信息
   */
  showEvolutionUI(nextStage) {
    const overlay = document.getElementById('evolution-overlay');
    const nameEl = document.getElementById('evolution-name');
    const descEl = document.getElementById('evolution-desc');
    const fromEl = document.getElementById('evolution-from');
    const toEl = document.getElementById('evolution-to');
    
    if (overlay) {
      overlay.style.display = 'flex';
      
      if (nameEl) nameEl.textContent = nextStage.name;
      if (descEl) descEl.textContent = nextStage.description;
      if (fromEl) fromEl.textContent = this.getCurrentStage().name;
      if (toEl) toEl.textContent = nextStage.name;
    }
  }
  
  /**
   * 隐藏进化UI
   */
  hideEvolutionUI() {
    const overlay = document.getElementById('evolution-overlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }
  
  /**
   * 获取当前阶段信息
   * @returns {Object} 当前阶段
   */
  getCurrentStage() {
    return this.evolutionStages.find(
      stage => stage.level === this.currentLevel
    );
  }
  
  /**
   * 获取下一阶段信息
   * @returns {Object|null} 下一阶段或null
   */
  getNextStage() {
    return this.evolutionStages.find(
      stage => stage.level === this.currentLevel + 1
    );
  }
  
  /**
   * 获取当前等级
   * @returns {number}
   */
  getLevel() {
    return this.currentLevel;
  }
  
  /**
   * 获取当前恐龙名称
   * @returns {string}
   */
  getCurrentName() {
    return this.getCurrentStage().name;
  }
  
  /**
   * 是否是最终形态
   * @returns {boolean}
   */
  isMaxLevel() {
    return this.currentLevel >= this.evolutionStages.length;
  }
  
  /**
   * 获取到下一进化所需经验
   * @param {number} currentExp - 当前经验值
   * @returns {number} 还需经验值，-1表示已满级
   */
  getExpToNextEvolution(currentExp) {
    const nextStage = this.getNextStage();
    if (!nextStage) return -1;
    return Math.max(0, nextStage.expRequired - currentExp);
  }
}
