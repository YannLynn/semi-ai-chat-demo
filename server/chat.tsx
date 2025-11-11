import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 根据命令行的参数过滤出 type 为 openai、openRouter、kimi、豆包
// Filter out the type from the command line arguments: openai, openRouter, kimi, and doubao
const args = process.argv.slice(2);

// 支持两种格式: --type=openai 或 --type openai
const typeIndex = args.findIndex((arg) => arg.startsWith('--type'));
let modelType: string | null = null;

if (typeIndex !== -1) {
    if (args[typeIndex + 1] && !args[typeIndex + 1].startsWith('--')) {
        modelType = args[typeIndex + 1];
    }
}

console.log('modelType:', modelType);

// 不同模型（或者厂商）聊天接口请求展示：openai、openRouter、kimi、豆包、zhipu
// Display of chat interface requests from different models (or vendors): openai, openRouter, kimi, and doubao
app.post("/api/write", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    if (typeof res.flushHeaders === "function") res.flushHeaders();

    try {
        let model = req.body?.model;
        let result: any = null;
        let apiKey: string = '';
        let baseURL: string = '';
        let messages: any[] = req.body?.messages;

        // 根据 modelType 选择不同的模型
        // Select different models based on modelType
        if (modelType === 'openai') {
            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
            // openai response api example
            result = await openai.responses.create({
                model: model,
                input: req.body?.input,
                stream: true,
            });
            for await (const event of result) {
                res.write(`data: ${JSON.stringify({ agent: "writer", modelType: modelType, ...event })}\n\n`);
            }
            return;
        }
        
        // chat completion api example
        if (modelType === 'openRouter') {
            apiKey = process.env.OPENROUTER_API_KEY || '';
            baseURL = "https://openrouter.ai/api/v1";
            model = "openai/gpt-4.1-2025-04-14";
        } else if (modelType === 'kimi') {
            apiKey = process.env.MOONSHOT_API_KEY || '';
            baseURL = "https://api.moonshot.cn/v1" ;
            model = "kimi-k2-turbo-preview";
        } else if (modelType === 'doubao') {
            apiKey = process.env.ARK_API_KEY || '';
            baseURL ="https://ark.cn-beijing.volces.com/api/v3";
            model = "ep-20250515152021-fjgzd";
        } else if (modelType === 'zhipu') {
            apiKey = process.env.ZHIPU_API_KEY || '';
            baseURL = "https://open.bigmodel.cn/api/paas/v4";   
            model = "glm-4-air-250414"; 
            messages = [{"role": "user", "content": messages[0]?.content[0]?.text }]; // zhipu content only support string
        }
        const client = new OpenAI({ 
            apiKey,
            baseURL
        });
        result = await client.chat.completions.create({
            model,
            messages,
            stream: true,
            max_tokens: 4000, // 限制最大输出 tokens，避免超出 credits
            temperature: 0.7,
        });
        for await (const event of result) {
            res.write(`data: ${JSON.stringify({ agent: "writer", modelType: modelType, ...event })}\n\n`);
        }
    } catch (error) {
        console.error('Error:', error);
        res.write(`data: ${JSON.stringify({ type: "error", error: String(error) })}\n\n`);
    } finally {
        res.end();
    }

});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});