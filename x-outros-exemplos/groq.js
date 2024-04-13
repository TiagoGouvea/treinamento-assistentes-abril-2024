import Groq from "groq-sdk";
// Crie a API KEY em https://console.groq.com/keys
const groq = new Groq({apiKey: process.env.GROQ_API_KEYnv});
// Vejatodos os modelos https://console.groq.com/docs/models
const model = "mixtral-8x7b-32768";


async function main() {
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "user",
                content: "Qual a vantagem de ter respostas rápidas da LLM?"
            }
        ],
        model,
        stream: false
    });
    console.log(completion);
    console.log(completion.choices[0]?.message?.content || "");
}
main().then();
