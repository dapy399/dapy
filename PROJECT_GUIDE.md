# React18 通用后台管理系统 — 项目指南

## 一、启动命令

### 当前项目架构
本项目采用 **纯前端 + Mock 数据** 的架构，**没有独立后端服务**。所有数据通过本地 Mock 模拟。

### 启动命令

```bash
# 进入项目目录
cd react-admin

# 安装依赖（首次运行）
npm install

# 开发模式启动（带热更新）
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

启动后访问：`http://localhost:3000`

**登录账号**：`admin` / `123456`

---

## 二、项目实现流程与思路

### 2.1 整体架构设计

```
react-admin/
├── public/                    # 静态资源
├── src/
│   ├── api/                   # API 接口层 + Mock 数据
│   │   ├── index.ts           # 接口定义
│   │   └── mock.ts            # Mock 数据
│   ├── components/            # 公共组件（待扩展）
│   ├── layouts/               # 布局组件
│   │   ├── MainLayout.tsx     # 主布局框架
│   │   ├── Sidebar.tsx        # 侧边栏菜单
│   │   ├── HeaderBar.tsx      # 顶部导航栏
│   │   └── TabBar.tsx         # 标签页导航
│   ├── router/                # 路由配置
│   │   ├── index.tsx          # 路由表定义
│   │   └── auth.tsx           # 路由守卫
│   ├── store/                 # 全局状态管理
│   │   └── index.tsx          # Context + Reducer
│   ├── styles/                # 样式文件
│   ├── types/                 # TypeScript 类型定义
│   ├── utils/                 # 工具函数
│   │   ├── index.ts           # 通用工具
│   │   ├── request.ts         # Axios 请求封装
│   │   └── storage.ts         # 本地存储封装
│   ├── views/                 # 页面视图
│   │   ├── login/             # 登录页
│   │   ├── dashboard/         # 工作台
│   │   ├── system/            # 系统管理
│   │   │   ├── user/          # 用户管理
│   │   │   ├── menu/          # 菜单管理
│   │   │   ├── role/          # 角色管理
│   │   │   └── dept/          # 部门管理
│   │   └── order/             # 订单管理
│   │       ├── list/          # 订单列表
│   │       ├── cluster/       # 订单聚合
│   │       └── driver/        # 司机列表
│   ├── App.tsx                # 根组件（主题配置）
│   └── main.tsx               # 入口文件
├── vite.config.ts             # Vite 配置
├── tsconfig.app.json          # TypeScript 配置
└── package.json               # 依赖管理
```

---

### 2.2 分步实现思路

#### 第一步：项目初始化

**目标**：搭建 React18 + TypeScript + Vite 基础工程

**操作**：
1. `npm create vite@latest react-admin -- --template react-ts`
2. 安装核心依赖：`react-router-dom`、`antd`、`axios`、`echarts`、`echarts-for-react`、`less`
3. 配置 Vite 路径别名（`@/xxx` → `src/xxx`）
4. 配置 TypeScript `paths` 映射

**设计决策**：
- 选用 Vite 而非 CRA：冷启动更快、构建更优、配置更灵活
- 选用 AntD 5.x：成熟的组件库，内置主题系统支持深色模式
- 选用 ECharts：功能丰富、文档完善、与 React 集成简单

---

#### 第二步：基础架构搭建

**目标**：建立项目的骨架层，为业务开发提供支撑

**2.2.1 类型系统（types/index.ts）**
先定义所有业务实体类型：
- `User`：用户（ID、用户名、邮箱、角色、状态等）
- `MenuItem`：菜单（ID、父ID、名称、图标、类型、权限、路由等）
- `Role`：角色（ID、名称、备注、权限菜单ID列表）
- `Department`：部门（ID、父ID、名称、负责人）
- `Order`：订单（编号、城市、地址、价格、状态等）
- `Driver`：司机（姓名、车辆、评分、流水等）

**思路**：先定义类型，再写逻辑。TypeScript 的强类型能在编码阶段捕获错误。

**2.2.2 工具层**
- `storage.ts`：封装 localStorage/sessionStorage，统一加前缀避免冲突
- `request.ts`：封装 Axios，统一处理请求头（Token）、响应拦截（错误提示、401跳转）
- `index.ts`：通用工具（日期格式化、ID生成、树形转换、文件下载）

**2.2.3 状态管理**
采用 **React Context + useReducer**，而非 Redux/Zustand：

```
理由：
1. 项目规模中等，Context 足够
2. 避免引入额外依赖，减少包体积
3. 逻辑清晰：Action → Reducer → State
```

管理的状态：
- `user` / `token`：登录信息（持久化到 localStorage）
- `theme`：主题模式（持久化）
- `menuList` / `permissionList`：权限数据
- `tabs` / `activeTabKey`：标签页状态

**2.2.4 路由系统**
- 使用 React Router 6 的 `createBrowserRouter`
- 所有页面组件使用 `React.lazy` 懒加载，实现代码分割
- 路由守卫 `AuthGuard`：无 Token 时自动跳转到登录页
- 路由结构按业务模块分层：`/dashboard`、`/system/*`、`/order/*`

---

#### 第三步：全局布局实现

**目标**：实现可复用的后台管理界面框架

**3.1 布局结构**
```
┌─────────────────────────────────┐
│  Sidebar  │  HeaderBar          │
│  (侧边栏)  │  (面包屑+全屏+主题+用户)│
│           ├─────────────────────┤
│           │  TabBar (标签页)     │
│           ├─────────────────────┤
│           │                     │
│           │  Content (页面内容)  │
│           │                     │
└───────────┴─────────────────────┘
```

**3.2 Sidebar 侧边栏**
- 使用 AntD `Menu` 组件，`mode="inline"`
- 菜单数据来源于 `store.menuList`，无数据时使用默认菜单
- 菜单项构建逻辑：
  1. 筛选 `parentId === 0` 的顶级菜单
  2. 为每个顶级菜单查找子菜单
  3. 映射为 Menu 的 `items` 格式（含图标、点击事件）
- 图标通过 `iconMap` 映射字符串 → React 组件
- 权限过滤：通过 `hasPermission()` 判断是否显示

**3.3 HeaderBar 顶部栏**
- 左侧：折叠按钮 + 面包屑导航
- 右侧：主题切换（月亮/太阳图标）、全屏切换、消息通知、用户头像下拉
- 面包屑：根据当前路由匹配预定义映射表

**3.4 TabBar 标签页**
- 监听路由变化，自动将新页面加入标签列表
- 工作台标签不可关闭，其他标签可关闭
- 关闭标签时自动切换到相邻标签并跳转路由
- 点击标签直接跳转对应页面

**3.5 主题切换**
- AntD 5.x 内置 `darkAlgorithm`，通过 `ConfigProvider` 的 `theme.algorithm` 切换
- 主题状态持久化到 localStorage

---

#### 第四步：登录模块

**目标**：实现登录认证入口

**流程**：
1. 登录页为独立布局（无 Sidebar/Header）
2. 渐变背景 + 居中登录卡片
3. 表单验证：用户名/密码必填
4. 提交后调用 Mock 登录逻辑（admin/123456）
5. 成功后：存储 Token + 用户信息 + 权限列表到全局状态
6. 跳转到工作台

**设计要点**：
- 登录页不经过 `AuthGuard`，其他页面必须登录
- Token 通过 Axios 拦截器自动附加到请求头

---

#### 第五步：工作台 Dashboard

**目标**：展示核心数据概览

**5.1 用户信息卡片**
- 展示欢迎语 + 用户基本信息（ID、邮箱、岗位、部门、状态）

**5.2 统计卡片**
- 4 个卡片：司机数量（橙）、总流水（紫）、总订单（蓝）、开通城市（青）
- 使用 AntD `Statistic` 组件 + 图标背景

**5.3 数据可视化**
- **折线图**：双 Y 轴，订单量 + 流水走势（6个月）
- **环形图**：司机城市分布
- **饼图**：司机年龄分布
- **雷达图**：模型诊断（服务态度、准点率等 6 维度）

**数据来源**：`mock.ts` 中的 `dashboardStats` 和 `dashboardCharts`

---

#### 第六步：系统管理模块

**6.1 用户管理**
- 列表展示：ID、用户名（带头像）、邮箱、角色、状态（Tag）、时间
- 搜索区：按 ID、用户名、状态筛选
- 操作区：新增、编辑、删除、批量删除
- 新增/编辑弹窗：表单含用户名、邮箱、手机、状态、部门（Select）、角色（Select）、岗位

**6.2 菜单管理**
- 树形表格展示菜单层级关系
- 字段：名称、图标、类型（Tag）、权限、路由、组件、状态
- 操作：新增子菜单、编辑、删除
- 类型支持：菜单 / 页面 / 按钮

**6.3 角色管理**
- 列表：名称、备注、时间
- 核心功能：**设置权限**
  - 弹窗展示树形菜单权限列表
  - 勾选分配给该角色的菜单（精确到按钮级）
  - 保存后更新角色的 `menuIds`

**6.4 部门管理**
- 树形表格展示部门层级
- 支持添加子部门
- 字段：名称、负责人、时间

---

#### 第七步：订单管理模块

**7.1 订单列表**
- 列表字段：订单号、城市、起终点地址、时间、价格、状态（Tag）、用户、司机
- 操作：详情（弹窗）、打点（地图弹窗）、轨迹（地图弹窗）、删除
- 搜索：按订单号、用户、状态筛选
- 新增订单弹窗：城市、起终点、价格、状态、用户、司机
- 导出 Excel（模拟）

**7.2 订单聚合**
- 城市切换下拉（长沙/武汉/郑州）
- ECharts 散点图：模拟订单聚合效果（圆圈大小代表订单量）
- ECharts 柱状图：区域订单量 Top10
- 统计卡片：总订单量、聚合点数、热点区域

**7.3 司机列表**
- 信息密集展示：司机头像+姓名+电话、注册城市+会员等级+司机等级、状态
- 车辆信息：车牌+品牌+车型
- 昨日数据：在线时长、流水
- 评分/行为分：星级 + 进度条
- 昨日单量：推单数、完单数、完单率
- 搜索：按司机名称、状态筛选

---

#### 第八步：Mock 数据层

**设计思路**：
由于本项目是纯前端演示，所有数据通过 `api/mock.ts` 提供：
- `mockUsers`：5 条用户数据
- `mockMenus`：14 条菜单数据（含按钮权限）
- `mockRoles`：5 条角色数据
- `mockDepts`：7 条部门数据
- `mockOrders`：8 条订单数据
- `mockDrivers`：8 条司机数据
- `dashboardStats` / `dashboardCharts`：Dashboard 数据

**使用方式**：
页面中直接 `import { mockUsers } from '@/api/mock'`，模拟异步请求（`setTimeout`）。

**扩展为真实后端**：
只需将 `api/index.ts` 中的接口改为真实 HTTP 请求，`mock.ts` 即可废弃。

---

### 2.3 关键技术决策

| 决策点 | 选择 | 理由 |
|--------|------|------|
| 状态管理 | Context + Reducer | 中等规模，避免 Redux  boilerplate |
| 路由 | React Router 6 | 官方标准，支持懒加载、嵌套路由 |
| UI 组件库 | Ant Design 5.2 | 企业级组件，内置主题、表格强大 |
| 图表 | ECharts + echarts-for-react | 功能最全的图表库 |
| 样式方案 | Less + 内联 style | 简单直接，与 AntD 兼容 |
| 构建工具 | Vite | 快、现代、配置简单 |
| 路径别名 | `@/xxx` | 简化导入，避免 `../../` |
| 权限方案 | RBAC（角色+菜单+按钮） | 经典模型，满足后台管理需求 |

---

### 2.4 RBAC 权限控制实现

**模型**：
```
用户 ← 角色 ← 菜单权限
```

**流程**：
1. 用户登录后获取 `permissionList`（权限标识列表，如 `['system:user:add', '*']`）
2. 菜单渲染时通过 `hasPermission(permission)` 判断是否显示
3. 按钮级别权限通过同样的方式控制
4. `'*'` 表示超级管理员，拥有所有权限

**当前实现**：
登录时直接赋予 `['*']`，所有权限开放。实际项目中应从后端获取。

---

## 三、如何扩展真实后端

如需对接真实后端 API：

1. **修改 `api/index.ts`**：将 Mock 调用改为真实 HTTP 请求
2. **修改 `utils/request.ts`**：调整 `baseURL` 为后端地址
3. **移除 `api/mock.ts`**：不再使用本地数据
4. **后端需提供的接口**：
   - `POST /auth/login`：登录
   - `GET /auth/info`：获取用户信息
   - `GET /user/list`：用户列表
   - `POST /user`：新增用户
   - `PUT /user/:id`：编辑用户
   - `DELETE /user/:id`：删除用户
   - （菜单、角色、部门、订单、司机类似）

---

## 四、项目运行截图预期

| 页面 | 效果 |
|------|------|
| 登录页 | 紫色渐变背景 + 居中白色卡片 + 表单 |
| 工作台 | 用户信息卡 + 4 统计卡 + 4 个图表 |
| 用户管理 | 搜索表单 + 数据表格 + 操作按钮 |
| 角色权限 | 树形权限勾选弹窗 |
| 订单聚合 | 散点聚合图 + 柱状图 + 城市切换 |
| 司机列表 | 密集信息表格 + 评分进度条 |
