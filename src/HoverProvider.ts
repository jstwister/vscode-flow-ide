import * as vscode from 'vscode';
import FlowLib from './FlowLib';
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
                    // console.log('Response got back:'+JSON.stringify(typeAtPos));
                    return new vscode.Hover([
                        'Flow-IDE',
                        `${word}: ${typeAtPos.type}`
                    ]);
            }).catch((e) => {
                
            });
    }
}