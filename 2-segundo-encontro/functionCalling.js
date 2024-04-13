import OpenAi from "openai";
import dotenv from "dotenv";
import {promptMessage} from "../utils/prompt.js";
import axios from "axios";
dotenv.config();

const openai = new OpenAi({apiKey: process.env.OPENAI_API_KEY});

const model = 'gpt-4-turbo-2024-04-09';

const tools = [
    {
        "type": "function",
        "function":{
            "name": "get_user_account",
            "description": "Obtem a conta de um usuário. Só solicite a conta de um usuário quando o usuário informar um email.",
            "parameters": {
                "type": "object",
                "properties": {
                    "email": {
                        "type": "string",
                        "description": "Endereço de email do usuário. Só solicite emails válidos."
                    },
                },
                "required": [
                    "email",
                ]
            }
        }
    }
];


async function get_user_account(email) {
    // Validar email
    // return "Email inválido";

    const accounts = [
        {email: "tiago@tiago.com", name:"Tiago Gouvea", city: "Juiz de Fora/MG"},
        {email: "raquel@raquel.com", name:"Raquel Sousa", city: "São Paulo/SP"},
    ];

    const user = accounts.find(account => account.email === email);

    if (!user)
        return "Usuário não encontrado. Não prossiga sem obter um email válido e um usuário.";
    else
        return user;
}

async function lookupWeather(location) {
    const options = {
        params: {q: location, content: location},
        headers: {
            'X-RapidAPI-Key': '',
            'X-RapidAPI-Host': 'weatherapi-com.p.rapidapi.com'
        }
    };

    // User Id: '9qrylbqOCnmshNNPZ2sQHCoOTi4qp1wN82ojsnHNW1TDIfd9UI'

    try {
        const response = await axios.get('https://weatherapi-com.p.rapidapi.com/current.json',options);
        // console.log("lookupWeather", response.data);
        return response.data;
    } catch (error) {
        console.error(error);
        return "No forecast found";
    }
}

async function main() {
    let messages = [];
    try{
        messages.push(
            {
                role: "system",
                content:
                    "Você é um assistente que ajuda e encontrar boas palestras no Web Summit." +
                    "Para começar a buscar palestras, você deve pedir o email do usuário, que deve ser um email válido, para carregar os dados da conta." +
                    "Saude o usuário pelo nome."+
                    "Em seguida pergunte qual assunto quer ver no Web Summit."+
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
                const fn = completion.choices[0].message.tool_calls[0].function.name;
                const args = JSON.parse(completion.choices[0].message.tool_calls[0].function.arguments);
                // console.log("fn", fn);
                // console.log("args", args);
                if (fn=='get_user_account'){
                    const user = await get_user_account(args.email);
                    // console.log("user", user);

                    messages.push(
                        { role: 'function',
                          name: fn,
                          content: JSON.stringify(user)
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