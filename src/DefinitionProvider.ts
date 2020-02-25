import * as console from 'console';
import * as vscode from 'vscode';
import FlowLib from './FlowLib';
import * as Path from 'path';


export default class DefinitionProvider {
    async provideDefinition(
        document:vscode.TextDocument,
		position:vscode.Position,
		token: vscode.CancellationToken,
    ): Promise<vscode.Location | vscode.Location[] | null> {
        const fileContents = document.getText();
        const definition = await FlowLib.getDefinition(fileContents, document.uri.fsPath, position);
        if (definition && definition.path) {
            const startPosition = new vscode.Position(Math.max(0, definition.line - 1), Math.max(0, definition.start - 1));
            const endPosition = new vscode.Position(Math.max(0, definition.endline - 1), Math.max(0, definition.end - 1));
            const uri = vscode.Uri.file(definition.path);
            
            return new vscode.Location(uri, new vscode.Range(startPosition, endPosition));
        }
        return null;
    }
}