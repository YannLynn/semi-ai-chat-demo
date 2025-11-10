export const roleConfig = {
    user: {
        name: 'User',
        avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/22606991eh7uhfups/img/user.png'
    },
    assistant: new Map([
        ['outliner', {
            name: '大纲写手',
            avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/22606991eh7uhfups/PM.png'
        }],
        ['writer', {
            name: '正文写手',
            avatar: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/22606991eh7uhfups/FE.png'
        }],
    ]),
};

export const uploadProps = {
    action: "https://api.semi.design/upload"
};

export const modelOptions = [
    {
        value: 'gpt-5',
        label: 'GPT-5',
        type: 'gpt',
    },
    {
        value: 'gpt-4o',
        label: 'GPT-4o',
        type: 'gpt',
    },
];


export const radioButtonProps = [
    {
        label: '极速',
        value: 'fast',
    },
    { 
        label: '思考',
        value: 'think',
    },
    {
        label: '超能',
        value: 'super',
    }
];