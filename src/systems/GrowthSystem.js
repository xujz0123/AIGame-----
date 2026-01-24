/**
 * 成长系统
 * 处理玩家体型成长逻辑
 */

export class GrowthSystem {
  constructor(player) {
    this.player = player;
    this.baseScale = 1.0;
    this.currentScale = 1.0;
    this.maxScale = 3.0; // 最大可成长到3倍大小
    this.growthRate = 0.02; // 每次吞噬的成长率
  }
  
  /**
   * 根据经验值增长体型
   * @param {number} volumeEaten - 吞噬的物体体积
   */
  grow(volumeEaten) {
    // 计算成长量：体积越大，成长越多
    const growthAmount = volumeEaten * this.growthRate;
    
    // 增加体型
    this.currentScale += growthAmount;
    
    // 限制最大体型
    this.currentScale = Math.min(this.currentScale, this.maxScale);
    
    // 应用到玩家
    this.player.scale.set(this.currentScale, this.currentScale, this.currentScale);
    
    // 调整玩家Y位置（保持在地面上）
    this.player.position.y = this.currentScale;
    
    return {
      newScale: this.currentScale,
      growthAmount: growthAmount,
      reachedMax: this.currentScale >= this.maxScale
    };
  }
  
  /**
   * 获取当前体积
   * @returns {number} 体积值
   */
  getVolume() {
    return this.currentScale * this.currentScale * this.currentScale;
  }
  
  /**
   * 获取当前缩放
   * @returns {number} 缩放值
   */
  getScale() {
    return this.currentScale;
  }
  
  /**
   * 获取成长进度百分比
   * @returns {number} 0-100的百分比
   */
  getGrowthProgress() {
    return ((this.currentScale - this.baseScale) / (this.maxScale - this.baseScale)) * 100;
  }
  
  /**
   * 是否达到最大体型
   * @returns {boolean}
   */
  isMaxSize() {
    return this.currentScale >= this.maxScale;
  }
  
  /**
   * 重置体型（用于进化）
   * @param {number} newBaseScale - 新的基础大小
   */
  reset(newBaseScale = 1.0) {
    this.baseScale = newBaseScale;
    this.currentScale = newBaseScale;
    this.player.scale.set(newBaseScale, newBaseScale, newBaseScale);
    this.player.position.y = newBaseScale;
  }
  
  /**
   * 设置新的玩家对象（用于进化时模型替换）
   * @param {THREE.Object3D} newPlayer - 新玩家对象
   */
  setPlayer(newPlayer) {
    this.player = newPlayer;
    // 应用当前的缩放
    this.player.scale.set(this.currentScale, this.currentScale, this.currentScale);
    this.player.position.y = this.currentScale;
    console.log('🔄 GrowthSystem: 玩家对象已更新');
  }
}

