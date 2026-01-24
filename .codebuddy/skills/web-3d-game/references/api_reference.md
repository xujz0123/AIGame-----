# Three.js 快速参考

## 常用几何体

### 基础几何体
```javascript
// 立方体
new THREE.BoxGeometry(width, height, depth)

// 球体
new THREE.SphereGeometry(radius, widthSegments, heightSegments)

// 圆柱体
new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments)

// 圆锥体
new THREE.ConeGeometry(radius, height, radialSegments)

// 胶囊体
new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments)

// 平面
new THREE.PlaneGeometry(width, height)

// 圆环
new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments)
```

## 材质类型

### 基础材质
```javascript
// Lambert材质 (受光照影响，无高光)
new THREE.MeshLambertMaterial({ color: 0xff0000 })

// Phong材质 (有高光反射)
new THREE.MeshPhongMaterial({ 
  color: 0xff0000, 
  shininess: 100 
})

// 标准材质 (PBR，最真实)
new THREE.MeshStandardMaterial({
  color: 0xff0000,
  metalness: 0.5,
  roughness: 0.5
})

// 基础材质 (不受光照影响)
new THREE.MeshBasicMaterial({ color: 0xff0000 })

// 卡通材质
new THREE.MeshToonMaterial({ color: 0xff0000 })
```

## 加载GLTF模型

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

loader.load(
  'path/to/model.glb',
  (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    
    // 访问动画
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(model);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
    }
  },
  (progress) => {
    console.log('Loading:', (progress.loaded / progress.total * 100) + '%');
  },
  (error) => {
    console.error('Error loading model:', error);
  }
);
```

## 常用向量操作

```javascript
const vec = new THREE.Vector3(x, y, z);

// 长度和归一化
vec.length()           // 获取长度
vec.normalize()        // 归一化为单位向量
vec.setLength(5)       // 设置长度

// 距离计算
vec.distanceTo(otherVec)

// 向量运算
vec.add(otherVec)      // 加法
vec.sub(otherVec)      // 减法
vec.multiply(otherVec) // 乘法
vec.multiplyScalar(2)  // 标量乘法

// 插值
vec.lerp(targetVec, 0.1) // 线性插值

// 旋转
vec.applyAxisAngle(axis, angle)
vec.applyQuaternion(quaternion)
```

## 相机设置

```javascript
// 透视相机
const camera = new THREE.PerspectiveCamera(
  75,                                    // FOV (视野角度)
  window.innerWidth / window.innerHeight, // 宽高比
  0.1,                                   // 近裁剪面
  1000                                   // 远裁剪面
);

// 正交相机 (2D游戏或UI)
const camera = new THREE.OrthographicCamera(
  left, right, top, bottom, near, far
);

// 相机控制
camera.position.set(x, y, z);
camera.lookAt(targetVector);
```

## 光照设置

```javascript
// 环境光 (全局均匀照明)
const ambient = new THREE.AmbientLight(0xffffff, 0.5);

// 方向光 (类似太阳)
const directional = new THREE.DirectionalLight(0xffffff, 1);
directional.position.set(10, 10, 5);
directional.castShadow = true;

// 点光源
const point = new THREE.PointLight(0xffffff, 1, 100);
point.position.set(0, 5, 0);

// 聚光灯
const spot = new THREE.SpotLight(0xffffff, 1);
spot.position.set(0, 10, 0);
spot.angle = Math.PI / 6;
```

## 阴影设置

```javascript
// 渲染器启用阴影
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 柔和阴影

// 光源投射阴影
light.castShadow = true;
light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;

// 物体投射和接收阴影
mesh.castShadow = true;    // 投射阴影
mesh.receiveShadow = true; // 接收阴影
```

## 常用数学工具

```javascript
// 角度弧度转换
THREE.MathUtils.degToRad(90)  // 转为弧度
THREE.MathUtils.radToDeg(Math.PI / 2) // 转为角度

// 限制范围
THREE.MathUtils.clamp(value, min, max)

// 线性插值
THREE.MathUtils.lerp(start, end, alpha)

// 平滑插值
THREE.MathUtils.smoothstep(value, min, max)
```

## 免费3D资源网站

- **Sketchfab**: https://sketchfab.com (大量免费GLTF模型)
- **Mixamo**: https://www.mixamo.com (角色和动画)
- **Poly Haven**: https://polyhaven.com (高质量PBR材质)
- **Quaternius**: http://quaternius.com (低多边形资产)
- **Kenney**: https://www.kenney.nl (游戏素材包)

## 性能分析工具

```javascript
// Stats.js - FPS监控
import Stats from 'three/addons/libs/stats.module.js';
const stats = new Stats();
document.body.appendChild(stats.dom);

// 在动画循环中
function animate() {
  stats.begin();
  // ... 渲染代码 ...
  stats.end();
}
```

## 常见问题排查

**模型不显示:**
- 检查相机位置和朝向
- 确认模型scale不为0
- 查看浏览器控制台错误

**性能低下:**
- 减少多边形数量
- 降低阴影分辨率
- 使用LOD (Level of Detail)
- 减少draw calls (合并几何体)

**材质看起来不对:**
- 检查是否添加了光源
- 确认材质类型 (Basic材质不受光照影响)
- 查看法线方向是否正确
