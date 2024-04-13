import colors from "@colors/colors";

export function printMessagesAssistant(messages, justLast) {
    if (justLast) messages = [messages[messages.length-1]];

    // console.dir(messages, { depth: null});

    messages.map((msg) => {
        if (msg.content[0].type=='text') {
            if (msg.role == 'user') {
                console.log(colors.magenta(msg.content[0].text.value));
            } else if (msg.role == 'assistant') {
                console.log(colors.green(msg.content[0].text.value));
            }
        }
    });

}
