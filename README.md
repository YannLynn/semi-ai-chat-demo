## Semi-AI-Chat-Demo

### 项目介绍 Project Introduction
本项目使用 @douyinfe/semi-ui 2.88.0 以上版本的 AIChat 系列组件，搭建了一个简单的多 Agent 对话页面，完成根据主题完成故事编写的功能，其中大纲 Agent 会调用 get_background_points 完成大纲的编写，正文 Agent 则根据大纲 Agent 的结果完成故事的编写。

This project uses AIChat components from @douyinfe/semi-ui version 2.88.0 and above to build a simple multi-agent dialogue page, enabling the creation of stories based on a theme. The outliner agent calls get_background_points tools to create the outline, while the writer agent creates the story based on the results from the outliner agent.

### 快速开始 Quick Start
#### 安装依赖 Install Dependencies
```
yarn
```

#### Start Server
```
yarn server
```

#### Start Project
```
yarn dev
```
open http://localhost:3000/ 

#### 设置您自己的 OpenAI 密钥 Set Your Own OpenAI Key
环境变量文件（.env）- 推荐用于开发环境 

Environment variable file (.env) Recommended for development environments
```typescript
// server/index.tsx
// Import and configure dotenv
import dotenv from "dotenv";
dotenv.config();

// Read environment variables
const apiKey = process.env.OPENAI_API_KEY;
const port = process.env.PORT || 3001;

// Use environment variables
const client = new OpenAI({ apiKey });
```

