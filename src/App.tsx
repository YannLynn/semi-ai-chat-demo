
import React, { useState, useCallback } from 'react';
import { AIChatDialogue, AIChatInput, chatInputToChatCompletion, chatInputToMessage, streamingChatCompletionToMessage, streamingResponseToMessage } from '@douyinfe/semi-ui';
import { IconFixedStroked, IconBookOpenStroked, IconFeishuLogo, IconFigma, IconGit } from '@douyinfe/semi-icons';
import { roleConfig, uploadProps, modelOptions, radioButtonProps } from './constants';
import { ContentItem, Message } from '@douyinfe/semi-ui/lib/es/aiChatDialogue';
import { MessageContent } from '@douyinfe/semi-ui/lib/es/aiChatInput';
import { Content, Reference } from '@douyinfe/semi-ui/lib/es/aiChatInput/interface';
import './App.css';
import { ChatCompletionInput } from '@douyinfe/semi-foundation/lib/es/aiChatDialogue/dataAdapter/interface';

const { Configure } = AIChatInput;

const mcpOptions = [
  {
      icon: <IconFeishuLogo />,
      label: "飞书文档",
      value: "feishu",
  },
  {
      icon: <IconGit />,
      label: "Github Mcp",
      value: "github",
  },
  {
      icon: <IconFigma />,
      label: "IconFigma Mcp",
      value: "IconFigma",
  }
];

const ChatCompletionType = ['openRouter', 'kimi', 'doubao', 'glm'];

const App = () => {
    const [messages, setMessages] = useState<Message[]>([]); 
    const [generating, setGenerating] = useState(false);
    const [references, setReferences] = useState<Reference[]>([]); 

    const renderLeftMenu = useCallback(() => (<>
        <Configure.Select optionList={modelOptions} field="model" initValue="gpt-4.1-2025-04-14" position="top" />
        {/* <Configure.Button icon={<IconFixedStroked />} field="deepThink">深度思考</Configure.Button> */}
        {/* <Configure.Button icon={<IconBookOpenStroked />} field="onlineSearch">联网搜索</Configure.Button> */}
        {/* <Configure.Mcp options={mcpOptions} /> */}
        {/* <Configure.RadioButton options={radioButtonProps} field="thinkType" initValue="fast"/> */}
    </>), []);

    const onChatsChange = useCallback((chats?: Message[]) => {
        setMessages(chats ?? []);
    }, []);

    const onContentChange = useCallback((content: Content[]) => {
        console.log('onContentChange', content, messages);
    }, []);


    const onReferenceClick = useCallback((item: ContentItem) => {
        setReferences((references) => [...references, { ...item, id: `reference-${Date.now()}` } as Reference]);
    }, []);

    const handleReferenceDelete = useCallback((item: Reference) => {
        const newReference = references.filter((ref) => ref.id !== item.id);
        setReferences(newReference);
    }, [references]);

    const handleMessageSend = useCallback(async (input: ContentItem[], chatCompletion: any[] | undefined, model: string) => {
        try {
            const resp = await fetch('/api/write', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: input, model: model, messages: chatCompletion }),
            });
            if (!resp.ok || !resp.body) throw new Error('Network error');

            // 处理 server 返回的 chunks
            // Handle chunks returned from the server
            const reader = resp.body.getReader();
            let messageChunks: any[] = [];
            while (true) {
                const { value, done } = await reader.read();
                const newValue = new TextDecoder('utf-8').decode(value)
                if (done) break;
                if (!value) continue;
                const rawLines = newValue.split("\n\n");
        
                for (let i = 0; i < newValue.length - 1; i++) {
                    if (rawLines[i] && rawLines[i] !== '') {
                        // 去掉 data: 前缀 
                        // Remove the data: prefix
                        const json = JSON.parse(rawLines[i].slice(6).trim());
                        if (messageChunks[messageChunks.length - 1]?.type === 'response.completed' ) {
                            // 遇到 response.completed 事件，清空 message chunks
                            // Encountered response.completed event, clear message chunks
                            messageChunks = [];
                        }
                        if (json.error) {
                            console.error('Error:', json.error);
                            break;
                        }
                        messageChunks.push(json);
                    }
                }

                let message: any = null;
                if (ChatCompletionType.includes(messageChunks[0]?.modelType)) {
                    const parsed = streamingChatCompletionToMessage(messageChunks);
                    message = parsed?.messages[0] ?? null;
                } else {
                    const parsed = streamingResponseToMessage(messageChunks);
                    message = parsed?.message ?? [];
                }

                setMessages((prev: Message[]) => {
                    if(prev) {
                        const messageExists = message && prev?.some((m) => m.id === message?.id);
                        if (!messageExists) {
                            return [...prev, { ...message, name: messageChunks[0]?.agent } as Message];
                        }
                        return prev.map((m) => {
                            if(m.id === message?.id) {
                                return { ...message, name: messageChunks[0]?.agent } as Message;
                            }
                            return m;
                        });
                    } else {
                        return [];
                    }
                });
                
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setGenerating(false);
        }
    }, [setGenerating, setMessages, setReferences]);

    const onMessageSend = useCallback((props: MessageContent) => {
        const userMessage = chatInputToMessage(props);
        const chatCompletion = chatInputToChatCompletion(props);
        setGenerating(true);
        setMessages((messages) => [...messages, {
            id: `message-${Date.now()}`,
            ...userMessage
        }]);
        (async () => {
          // 将用户消息发送给 server 
          // Send user messages to the server
          await handleMessageSend(userMessage.content, chatCompletion.messages, userMessage.model,);
        })();
        setReferences([]);
    }, []);

    const onEditMessageSend = useCallback((props: MessageContent) => {
        const index = messages.findIndex((message) => message.editing);
        const newMessages = [...messages.slice(0, index), {
            id: `message-${Date.now()}`,
            ...chatInputToMessage(props),
        }];
        setMessages(newMessages);
    }, [messages]);

    const handleEditingReferenceDelete = useCallback((item) => {
        const newMessages = messages.map((message) => {
            if (message.editing) {
                message.references = message?.references?.filter((ref) => ref.id !== item.id);
            }
            return message;
        });
        setMessages(newMessages);
    }, [messages]);

    const messageEditRender = useCallback((props) => {
        return (
            <AIChatInput 
                skills={[]}
                className="editing-input-outer-style"
                generating={false}
                references={props?.references}
                uploadProps={{ ...uploadProps, defaultFileList: props?.attachments ?? [] }}
                defaultContent={props?.inputContents?.[0]?.text}
                renderConfigureArea={renderLeftMenu} 
                // onContentChange={onContentChange}
                onMessageSend={onEditMessageSend}
                onReferenceDelete={handleEditingReferenceDelete}
            />
        );
    }, [messages, handleEditingReferenceDelete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 32px)', overflow: 'hidden' }}>
            <AIChatDialogue 
                className="dialogue-outer-style"
                roleConfig={roleConfig}
                showReference={true}
                align="leftRight"
                mode="bubble"
                chats={messages}
                onChatsChange={onChatsChange}
                onReferenceClick={onReferenceClick}
                messageEditRender={messageEditRender}
            />
            <AIChatInput 
                className="input-outer-style"
                placeholder={'输入内容或者上传内容'} 
                defaultContent={'帮我写一个关于<input-slot placeholder="[主题]">独角兽</input-slot>的故事'}
                generating={generating}
                references={references}
                uploadProps={uploadProps}
                renderConfigureArea={renderLeftMenu} 
                onContentChange={onContentChange}
                onMessageSend={onMessageSend}
                onStopGenerate={() => setGenerating(false)}
                onReferenceDelete={handleReferenceDelete}
            />
        </div>
  );
};

export default App;
