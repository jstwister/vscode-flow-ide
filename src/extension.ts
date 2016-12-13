import HoverProvider from './HoverProvider';
import AutocompleteProvider from './AutocompleteProvider';
import CoverageProvider from './CoverageProvider';
import SignatureProvider from './SignatureProvider';
import DefinitionProvider from './DefinitionProvider';
import { setupDiagnostics } from './Diagnostics';
import { isFlowEnabled } from './utils';
'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
const supportedLanguages =  [
    "javascriptreact",
    "javascript"
];

let paramHintsEnable = false;

export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    if (!isFlowEnabled()) {
        return false;
    }
    console.log('Flow enabled!');
    // The registration needs to happen after a timeout because of 
    context.subscriptions.push(
        vscode.languages.registerSignatureHelpProvider(
            [
                { language: 'javascript', scheme: 'file', pattern: '**/*js*' },
                { language: 'javascriptreact', scheme: 'file', pattern: '**/*js*' }
            ], 
            new SignatureProvider(), '(', '.')
    );

   context.subscriptions.push(
            vscode.languages.registerHoverProvider([
                { language: 'javascript', scheme: 'file', pattern: '**/*js*' },
                { language: 'javascriptreact', scheme: 'file', pattern: '**/*js*' }
            ], 
            new HoverProvider()));
   
   context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider([
            { language: 'javascript', scheme: 'file', pattern: '**/*js*' },
            { language: 'javascriptreact', scheme: 'file', pattern: '**/*js*' }
        ], 
        new AutocompleteProvider(), '.'));

   context.subscriptions.push(
       vscode.languages.registerDefinitionProvider([
            { language: 'javascript', scheme: 'file', pattern: '**/*js*' },
            { language: 'javascriptreact', scheme: 'file', pattern: '**/*js*' }
        ], 
         new DefinitionProvider())
       );
   
   const coverage = new CoverageProvider(context.subscriptions);
   vscode.commands.registerCommand('flow.coverage', () => {
        coverage.toggleDecorations();
        coverage.refreshCoverage();
   });
   setupDiagnostics(context.subscriptions);
}

// this method is called when your extension is deactivated
export function deactivate() {
}