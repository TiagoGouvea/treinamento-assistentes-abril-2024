import OpenAi from "openai";
import dotenv from "dotenv";
import {promptMessage} from "../utils/prompt.js";
import {events} from "./events.js";
dotenv.config();

// const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});
const openai = new OpenAi({baseURL:"http://localhost:1234/v1", apiKey:"not-needed"})
// const model = "gpt-4-0125-preview"; //"gpt-3.5-turbo";
const model = "local-model"; //"gpt-3.5-turbo";

async function main() {

    let messages = [
        {
            role: "system",
            content:
                "Você é um assistente especialista em eventos, e ajuda a encontrar bons eventos (no futuro) para ir."+
                "Não fale sobre nada que não seja eventos."+
                "Comece a conversa perguntando qual tipo de evento o usuário está buscando."+
                "Agora é: "+new Date().getDate()
        }
    ];

    messages.push({
        role: "system",
        content: "Segue a sua lista de eventos. Responda o usuário com base neles:" +
            events
    });

    const completion = await openai.chat.completions.create({
        messages,
        model
    });

    messages.push(
        {role: "assistant", content: completion.choices[0].message.content}
    )

    console.log(completion.choices[0].message.content);

    while (true) {
        // console.log("messages", messages);

        const text = await promptMessage("Mensagem>");
        messages.push(
            {role: "user", content: text}
        )

        const completion = await openai.chat.completions.create({
            messages,
            model
        });

        messages.push(
            {role: "assistant", content: completion.choices[0].message.content}
        )

        console.log("💰 usage", completion.usage);
        console.log(completion.choices[0].message.content);
    }
}

main().then();