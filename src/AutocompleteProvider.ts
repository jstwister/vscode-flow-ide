import * as console from 'console';
import * as vscode from 'vscode';
import FlowLib from './FlowLib';
import * as Path from 'path';
const mapToVSCodeType = (item) => {
    if (item.func_details !== null) {
        return vscode.CompletionItemKind.Function;
    }
    if (item.type && item.type.indexOf('[class: ') >= 0) {
        return vscode.CompletionItemKind.Class;
    }

    return vscode.CompletionItemKind.Variable;
}
const buildCodeSnippet = (item) => {
    let codeSnippet = item.name;
    const config = vscode.workspace.getConfiguration('flowide');
    if (config.get('use CodeSnippetsOnFunctionSuggest')) {
        if (item.func_details && item.func_details.params) {
            const suggestionArgumentNames = item.func_details.params
                .map((param) => `{{${param.name.replace('?', '')}}}`);
            if (suggestionArgumentNames.length > 0) {
                codeSnippet += '(' + suggestionArgumentNames.join(', ') + '){{}}';
            } else {
                codeSnippet += '()';
            }
        }
    }

    return codeSnippet;
}

export default class AutocompleteProvider {
    provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): any {
        const config = vscode.workspace.getConfiguration('flowide');
        const sortAutocompleteAfterEditorProperties = config.get('sortAutocompleteAfterEditorProperties');
        const ignoreAutocomplete = config.get('ignoreAutocomplete');
        if (ignoreAutocomplete) {
            return [];
        }

        const fileContents = document.getText();
        const autocompletePromise = FlowLib.getAutocomplete(fileContents, document.uri.fsPath, position);
        return autocompletePromise.then((completions) => {
            return completions.result.map((item) => {
                const completionItem = new vscode.CompletionItem(item.name, mapToVSCodeType(item));
                completionItem.insertText = buildCodeSnippet(item);
                completionItem.detail = item.type ? item.type : Path.basename(item.path);
                if (sortAutocompleteAfterEditorProperties) {
                    // It seems VSCode uses 0 to put property items on top, while globals uses 1. 
                    // Therefore 0_ will put items between properties and globals.
                    completionItem.sortText = "0_" + completionItem.insertText;
                }
                return completionItem;
            });
        });
    }
}