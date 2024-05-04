import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import {CharacterTextSplitter, RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import dotenv from "dotenv";
dotenv.config();

import OpenAi from "openai";
import * as fs from "fs";
const openai = new OpenAi({apiKey:process.env.OPENAI_API_KEY});


// 1 - LOAD
console.log("🧪 1 - Load - TextLoader");

const dataPath = './3-terceiro-encontro/files';
const embeddingsPath = './3-terceiro-encontro/embeddings';


// 1 >>> Load Documents

async function loadDocs(dataPath) {
    // File Directory - https://js.langchain.com/docs/modules/data_connection/document_loaders/file_directory
    const loader = new DirectoryLoader(
        dataPath,
        {
            ".txt": (path) => new TextLoader(path),
            ".pdf": (path) => new PDFLoader(path),
        }
    );
    return await loader.load();
}

const docs = await loadDocs(dataPath);
console.log("Docs", docs.length);
// console.dir(docs,{depth: null});


// 2 >>> Split
console.log("🧪 2 - Split/chunk - CharacterTextSplitter");

export const splitDocs = async ({docs,splitByParagraph}) => {
    // Reads the raw text file
    let rawText = "";

    // Read each file and append its content to rawText
    docs.forEach(doc => {
        rawText += doc.pageContent + "\n\n";
    });

    // console.log(rawText);

    // Paragraph store after splitting
    let chunks = [];

    if (splitByParagraph){
        const splitter = new CharacterTextSplitter({
            separator: "\n",
            chunkSize: 300,
            chunkOverlap: 64,
        });
        chunks = await splitter.createDocuments([rawText]);
    } else {
        // Split by text size
        let splitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
            chunkSize: 512,
            chunkOverlap: 128,
        });
        chunks = await splitter.createDocuments([rawText]);
        // throw new Error("Must set a split method");
    }

    return chunks;
}

const chunks = await splitDocs({docs, splitByParagraph: false});
console.log("Chunks", chunks.length);
// console.dir(chunks,{depth: null});



// 3 >>> Embed
console.log("🧪 3 - Embedding");

async function embedDocs(chunks) {
    // Sending data over to embedding model
    try {
        // Passo um array de strings
        const response = await openai.embeddings.create({
            input: chunks.map((c) => c.pageContent),
            model: "text-embedding-3-small",
        });

        console.log("OpenAi response length",response.data.length);
        // console.dir(response,{depth: null});

        if (response.data.length <chunks.length)
            throw new Error("Not enough embeddings");

        // Percorro o array de respostas, para organizar um objeto a ser convertido em arquivo
        const result = [];
        for (let i = 0; i < chunks.length; i++) {
            // Adding each embedded para to embeddingStore
            result.push(
                {
                    chunk: chunks[i].pageContent,
                    embedding: JSON.stringify(response.data[i].embedding)
                }
            );
        }

        return result;
    } catch (error) {
        console.log("🚨 Error on embedDocs");
        if (error.response) {
            console.error(error.response.status, error.response.data);
        } else {
            console.log(error);
        }
    }
}
const embeddings = await embedDocs(chunks);
if (!embeddings || embeddings.length == 0)
    throw new Error("No embeddings found");

console.log("Embeddings", embeddings.length);
// console.dir(embeddings,{depth: null});
// console.log(JSON.stringify(embeddings));

// 4 >>> Store
console.log("🧪 4 - Store embeddings");
// Write embeddingStore to destination file
fs.writeFileSync(embeddingsPath+'/embeddings.json', JSON.stringify(embeddings, null, 2));