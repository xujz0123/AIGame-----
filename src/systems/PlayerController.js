/**
 * 玩家控制器
 * 处理WASD移动和鼠标视角控制
 */

import * as THREE from 'three';

export class PlayerController {
  constructor(player, camera) {
    this.player = player;
    this.camera = camera;
    
    // 移动参数
    this.moveSpeed = 5;
    this.rotateSpeed = Math.PI;
    this.sprintMultiplier = 1.5;
    
    // 键盘状态
    this.keys = {
      w: false,
      a: false,
      s: false,
      d: false,
      shift: false,
      space: false
    };
    
    // 鼠标控制
    this.mouseDown = false;
    this.mouseSensitivity = 0.002;
    this.cameraAngle = 0;
    this.cameraPitch = 0.3;
    
    // 相机参数
    this.cameraDistance = 10;
    this.cameraHeight = 5;
    
    this.setupInputListeners();
  }
  
  setupInputListeners() {
    // 键盘按下
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) {
        this.keys[key] = true;
        e.preventDefault();
      }
    });
    
    // 键盘松开
    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      if (key in this.keys) {
        this.keys[key] = false;
        e.preventDefault();
      }
    });
    
    // 鼠标控制（右键拖拽或点击拖拽）
    window.addEventListener('mousedown', (e) => {
      if (e.button === 2 || e.button === 0) { // 右键或左键
        this.mouseDown = true;
        e.preventDefault();
      }
    });
    
    window.addEventListener('mouseup', () => {
      this.mouseDown = false;
    });
    
    window.addEventListener('mousemove', (e) => {
      if (this.mouseDown) {
        this.cameraAngle -= e.movementX * this.mouseSensitivity;
        this.cameraPitch += e.movementY * this.mouseSensitivity;
        
        // 限制俯仰角度
        this.cameraPitch = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, this.cameraPitch));
      }
    });
    
    // 禁用右键菜单
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // 鼠标滚轮控制相机距离
    window.addEventListener('wheel', (e) => {
      this.cameraDistance += e.deltaY * 0.01;
      this.cameraDistance = Math.max(5, Math.min(20, this.cameraDistance));
      e.preventDefault();
    }, { passive: false });
  }
  
  update(deltaTime) {
    // 计算移动方向
    const direction = new THREE.Vector3();
    
    if (this.keys.w) direction.z -= 1;
    if (this.keys.s) direction.z += 1;
    if (this.keys.a) direction.x -= 1;
    if (this.keys.d) direction.x += 1;
    
    // 如果有移动输入
    if (direction.length() > 0) {
      direction.normalize();
      
      // 根据相机角度调整移动方向
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngle);
      
      // 应用速度（包括加速）
      const speed = this.moveSpeed * (this.keys.shift ? this.sprintMultiplier : 1.0);
      this.player.position.x += direction.x * speed * deltaTime;
      this.player.position.z += direction.z * speed * deltaTime;
      
      // 让恐龙朝向移动方向
      const targetRotation = Math.atan2(direction.x, direction.z);
      this.player.rotation.y = this.smoothRotate(
        this.player.rotation.y,
        targetRotation,
        this.rotateSpeed * deltaTime
      );
    }
    
    // 跳跃（可选）
    if (this.keys.space && this.player.position.y <= 1.1) {
      this.player.userData.velocityY = 5; // 跳跃速度
    }
    
    // 简单的重力（如果启用跳跃）
    if (this.player.userData.velocityY !== undefined) {
      this.player.userData.velocityY -= 15 * deltaTime; // 重力
      this.player.position.y += this.player.userData.velocityY * deltaTime;
      
      // 地面检测
      if (this.player.position.y <= 1) {
        this.player.position.y = 1;
        this.player.userData.velocityY = 0;
      }
    }
    
    // 更新相机位置（第三人称跟随）
    this.updateCamera();
  }
  
  updateCamera() {
    // 计算相机位置
    const cameraOffset = new THREE.Vector3(
      Math.sin(this.cameraAngle) * Math.cos(this.cameraPitch) * this.cameraDistance,
      Math.sin(this.cameraPitch) * this.cameraDistance,
      Math.cos(this.cameraAngle) * Math.cos(this.cameraPitch) * this.cameraDistance
    );
    
    const targetCameraPosition = this.player.position.clone().add(cameraOffset);
    
    // 平滑相机移动
    this.camera.position.lerp(targetCameraPosition, 0.1);
    
    // 相机看向玩家
    const lookAtTarget = this.player.position.clone();
    lookAtTarget.y += 1; // 看向恐龙的中心位置
    this.camera.lookAt(lookAtTarget);
  }
  
  // 平滑旋转
  smoothRotate(current, target, maxDelta) {
    let delta = target - current;
    
    // 处理角度环绕
    while (delta > Math.PI) delta -= Math.PI * 2;
    while (delta < -Math.PI) delta += Math.PI * 2;
    
    // 限制旋转速度
    delta = Math.max(-maxDelta, Math.min(maxDelta, delta));
    
    return current + delta;
  }
  
  // 获取移动状态（用于动画）
  isMoving() {
    return this.keys.w || this.keys.a || this.keys.s || this.keys.d;
  }
  
  // 获取当前速度（用于音效等）
  getSpeed() {
    const direction = new THREE.Vector3();
    if (this.keys.w) direction.z -= 1;
    if (this.keys.s) direction.z += 1;
    if (this.keys.a) direction.x -= 1;
    if (this.keys.d) direction.x += 1;
    
    if (direction.length() > 0) {
      return this.moveSpeed * (this.keys.shift ? this.sprintMultiplier : 1.0);
    }
    return 0;
  }
  
  // 设置新的玩家对象（用于进化时模型替换）
  setPlayer(newPlayer) {
    this.player = newPlayer;
    console.log('🔄 PlayerController: 玩家对象已更新');
  }
}

