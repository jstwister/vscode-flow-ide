import * as vscode from 'vscode';
import FlowLib from './FlowLib';
const beautify = require('js-beautify').js_beautify;

export default class HoverProvider {
    async provideHover(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken
    ): Promise<vscode.Hover | null> {
        const wordPosition = document.getWordRangeAtPosition(position);
        if (!wordPosition) return null;
        const word = document.getText(wordPosition);
        const typeAtPos = await FlowLib.getTypeAtPos(document.getText(), document.uri.fsPath, position);
        if (!typeAtPos) return null;
        try {
            const beautifiedData = beautify(typeAtPos.type, { indent_size: 4 });
            return new vscode.Hover([
                'Flow-IDE',
                { language: 'javascriptreact', value: `${word}: ${beautifiedData}` }
            ]);
        } catch (error) {

        }
        return null;
    }
}