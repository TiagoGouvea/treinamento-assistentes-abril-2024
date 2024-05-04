import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { CharacterTextSplitter } from "langchain/text_splitter";
import dotenv from "dotenv";
dotenv.config();
import OpenAi from "openai";
import * as fs from "fs";
const openai = new OpenAi({apiKey:process.env.OPENAI_API_KEY});
const model = "gpt-4-turbo-2024-04-09";
const embeddingsPath = './3-terceiro-encontro/embeddings';

// 1 >>> Prompt
console.log("🧪 1 - Prompt");
const prompts = [
    "A App Masters já fez serviços para quais países?",
    "Em que ano a empresa foi fundada?",
    "Quanto custa o desenvolvimento de um MVP?",
    "Qual foi o ultimo projeto realizado?",
    "Quais tecnologias a empresa usa?",
    "Quais os valores da empresa?",
    "Quem são os sócios da App Masters?"
];
const random = Math.floor(Math.random() * prompts.length);
const prompt = prompts[random];
console.log("prompt", prompt);


// >>>> 1,5 Prompt adjust
// console.log("🧪 1,5 - Prompt Adjust");
// async function getAdjustedPrompt(prompt) {
//     const completion = await openai.chat.completions.create({
//         messages: [{
//             "role": "system",
//             "content": "" +
//                 "Given the following question, rephrase the follow up question to be a standalone question, in its original language to be used to search on a embeddings database.\n"+
//                 "Follow Up Input: "+ prompt +"\n"+
//                 "Standalone question:"
//             }
//         ],
//         model,
//         max_tokens: 60,
//     });
//
//     return completion.choices[0].message.content;
// }
// const adjustedPrompt = await getAdjustedPrompt(prompt);
// console.log("adjustedPrompt", adjustedPrompt);

// 2 >>> Embed prompt
console.log("🧪 2 - Embedded Prompt");
const embPro = await openai.embeddings.create({
    input: prompt, // adjustedPrompt, //
    model: "text-embedding-3-small",
});
const embeddedPrompt = embPro.data[0].embedding;
// console.log("embeddedPrompt",embeddedPrompt);

// 3 >>> Search
console.log("🧪 3 - Search similar paragraphs");

const embeddingStore = JSON.parse(fs.readFileSync(embeddingsPath+'/embeddings.json', {
    encoding: "utf-8",
    flag: "r",
}));
console.log("EmbeddingStore", embeddingStore.length);

const findClosestParagraphs = (embeddingStore, questionEmbedding, limit) => {
    const cosine = (embedding1, embedding2)=>{
        let p = 0;
        let p2 = 0;
        let q2 = 0;
        for (let i = 0; i < embedding1.length; i++) {
            p += embedding1[i] * embedding2[i];
            p2 += embedding1[i] * embedding1[i];
            q2 += embedding2[i] * embedding2[i];
        }
        return p / (Math.sqrt(p2) * Math.sqrt(q2));
    }

    const rankedChunks = [];
    for (const item of embeddingStore) {
        let currentEmbedding = JSON.parse(item.embedding);
        rankedChunks.push({
            paragraph: item.chunk,
            score: cosine(questionEmbedding, currentEmbedding),
        });
    }

    rankedChunks.sort(function (a, b) {
        return b.score - a.score;
    });

    // console.log("Ranked Chunks", rankedChunks);
    return rankedChunks.slice(0, limit).map((item) => item.paragraph);
};

const paragraphs = findClosestParagraphs(embeddingStore, embeddedPrompt, 10);
console.log("Similar Paragraphs", paragraphs.length);
console.log("paragraphs", paragraphs);

// 4 >>> Answer
console.log("🧪 4 - Answer with information");
async function getAnswerPrompt(prompt, paragraphs) {
    const completion = await openai.chat.completions.create({
        messages: [{
            "role": "system",
            "content": "Responda a pergunta se baseando apenas no conteúdo a seguir. " +
                "Só faça afirmações se tiver 100% de certeza.\n\n" +
                paragraphs.join("\n") +
                "\n\n" +
                "Pergunta: " + prompt + "\n"
        }],
        model
    });
    return completion.choices[0].message.content;
}
const answerPrompt = await getAnswerPrompt(prompt, paragraphs);
console.log("Answer", answerPrompt);