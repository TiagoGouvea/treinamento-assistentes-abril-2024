import { TextLoader } from "langchain/document_loaders/fs/text";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import {CharacterTextSplitter, RecursiveCharacterTextSplitter} from "langchain/text_splitter";
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.SUPABASE_URL, processa.env.SUPABASE_KEY );
import dotenv from "dotenv";
dotenv.config();

import OpenAi from "openai";
const openai = new OpenAi({apiKey:process.env.OPENAI_API_KEY});

// 1 - LOAD
console.log("🧪 1 - Load - TextLoader");

const dataPath = './3-terceiro-encontro/files';

// 1 >>> Load Documents

async function loadDocs(dataPath) {
    // File Directory - https://js.langchain.com/docs/modules/data_connection/document_loaders/file_directory
    const loader = new DirectoryLoader(
        dataPath,
        {
            ".txt": (path) => new TextLoader(path),
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
            chunkSize: 512,
            chunkOverlap: 0,
        });
        chunks = await splitter.createDocuments([rawText]);
    } else {
        // Split by text size
        // let splitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
        //     chunkSize: 32,
        //     chunkOverlap: 0,
        // });
        // chunks = await splitter.splitText(lDoc[0].pageContent);
        throw new Error("Must set a split method");
    }

    return chunks;
}

const chunks = await splitDocs({docs, splitByParagraph: true});
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
                    embedding: response.data[i].embedding
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

async function insertChunk(object){
    const { data, error } = await supabase
        .from('chunks')
        .insert(object)
        .select();
    // console.log("data", data);
    if (error)
        console.log("error", error);
}


embeddings.forEach(async (embedding)=>{
    await insertChunk({content:embedding.chunk, embedding: embedding.embedding});
});

