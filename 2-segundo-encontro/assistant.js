import OpenAi from "openai";
import dotenv from "dotenv";
import {promptMessage} from "../utils/prompt.js";
import {sleep} from "openai/core";
import {printMessagesAssistant} from "../utils/printMessagesAssistant.js";
dotenv.config();

const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});

const model = 'gpt-4-turbo-2024-04-09';
const assistantId = process.env.ASSISTANT_ID;


async function main() {
    try{

        // Criar thread
        const thread = await openai.beta.threads.create();
        console.log("👉 thread", thread.id);
        // console.log(thread);

        while (true) {
            // console.log("messages", messages);
            const text = await promptMessage("Mensagem>");

            // Adicionar mensagem na thread
            const message = await openai.beta.threads.messages.create(
                thread.id,
                {
                    role: "user",
                    content: text
                }
            );
            console.log("👉 message", message.id);
            // console.dir(message,{ depth: null});

            // Executar Thread
            const run = await openai.beta.threads.runs.create(
                thread.id,
                {
                    assistant_id: assistantId,
                    // additional_instructions: "O nome do usuário é Tiago Gouvêa."
                }
            );
            console.log("👉 run", run.id);
            // console.log(run);

            // Observar run em execução
            let wait = true;
            while (wait){
                const running = await openai.beta.threads.runs.retrieve(
                    thread.id,
                    run.id
                );
                console.log("👉 running",running.status);
                wait = running.status!= "completed"; //  (['queued', 'in_progress', 'cancelling'].includes(running.status))
                if (wait)
                    await sleep(1000);
                // else {
                //     console.dir(running, { depth: null});
                // }
            }

            // Apresentar resultado
            const messages = await openai.beta.threads.messages.list(
                thread.id
            );
            // console.log("👉 messages");
            // console.dir(messages.data, {depth: null});
            printMessagesAssistant(messages.data.reverse(),true);
        }
    } catch (e) {
        console.error(e);
        console.log("Messages:");
    }
}

main().then();