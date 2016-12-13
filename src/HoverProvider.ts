import * as vscode from 'vscode';
import FlowLib from './FlowLib';
const beautify = require('js-beautify').js_beautify;

export default class HoverProvider {
    provideHover(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken): Promise<any> {
            const wordPosition = document.getWordRangeAtPosition(position);
		    if (!wordPosition) return new Promise((resolve) => resolve());
		    const word = document.getText(wordPosition);
            return FlowLib.getTypeAtPos(
                document.getText(), document.uri.fsPath, position).then((typeAtPos:any) => {
                    const beautifiedData = beautify(typeAtPos.type, { indent_size: 4 });
                    return new vscode.Hover([
                        'Flow-IDE',
                        { language: 'javascriptreact', value: `${word}: ${beautifiedData}` }
                    ]);
            }).catch((e) => {
                
            });
    }
}