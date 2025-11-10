import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { Agent, run, withTrace, tool } from "@openai/agents";
import z from 'zod';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());



app.post("/api/write", async (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    if (typeof res.flushHeaders === "function") res.flushHeaders();

    const getBackgroundPoints = tool({
        name: "get_background_points",
        description: "Return 3-5 concise background points about a topic to inform an outline.",
        parameters: z.object({
            topic: z.string(),
        }),
        needsApproval: async () => false,
        strict: true,
        invoke: async ({ topic }: { topic: string }) => {
            const templates = [
                `${topic} 的核心概念与范围`,
                `${topic} 的重要应用/场景`,
                `${topic} 的关键挑战或限制`,
                `${topic} 的近期趋势或发展方向`,
                `${topic} 与相关领域/行业的关系`
            ];
            return { templates };
        }
    } as any);

    try {
        const topic = req.body?.input?.[0]?.content?.[0]?.text;
        if (!topic.trim()) {
            res.write(`data: ${JSON.stringify({ type: "error", error: "Missing topic" })}\n\n`);
            return res.end();
        }

        // 定义两个协作的 Agent（不使用自动 handoff，手动分步以便流式返回）
        // Define two collaborating agents (do not use automatic handoff, manually step-by-step for streaming return)
        const writerAgent = new Agent({
            name: "writer_agent",
            instructions: [
                "You are a content writer.",
                "Based on the outline in the conversation, write an engaging article.",
                "IMPORTANT: For each numbered point in the outline, write a separate paragraph.",
                "If there are 3 outline points, write 3 paragraphs. If there are 4, write 4 paragraphs.",
                "Each paragraph should be 60-80 words, developing the corresponding outline point.",
                "Separate paragraphs with a blank line (double newline).",
                "Write naturally flowing content with smooth transitions between paragraphs.",
                "Do not include outline numbers in your article, just write the content.",
            ].join(" "),
            handoffDescription: "Writes engaging content based on the provided outline",
        });

        const outlinerAgent = new Agent({
            name: "outliner_agent",
            instructions: [
                "You are a content outliner.",
                "Call tool get_background_points(topic) once, then return a single JSON",
                "Create a brief outline with 3-4 key points in numbered format (1. 2. 3.).",
                "Keep it concise (50-80 words).",
                // 不使用自动 handoff，以便在发送大纲后手动触发 writer
                "After showing the outline, wait for the next step.",
            ].join(" "),
            tools: [getBackgroundPoints]
        });

        // 简单的内容抽取工具
        // Simple content extraction tool
        const extractText = (content: any): string => {
        if (typeof content === "string") return content;
        if (Array.isArray(content)) {
            return content
            .filter((item) => item && (item.type === "output_text" || item.type === "text"))
            .map((item) => item.text)
            .join("\n");
        }
        return "";
        };

        await withTrace("Writing workflow", async () => {

            // 客户端断开则停止
            const onClose = () => {
                try {
                    res.end();
                } catch {}
            };
            req.on("close", onClose);

            // 第一步：生成大纲并立即发送
            // Step 1: Generate outline and send immediately
            const outlineResult = await run(outlinerAgent, topic, { stream: true });
            for await (const event of (outlineResult as unknown as AsyncIterable<any>)) {
                // 只处理 raw_model_stream_event & model 事件
                // Only process raw_model_stream_event & model events
                if(event.type === 'raw_model_stream_event' && event.data.type === 'model') {
                    res.write(`data: ${JSON.stringify({ agent: "outliner", ...event.data.event })}\n\n`);
                }
            }
            const outlineAssistantMessages = ((outlineResult as any)?.history ?? []).filter(
                (item: any) => item?.role === "assistant" && item?.content,
            );
            const outlineText = outlineAssistantMessages.length
                ? extractText(outlineAssistantMessages[0]?.content)
                : "";

            // 第二步：创作正文 Step 2: Write the article
            // 交接给正文写手 Handoff to writing agent
            // res.write(`data: ${JSON.stringify({ type: "handoff", message: "handoff to writing agent " })}\n\n`);
            const writerInput = `Outline:\n${outlineText}\n\nWrite the article now.`;
            const writerResult = await run(writerAgent, writerInput, { stream: true });
            for await (const event of (writerResult as unknown as AsyncIterable<any>)) {
                // 只处理 raw_model_stream_event & model 事件
                // Only process raw_model_stream_event & model events
                if(event.type === 'raw_model_stream_event' && event.data.type === 'model') {
                    res.write(`data: ${JSON.stringify({ agent: "writer", ...event.data.event })}\n\n`);
                }
            }
            res.end();
        });
    } catch (error) {
        res.write(`data: ${JSON.stringify({ type: "error", error: String(error) })}\n\n`);
        res.end();
    }
});

app.post("/api/chat", async (req, res) => {
    // 使用 Server-Sent Events (SSE) 进行流式输出
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    if (typeof res.flushHeaders === "function") res.flushHeaders();

    try {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const stream = await client.responses.stream({
            model: "gpt-4o",
            input: req.body?.input ?? "",
        });

        const onClose = () => {
        try {
            res.end();
        } catch {}
        };
        req.on("close", onClose);

        for await (const event of (stream as unknown as AsyncIterable<any>)) {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
        res.end();
    }
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});