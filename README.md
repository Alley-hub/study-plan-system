# 学习养成计划系统：前端 + 后端版本

这是一个适合课程项目演示的完整基础版本。

## 1. 项目技术

前端：HTML、CSS、JavaScript

后端：Node.js、Express

数据存储：`data/db.json`

说明：这个版本没有使用 MySQL，而是用 JSON 文件作为轻量数据存储，适合初学者快速运行和演示。后期可以升级为 MySQL 数据库。

## 2. 项目结构

```text
study-plan-fullstack
├── package.json
├── server.js
├── data
│   └── db.json
├── public
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```

## 3. 怎么运行

### 第一步：安装 Node.js

先确认电脑已经安装 Node.js。

打开终端，输入：

```bash
node -v
npm -v
```

如果能看到版本号，说明安装成功。

### 第二步：安装依赖

在 VS Code 里打开项目文件夹 `study-plan-fullstack`。

打开终端，输入：

```bash
npm install
```

### 第三步：启动项目

继续在终端输入：

```bash
npm start
```

看到类似下面内容说明启动成功：

```text
学习养成计划系统已启动：http://localhost:3000
```

### 第四步：打开网页

浏览器打开：

```text
http://localhost:3000
```

不要再直接双击 `index.html`，因为这个版本需要后端运行。

## 4. 已实现功能

- 前端模拟登录
- 后端保存不同用户任务数据
- 添加学习任务
- 使用系统推荐任务
- 删除任务
- 完成任务打卡
- 学习进度条
- 任务统计表
- 最近 7 天打卡日历
- 简单任务提醒
- 后端 API 接口
- JSON 文件数据存储

## 5. 后端接口说明

| 方法 | 地址 | 功能 |
|---|---|---|
| GET | `/api/health` | 测试后端是否正常 |
| POST | `/api/login` | 模拟登录 |
| GET | `/api/users/:username/tasks` | 查询用户任务 |
| POST | `/api/users/:username/tasks` | 添加任务 |
| PATCH | `/api/users/:username/tasks/:taskId/complete` | 完成任务打卡 |
| PATCH | `/api/users/:username/tasks/:taskId/reminded` | 标记任务已提醒 |
| DELETE | `/api/users/:username/tasks/:taskId` | 删除任务 |
| GET | `/api/users/:username/stats` | 查询统计数据 |

## 6. 可以写进报告里的说明

本系统采用前后端分离思想进行设计。前端使用 HTML、CSS、JavaScript 实现页面展示和交互，后端使用 Node.js 和 Express 提供接口服务。用户在前端完成登录、添加任务、完成打卡和删除任务等操作后，前端通过 fetch 请求调用后端接口，后端负责处理业务逻辑并将任务数据保存到 JSON 文件中。该版本用于课程项目演示，后续可扩展为 Spring Boot + MySQL 或 Node.js + MySQL 的完整 Web 系统。
