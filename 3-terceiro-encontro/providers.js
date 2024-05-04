import OpenAi from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function getSystemCompletionLlama3(systemContent, expectJson) {
    const groq = new OpenAi(
        {
            baseURL:'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY
        });

    const result = await groq.chat.completions.create({
        messages: [{role: 'system', content: systemContent}],
        model: "llama3-70b-8192"
    });

    const content = result.choices[0].message.content;

    if (expectJson) {
        return extractJsonFromString(content);
    } else{
        return content;
    }
}
export async function getSystemCompletionLlama(systemContent, expectJson) {
    const groq = new OpenAi(
        {
            baseURL:'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY
        });

    const result = await groq.chat.completions.create({
        messages: [{role: 'system', content: systemContent}],
        model: "llama2-70b-4096"
    });

    const content = result.choices[0].message.content;

    if (expectJson) {
        return extractJsonFromString(content);
    } else{
        return content;
    }
}

export async function getSystemCompletionMixtral(systemContent, expectJson) {
    const groq = new OpenAi(
        {
            baseURL:'https://api.groq.com/openai/v1',
            apiKey: process.env.GROQ_API_KEY
        });

    const result = await groq.chat.completions.create({
        messages: [{role: 'system', content: systemContent}],
        model: "mixtral-8x7b-32768"
    });

    const content = result.choices[0].message.content;
    console.log("content", content);

    if (expectJson) {
        return extractJsonFromString(content);
    } else{
        return content;
    }
}

export async function getSystemCompletionGemini(systemContent, expectJson) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    const model = genAI.getGenerativeModel({ model: "gemini-pro"});

    const result = await model.generateContent(systemContent);
    const response = await result.response;
    const content = response.text();

    if (expectJson) {
        return extractJsonFromString(content);
    } else{
        return content;
    }
}

function extractJsonFromString(inputString) {
    const regex = /{[^{}]*}/;
    const match = inputString.match(regex);
    if (match) {
        try {
            const json = JSON.parse(match[0]);
            return json;
        } catch (e) {
            console.error("Erro ao fazer parse do JSON: ", e);
        }
    } else {
        console.log("Nenhum JSON encontrado na string.");
    }

    return null;
}
