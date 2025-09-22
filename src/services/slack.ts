
import { WebClient } from '@slack/web-api';

type SendMessageParams = {
    apiKey: string;
    channel: string;
    text: string;
}

export const sendMessage = async ({ apiKey, channel, text }: SendMessageParams) => {
    const web = new WebClient(apiKey);

    const response = await web.chat.postMessage({
        channel,
        text,
    });

    return response;
}
