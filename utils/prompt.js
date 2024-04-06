import prompt from "prompt";
import colors from "@colors/colors";

export async function promptMessage() {
    try {
        prompt.message = '';
        prompt.delimiter = '';
        const res = await prompt.get({
            properties: {
                message: {
                    description: colors.magenta('Mensagem>'),
                },
            },
        });
        if (res.message?.trim() !== '') return res.message;
    } catch (e) {
        if (e.message === 'canceled') {
            process.exit();
        }
        console.error(e);
    }
}
