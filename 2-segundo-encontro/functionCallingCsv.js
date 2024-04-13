import OpenAi from "openai";
import dotenv from "dotenv";
dotenv.config();
import {promptMessage} from "../utils/prompt.js";
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});

const model = 'gpt-4-turbo-2024-04-09';

const tools = [
    {
        "type": "function",
        "function":{
            "name": "getTalks",
            "description": "Obtem uma lista de palestras no web summit.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keyword1": {
                        "type": "string",
                        "description": "Uma palavra em ingles a ser consultada na lista de palestras."
                    },
                    "keyword2": {
                        "type": "string",
                        "description": "Outra palavra em ingles a ser consultada na lista de palestras."
                    },
                },
                "required": [
                    "keyword1",
                    "keyword2",
                ]
            }
        }
    }
];


function getTalks({keyword1, keyword2}) {
    const data = parse(readFileSync('./origin/webSummitEvents.csv'), { columns: true });
    // console.log(data);

    const talks = data.filter(talk =>
        (talk.event.toLowerCase().includes(keyword1.toLowerCase()) || talk.event.toLowerCase().includes(keyword2.toLowerCase())) ||
        (talk.description.toLowerCase().includes(keyword1.toLowerCase()) || talk.description.toLowerCase().includes(keyword2.toLowerCase()))
    );

    return (talks && talks.length>0 ? talks : "Nenhuma palestra encontrada");
}


async function main() {
    let messages = [];
    try{
        messages.push(
            {
                role: "system",
                content:
                    "Você é um assistente que ajuda e encontrar boas palestras no Web Summit." +
                    "Pergunte qual assunto quer ver no Web Summit."+
                    "Não fale sobre nada que não seja eventos."
            }
        );

        const completion = await openai.chat.completions.create({
            messages,
            // tools,
            model,
        });

        messages.push(
            {role: "assistant", content: completion.choices[0].message.content}
        )

        console.log(completion.choices[0].message.content);
        // console.dir(completion, { depth: null});

        while (true) {
            // console.log("messages", messages);

            const text = await promptMessage("Mensagem>");
            // console.log("text", text);
            messages.push(
                {role: "user", content: text}
            )

            const completion = await openai.chat.completions.create({
                messages,
                tools,
                model
            });

            // console.dir(completion.choices[0], { depth: null});

            // Executar alguma função?
            if (completion.choices[0].message.tool_calls){
                console.dir(completion.choices[0].message.tool_calls, { depth: null});
                const fn = completion.choices[0].message.tool_calls[0].function.name;
                const args = JSON.parse(completion.choices[0].message.tool_calls[0].function.arguments);
                // console.log("fn", fn);
                // console.log("args", args);
                if (fn=='getTalks'){
                    const talks = await getTalks(args);
                    // console.log("talks",talks);

                    messages.push(
                        { role: 'function',
                          name: fn,
                          content: JSON.stringify(talks)
                        });

                    const completionFn = await openai.chat.completions.create({
                        messages,
                        tools,
                        model
                    });

                    messages.push(
                        {role: "assistant", content: completionFn.choices[0].message.content}
                    )

                    console.log(completionFn.choices[0].message.content);
                }
            } else {
                messages.push(
                    {role: "assistant", content: completion.choices[0].message.content}
                )
                console.log(completion.choices[0].message.content);
            }
        }
    } catch (e) {
        console.error(e);
        console.log("Messages:");
        console.dir(messages, { depth: null});
    }
}

main().then();