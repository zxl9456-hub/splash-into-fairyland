# 实机验证记录

四张 PNG 均为本地部署目录 `/dist/` 的 Three.js 实际截图，非附件概念图。截图使用桌面浏览器、极致画质。

- 54 项 Node.js 测试通过：见 test-results.txt。
- 原始模型哈希、动画和资源路径校验：见 asset-verification.json。
- WebGL 精致档位：完整 3D 启动、三种船只选择、声音开启、反击、船技、暂停／继续、失败结算／重新开局／回菜单已通过 UI 检查。详见 webgl-ui-check.json。
- WebGPU 极致档位：四季场景完成实机检查，冬季最终状态见 winter-runtime.json。
- 本机 WebGL 精致档位在密集春季场景约 12 FPS；WebGPU 更快，具体帧率随设备、分辨率和地点变化。高画质不是手机性能保证。
- 仍存在明显美术差距：程序化植物、积雪、地标造型、瀑布和光影未达到附件概念图的精细程度。
- GitHub 线上部署需要仓库登录与 Pages 配置；本记录不代表已上线。
