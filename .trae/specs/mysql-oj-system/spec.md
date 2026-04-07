# MySQL 数据库课程实训 OJ 系统（纯前端真 MySQL 版） - 产品需求文档

## Overview
- **Summary**: 一个基于 MySQL-WASM 8.0 的纯前端在线判题系统，用于 MySQL 数据库课程实训，支持真实 MySQL 语法执行和自动判题。
- **Purpose**: 提供一个无后端、零依赖的 MySQL 练习平台，让学生能够在浏览器中直接练习 MySQL 语句，获得即时反馈。
- **Target Users**: MySQL 数据库课程的学生和教师。

## Goals
- 实现专业 MySQL 题库系统，覆盖 80 道标准题目
- 提供专业在线 SQL 编辑器，支持语法高亮和智能缩进
- 基于 MySQL-WASM 8.0 实现真 MySQL 自动判题引擎
- 实现课程专用用户系统，支持本地存储用户数据
- 实现高性能数据存储，支持题目懒加载
- 提供教学级界面，支持响应式布局和暗色模式

## Non-Goals (Out of Scope)
- 后端服务器开发
- 数据库服务器部署
- 在线用户认证（使用本地存储）
- 题目内容的实时更新（静态文件部署）
- 高级数据分析功能

## Background & Context
- 传统 MySQL 教学需要搭建服务器环境，配置复杂
- 纯前端解决方案可以降低环境搭建成本，提高学习效率
- MySQL-WASM 8.0 技术使得在浏览器中运行真实 MySQL 服务成为可能
- Cloudflare Pages 提供免费的静态文件托管服务，适合部署此类应用

## Functional Requirements
- **FR-1**: 题库系统，按章节拆分题目，支持分页、搜索、筛选
- **FR-2**: SQL 编辑器，支持语法高亮、智能缩进、执行、判题等功能
- **FR-3**: 自动判题引擎，基于 MySQL-WASM 8.0 执行用户 SQL 并判题
- **FR-4**: 用户系统，支持注册、登录、退出，本地存储用户数据
- **FR-5**: 数据存储，题目按章节懒加载，用户数据持久化到 IndexedDB
- **FR-6**: 响应式界面，支持 PC、手机、平板，提供亮色/暗色模式

## Non-Functional Requirements
- **NFR-1**: 性能要求，加载快、运行流畅、支持 1 万题不卡顿
- **NFR-2**: 兼容性，100% 兼容 MySQL 8.0 语法
- **NFR-3**: 可用性，无后端依赖，可直接部署到 Cloudflare Pages
- **NFR-4**: 用户体验，界面简洁专业，动画流畅，状态提示清晰

## Constraints
- **Technical**: 纯前端实现，使用 MySQL-WASM 8.0，本地 IndexedDB 存储
- **Business**: 零成本部署，使用 Cloudflare Pages 免费托管
- **Dependencies**: MySQL-WASM 8.0 库

## Assumptions
- 用户浏览器支持 WebAssembly
- 用户浏览器支持 IndexedDB
- 题目数据静态存储，无需实时更新

## Acceptance Criteria

### AC-1: 题库系统功能
- **Given**: 用户访问题库页面
- **When**: 用户浏览、搜索、筛选题目
- **Then**: 系统显示符合条件的题目列表，支持分页
- **Verification**: `programmatic`

### AC-2: SQL 编辑器功能
- **Given**: 用户打开题目详情页
- **When**: 用户编写、执行 SQL 语句
- **Then**: 系统显示语法高亮，执行结果，错误提示
- **Verification**: `human-judgment`

### AC-3: 自动判题功能
- **Given**: 用户提交 SQL 答案
- **When**: 系统执行 SQL 并与标准答案对比
- **Then**: 系统返回 AC、WA、CE、RE 四种判题结果
- **Verification**: `programmatic`

### AC-4: 用户系统功能
- **Given**: 用户注册、登录
- **When**: 用户提交答案
- **Then**: 系统存储用户做题记录、提交历史、正确率
- **Verification**: `programmatic`

### AC-5: 数据存储性能
- **Given**: 系统包含 1 万道题目
- **When**: 用户访问系统
- **Then**: 系统加载速度快，运行流畅，不卡顿
- **Verification**: `human-judgment`

### AC-6: 界面响应式
- **Given**: 用户在不同设备上访问系统
- **When**: 用户调整浏览器窗口大小
- **Then**: 系统界面自适应不同屏幕尺寸
- **Verification**: `human-judgment`

### AC-7: 暗色模式
- **Given**: 用户切换到暗色模式
- **When**: 用户浏览系统
- **Then**: 系统界面显示暗色主题
- **Verification**: `human-judgment`

## Open Questions
- [ ] MySQL-WASM 8.0 的具体集成方式和性能优化
- [ ] 本地存储的加密方案
- [ ] 题目数据的具体格式和结构
- [ ] 判题引擎的具体实现细节