import colors from "@colors/colors";

export function printMessagesCompletion(messages, justLast) {
    if (justLast) messages = [messages[messages.length-1]];

    messages.map((msg) => {
        if (msg.role == 'user') {
            console.log(colors.magenta(msg.content));
        } else if (msg.role == 'assistant') {
            console.log(colors.green(msg.content));
        }
        if (msg.metadata) {
            console.log('🔥 metadata', msg.metadata);
        }
    });
}
