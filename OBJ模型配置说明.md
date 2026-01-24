# OBJ模型配置说明

## ✅ 模型格式更新（2026-01-24）

已成功将游戏模型从FBX格式切换为OBJ+MTL格式！

## 📦 当前模型文件列表

```
public/models/
├── Velociraptor.obj + Velociraptor.mtl  (迅猛龙) - 等级1
├── Triceratops.obj + Triceratops.mtl    (三角龙) - 等级2
├── Stegosaurus.obj + Stegosaurus.mtl    (剑龙)   - 等级3
├── Trex.obj + Trex.mtl                  (霸王龙) - 等级4
├── Parasaurolophus.obj + Parasaurolophus.mtl (副栉龙) - 等级5
└── Apatosaurus.obj + Apatosaurus.mtl    (雷龙-备用)
```

## 🔧 配置详情

### 模型配置
```javascript
1. 迅猛龙 (Velociraptor)
   - 文件: /models/Velociraptor.obj + .mtl
   - 缩放: 0.015
   - 颜色: 绿色 (0x00ff00)

2. 三角龙 (Triceratops)
   - 文件: /models/Triceratops.obj + .mtl
   - 缩放: 0.015
   - 颜色: 蓝色 (0x0088ff)

3. 剑龙 (Stegosaurus)
   - 文件: /models/Stegosaurus.obj + .mtl
   - 缩放: 0.015
   - 颜色: 橙色 (0xff8800)

4. 霸王龙 (Trex)
   - 文件: /models/Trex.obj + .mtl
   - 缩放: 0.015
   - 颜色: 红色 (0xff0000)

5. 副栉龙 (Parasaurolophus)
   - 文件: /models/Parasaurolophus.obj + .mtl
   - 缩放: 0.015
   - 颜色: 紫色 (0x8800ff)
```

## 🚀 启动游戏

### 步骤1: 确保服务器运行
```bash
npm run dev
```

### 步骤2: 清除浏览器缓存
- 按 `Ctrl+Shift+Delete`
- 选择"缓存的图片和文件"
- 点击"清除数据"

### 步骤3: 强制刷新页面
- Windows: `Ctrl+F5`
- Mac: `Cmd+Shift+R`

### 步骤4: 打开开发者工具
- 按 `F12` 打开控制台

### 步骤5: 点击"开始游戏"

### 步骤6: 检查控制台输出

**期望的输出：**
```
🦖 正在加载恐龙模型...
📦 开始加载模型: 迅猛龙 (/models/Velociraptor.obj)
📊 MTL加载进度: 100%
✅ MTL材质加载成功: /models/Velociraptor.mtl
📊 OBJ加载进度: 100%
✅ OBJ模型加载成功: /models/Velociraptor.obj
✅ 模型加载完成: 迅猛龙
✅ 恐龙模型已加载！初始等级: 1 (迅猛龙)
✨ 场景物体已生成！共 30 个可碰撞物体
✅ 游戏启动成功！
```

## 💡 OBJ格式的优势

相比FBX，OBJ格式具有：
- ✅ **更好的浏览器兼容性** - 无动画系统冲突
- ✅ **更快的加载速度** - 文件结构简单
- ✅ **更稳定** - 不会出现动画轨道错误
- ✅ **材质支持** - MTL文件提供完整材质信息
- ✅ **双面渲染** - 确保模型各角度可见

## 🔍 可能的加载情况

### ✅ 情况A: 完美加载
- 模型正常显示，带有材质
- 颜色纹理正确
- 阴影效果正常
- **这是最理想的情况！**

### ⚠️ 情况B: 无材质加载
- 模型显示为灰白色
- 结构正常，只是没有颜色
- 游戏功能完全正常
- **原因**: MTL文件加载失败

### 🎨 情况C: 使用占位符
- 显示彩色几何体（胶囊、方块等）
- 游戏功能完全正常
- **原因**: OBJ文件加载失败

## 🐛 故障排除

### 问题1: 看到404错误
```
GET http://localhost:5173/models/Velociraptor.obj 404 (Not Found)
```

**解决方案**:
1. 确认文件在 `public/models/` 目录下
2. 检查文件名大小写（必须完全匹配）
3. 重启开发服务器: `npm run dev`

### 问题2: 模型显示为黑色
**原因**: 缺少光照
**检查**: 场景应该已配置环境光和方向光

### 问题3: 模型太大或太小
**调整**: 修改 `src/systems/ModelLoader.js` 中的缩放值
```javascript
scale: 0.015  // 增大或减小这个数字
```
例如:
- `0.010` = 更小
- `0.020` = 更大

### 问题4: 模型旋转错误
可以在加载后调整旋转（需要修改代码）

## 🎮 游戏功能

当前完整功能列表：
- ✅ WASD移动控制
- ✅ 鼠标视角控制
- ✅ 碰撞检测系统
- ✅ 体积成长系统
- ✅ 5级进化系统（全部有OBJ模型）
- ✅ 物体重生系统
- ✅ 粒子特效
- ✅ 体积标签显示
- ✅ 实时UI更新

## 📊 技术细节

### 加载流程
1. **MTL加载器** 先加载材质文件
2. **材质预处理** preload()激活材质
3. **OBJ加载器** 应用材质并加载模型
4. **后处理** 设置阴影、双面渲染、缩放
5. **缓存** 存储模型供重复使用

### 材质处理
```javascript
- 双面渲染 (DoubleSide)
- 阴影投射 (castShadow)
- 阴影接收 (receiveShadow)
- 降级颜色 (如果MTL失败)
```

## 💻 验证命令

### Windows PowerShell
```powershell
# 查看OBJ文件
dir public\models\*.obj

# 查看MTL文件
dir public\models\*.mtl

# 查看文件详情
ls public\models\ | Format-Table Name, Length
```

### 命令行/终端
```bash
# 列出所有模型文件
ls -lh public/models/

# 检查文件是否存在
test -f public/models/Velociraptor.obj && echo "文件存在"
```

## 📝 下一步

如果模型成功加载：
1. 🎮 开始游戏，测试所有功能
2. 🦖 吞噬小物体来成长
3. ⭐ 收集经验来进化
4. 🔄 观察物体重生系统
5. 🎨 体验5个不同的恐龙模型

如果遇到问题：
1. 📋 复制控制台的完整输出
2. 🔍 查看具体的错误信息
3. 💬 提供错误信息以获取帮助

---

**最后更新**: 2026-01-24
**状态**: ✅ OBJ+MTL模型已配置
**预期**: 模型应该能正常加载显示
