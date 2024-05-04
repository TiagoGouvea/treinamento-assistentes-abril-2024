const model = "gpt-3.5-turbo";
import { createClient } from '@supabase/supabase-js'
import dotenv from "dotenv";
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY );


import OpenAi from "openai";
const openai = new OpenAi({apiKey:process.env.OPENAI_API_KEY});

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

// 2 >>> Embed prompt
console.log("🧪 2 - Embedded Prompt");
const embPro = await openai.embeddings.create({
    input: prompt,
    model: "text-embedding-3-small",
});
const embeddedPrompt = embPro.data[0].embedding;
// console.log("embeddedPrompt",embeddedPrompt);

// 3 >>> Search
console.log("🧪 3 - Search similar paragraphs");

/*
create or replace function match_documents (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language sql stable
as $$
  select
    chunks.id,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where chunks.embedding <=> query_embedding < 1 - match_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
 */

async function fetchNearestEmbeddings(targetEmbedding) {
    try {
        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: targetEmbedding,
            match_threshold: 0.20,
            match_count: 3,
        })

        if (error) {
            throw error;
        }
        return data;
    } catch (err) {
        console.error('Erro ao buscar embeddings:', err.message);
    }
}
const chunks = await fetchNearestEmbeddings(embeddedPrompt);
console.log("Similar Chunks", chunks.length);
console.log("Chunks", chunks);

// 4 >>> Answer
console.log("🧪 4 - Answer with information");
async function getAnswerPrompt(prompt, paragraphs) {
    const completion = await openai.chat.completions.create({
        messages: [{
            "role": "system",
            "content": "Responda a pergunta se baseando apenas no conteúdo a seguir. Só faça afirmações se tiver 100% de certeza.\n\n" +
                paragraphs.join("\n") +
                "\n\n" +
                "Pergunta: " + prompt + "\n"
        }],
        model
    });
    return completion.choices[0].message.content;
}
const answerPrompt = await getAnswerPrompt(prompt, chunks.map(chunk=>chunk.content));
console.log("Answer", answerPrompt);