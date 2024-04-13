import OpenAi from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});

const assistantId = 'asst_xxb18PROSl75qhOYcYAyAh1M';


const tools = [
    {
        "type": "function",
        "function":{
            "name": "sendEmail",
            "description": "Envia um email",
            "parameters": {
                "type": "object",
                "properties": {
                    "to": {
                        "type": "string",
                        "description": "Endereço de email do destinatario."
                    },
                    "subject": {
                        "type": "string",
                        "description": "Assunto do email."
                    },
                    "body": {
                        "type": "string",
                        "description": "Conteúdo do email"
                    },
                },
                "required": [
                    "to",
                    "subject",
                    "body",
                ]
            }
        }
    }
];

const assistant = {
    instructions:
        'Você é um assistente que envia emails para o usuário.',
    name: 'Assistente de Emails',
    model: 'gpt-3.5-turbo',
    tools
    // file_ids: null
};

async function main() {
    if (!assistantId) {
        // Create Assistant - https://platform.openai.com/docs/api-reference/assistants/createAssistant
        console.log('createAssistant...');
        const myAssistant = await openai.beta.assistants.create(assistant);
        console.log('✅ createAssistant');
        console.dir(myAssistant, { depth: null });
    } else {
        // Update Assistant - https://platform.openai.com/docs/api-reference/assistants/modifyAssistant
        console.log('updateAssistant...');
        const myUpdatedAssistant = await openai.beta.assistants.update(
            assistantId,
            assistant
        );
        console.log('✅ updateAssistant');
        console.dir(myUpdatedAssistant, { depth: null });
    }
}

main();
