import OpenAi from "openai";
import dotenv from "dotenv";
import {getSystemCompletionLlama3, getSystemCompletionMixtral} from "./providers.js";
dotenv.config();

const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});

const system_prompt = `Você é um assistente que atende possíveis clientes e responde suas perguntas.`;

async function getRoute(user_query) {

    const routes = [
        {
            name: "Agendamentos",
            subjects: ["Agendamento de reuniões", "Cancelamento de reuniões", "Verificação de datas disponíveis"],
            context: 'Para agendar reuniões o usuário deverá seguir pelo link https://www.appmasters.io/pt/agendar-reuniao-prioritaria' +
            'Para cancelar uma reunião basta informar o dia e horário que iremos cancelar.'
        }, {
            name: "Orçamentos",
            context: 'Para realizar um orçamento o usuário deverá informar os detalhes do projeto.',
            subjects: ["Pedidos de preço", "Solicitação de proposta", "Buscando valor de orçamento"]
        }, {
            name: "Localização",
            subjects: ["Informações de local e endereço"],
            context: 'A empresa fica na Avenida Rio Branco 3480 sala 501, Juiz de Fora/MG'
        }, {
            name: "Outros",
            subjects: ["Outros assuntos"],
            context: 'Não falar sobre outros assuntos.'
        }
    ];

    const nRoutes = routes.map(route=>({name: route.name, subjects: route.subjects }));

    const routePrompt = "Você faz o roteamento de perguntas para determinados assuntos." +
        "Dados os assuntos abaixo, diga a rota que o assunto se encaixa." +
        "Retorne apenas um JSON no formato {\"name\": \"Nome da Rota\"}. " +
        "Não retornar nada além do JSON." +
        "\n\n" +
        JSON.stringify(nRoutes) + "\n\n" +
        "Pergunta: " + user_query;

    // let result = await getSystemCompletionLlama(routePrompt, true);
    // let result = await getSystemCompletionGemini(routePrompt, true);
    // let result = await getSystemCompletionMixtral(routePrompt, true);
    let result = await getSystemCompletionLlama3(routePrompt, true);

    if (!result) console.log("try another model, or again");

    // console.log("result",result);

    const route = routes.find(route => route.name==result.name);

    return route;
}

async function main() {
    // const user_query = await promptMessage();
    const user_querys = [
        'Como agendar?',
        'Como cancelar?',
        'Quanto custa',
        'Tem algum processo de seleção aberto?',
        'Como trabalhar pra vocês?',
        'Como chegar?'
    ];
    const random = Math.floor(Math.random() * user_querys.length);
    const user_query = user_querys[random];

    const route = await getRoute(user_query);

    console.log(user_query, "👉", route.name);

    // Basic system prompt
    let messages = [
        { role: 'system', content: system_prompt },
        { role: 'system', content: route.context },
        { role: 'user', content: user_query },
    ];
    // console.log(messages);

    const completion = await openai.chat.completions.create({
        messages,
        model: "gpt-3.5-turbo"
    });

    console.log(completion.choices[0].message.content);

}

main().then();