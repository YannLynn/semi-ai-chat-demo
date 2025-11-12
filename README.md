## Semi-AI-Chat-Demo

<img src='https://lf3-static.bytednsdoc.com/obj/eden-cn/22606991eh7uhfups/img/multiple-agent.gif'/>

### 项目介绍 Project Introduction
本项目使用 `@douyinfe/semi-ui` 2.88.0 以上版本的 AIChat 系列组件，配合 OpenAI 官方提供的 JavaScript/TypeScript SDK `@openai/agents` 搭建了一个简单的多 Agent 对话页面，完成根据主题完成故事编写的功能。其中大纲 Agent 会调用 get_background_points 完成大纲的编写，正文 Agent 则根据大纲 Agent 的结果完成故事的编写。

This project uses AIChat components from version 2.88.0 or higher of `@douyinfe/semi-ui`, along with the JavaScript/TypeScript SDK `@openai/agents` provided by OpenAI, to build a simple multi-agent dialogue page, enabling the creation of stories based on a given theme.The outliner agent calls get_background_points tools to create the outline, while the writer agent creates the story based on the results from the outliner agent.

### 快速开始 Quick Start
#### 安装依赖 Install Dependencies
```sh
yarn
```

#### Start Server
```sh
yarn server
```

#### Start Project
```sh
yarn dev
```
open http://localhost:3000/ 

#### 设置您自己的 OpenAI 密钥 Set Your Own OpenAI Key
环境变量文件（.env）- 推荐用于开发环境 

Environment variable file (.env) Recommended for development environments
```typescript
// create .env file 
OPENAI_API_KEY=xxxxx

```

### 使用 openRouter、kimi、doubao、zhipu 等发起请求 
### Use openRouter, kimi, doubao, zhipu, etc. to make requests
通过以下命令启动特定 server 请求，将聊天消息发送给特定接口

Use the following command to initiate a specific server request to send chat messages to a specific interface.
```sh
yarn # 安装依赖

yarn server:openai # openai response 接口
yarn server:openRouter # openRouter chat completion 接口
yarn server:kimi # kimi chat completion 接口
yarn server:doubao # doubao chat completion 接口
yarn server:zhipu # zhipu chat completion 接口
```

#### Start Project
```sh
yarn dev
```
open http://localhost:3000/ 
