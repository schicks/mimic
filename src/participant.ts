import * as vscode from 'vscode';

const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken) => {
    try {
        const initialPromptString = vscode.workspace.getConfiguration('mimic').get<string>('initialPrompt') || 'Default prompt';
        const prompt = [vscode.LanguageModelChatMessage.User(initialPromptString)];

        // Get all the previous participant messages
        const previousMessages = context.history.filter(h => h instanceof vscode.ChatResponseTurn);

        // Add the previous messages to the initial prompt
        previousMessages.forEach(m => {
            let fullMessage = '';
            m.response.forEach(r => {
                const mdPart = r as vscode.ChatResponseMarkdownPart;
                fullMessage += mdPart.value.value;
            });
            prompt.push(vscode.LanguageModelChatMessage.Assistant(fullMessage));
        });

        // Add the user's message
        prompt.push(vscode.LanguageModelChatMessage.User(request.prompt));

        const [model] = await vscode.lm.selectChatModels();
        const response = await model.sendRequest(prompt, {}, token);

        for await (const part of response.text) {
            stream.markdown(part);
        }
    } catch (err) {
        if (err instanceof vscode.LanguageModelError) {
            console.log(err.message, err.code, err.cause);
            if (err.cause instanceof Error && err.cause.message.includes('off_topic')) {
                stream.markdown(vscode.l10n.t('I\'m sorry, I can only explain computer science concepts.'));
            }
        } else {
            throw err;
        }
    }
};

export function registerMimicParticipant(context: vscode.ExtensionContext) {
    const mimic = vscode.chat.createChatParticipant('mimic.participant', handler);
    mimic.iconPath = vscode.Uri.joinPath(context.extensionUri, 'mimic.png');
}