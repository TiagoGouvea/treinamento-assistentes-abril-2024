import OpenAi from "openai";
import dotenv from "dotenv";
import {promptMessage} from "../utils/prompt.js";
import {sleep} from "openai/core";
import {printMessagesAssistant} from "../utils/printMessagesAssistant.js";
import nodemailer from 'nodemailer';
dotenv.config();

const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});

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
                if (running.status=='requires_action'){
                    // console.dir(running, { depth: null});
                    const toolCall = running.required_action.submit_tool_outputs.tool_calls[0];
                    const fn = toolCall.function.name;
                    const args = toolCall.function.arguments;
                    // console.log("fn", fn);
                    // console.log("args", args);

                    // Executar a função
                    const res = await sendEmail(JSON.parse(args));

                    await openai.beta.threads.runs.submitToolOutputs(
                        thread.id,
                        run.id,
                        {
                            tool_outputs: [
                                {
                                    tool_call_id: toolCall.id ,
                                    output: res,
                                },
                            ],
                        }
                    );
                }

                wait = running.status!= "completed"; //  (['queued', 'in_progress', 'cancelling'].includes(running.status))
                if (wait)
                    await sleep(1000);
                else {
                    console.log(running.usage);
                    // console.dir(running, { depth: null});
                }
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






// Criar um transporte SMTP
let transporter = nodemailer.createTransport({
    host: process.env.NODEMAILER_HOST,
    port: process.env.NODEMAILER_PORT,
    secure: process.env.NODEMAILER_SECURE,
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
    }
});


async function sendEmail({to, subject, body}) {

    let mailOptions = {
        from: '"Tiago" <tiago@appmasters.io>',
        to,
        subject,
        text: body
    };

    console.log("Send email", mailOptions);


    // Enviar o email
    try{
        const res = await transporter.sendMail(mailOptions);
        if (res && res.messageId){
            return "Mensagem enviada";
        } else {
            return "Erro ao enviar email";
        }
    } catch (e){
        console.error(e);
        return "Erro ao enviar email: "+e.message;
    }


}








main().then();