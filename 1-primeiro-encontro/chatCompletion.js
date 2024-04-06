import OpenAi from "openai";
import dotenv from "dotenv";
import {promptMessage} from "../utils/prompt.js";
dotenv.config();

const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});

async function main() {

    let messages = [];

    while (true) {
        // console.log("messages", messages);

        const text = await promptMessage("Mensagem>");

        messages.push(
            {role: "user", content: text}
        )

        const completion = await openai.chat.completions.create({
            messages,
            model: "gpt-3.5-turbo",
        });

        messages.push(
            {role: "assistant", content: completion.choices[0].message.content}
        )

        console.log(completion.choices[0].message.content);
    }
}

main().then();