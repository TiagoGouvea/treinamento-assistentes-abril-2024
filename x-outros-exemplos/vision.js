import OpenAi from "openai";

const openaiKey = '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';

const openai = new OpenAi({apiKey:openaiKey});

async function main() {
    try{
        const response = await openai.chat.completions.create({
            model: "gpt-4-vision-preview",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Descreva a imagem" },
                        {
                            type: "image_url",
                            image_url: {
                                "url": "https://www.geeky-gadgets.com/wp-content/uploads/2023/10/LLama-2-13B-vs-Mistral-7B.jpg",
                            },
                        },
                    ],
                },
            ],
        });
        console.log(response.choices[0]);

    } catch (e){
        console.error(e);
    }
}

main().then();


