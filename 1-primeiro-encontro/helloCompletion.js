import OpenAi from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});

async function main() {
    const completion = await openai.chat.completions.create({
        messages: [
            {role:"user", content:"Escreva uma noticia para um post de blog sobre programação com IA Generativa"}
        ],
        model: "gpt-3.5-turbo",
    });
    // console.dir(completion, { depth: null});
    console.log(completion.choices[0].message.content);
}

main().then();