import {error} from 'util';
import {mkdir} from 'fs';
import * as vscode from 'vscode';
import FlowLib from './FlowLib';
import * as Path from 'path';
 
 const diagnostics = vscode.languages.createDiagnosticCollection('Flow-IDE');

export function setupDiagnostics(disposables: Array<vscode.Disposable>) {
    // Do an initial call to get diagnostics from the active editor if any
	if (vscode.window.activeTextEditor) {
		updateDiagnostics(vscode.window.activeTextEditor.document);
	}

	// Update diagnostics: when active text editor changes
	disposables.push(vscode.window.onDidChangeActiveTextEditor(editor => {
		updateDiagnostics(editor && editor.document);
	}));

	// Update diagnostics when document is edited
	disposables.push(vscode.workspace.onDidSaveTextDocument(event => {
		if (vscode.window.activeTextEditor) {
			updateDiagnostics(vscode.window.activeTextEditor.document);
		}
	}));
}

const fetchFlowDiagnostic = (fileContents: string, filename: string) => {
    return FlowLib.getDiagnostics(fileContents, filename);
}

const mapFlowDiagLevelToVSCode = (flowDiagLevel) => {
    switch(flowDiagLevel) {
        case 'error':
            return vscode.DiagnosticSeverity.Error;
    }
}
const buildDiagnosticMessage = (err) => {
    return err.message.map((m) => {
       return m.type === 'Blame' ? `${m.descr} (${Path.basename(m.path)}:${m.line}:${m.start})` : m.descr
    }).join(' ');
};

const mapFlowDiagToVSCode = (errors) => {
    const groupedDiagnosis = {};
    errors.forEach((err) => {
        const firstBlame = err.message.find((m) => m.type === 'Blame');
        groupedDiagnosis[firstBlame.path] = groupedDiagnosis[firstBlame.path] || []; 
        const diag = new vscode.Diagnostic(
            new vscode.Range(
                new vscode.Position(firstBlame.line - 1, firstBlame.start - 1),
                new vscode.Position(firstBlame.endLine - 1, firstBlame.end)
            ),
            buildDiagnosticMessage(err),
            mapFlowDiagLevelToVSCode(err.level)
        );
        diag.source = 'flow'
        groupedDiagnosis[firstBlame.path].push(diag);
    });
    return groupedDiagnosis;
}
const updateDiagnostics = (document: vscode.TextDocument) => {
    if (!document) {
        return;
    }
    const filename = document.uri.fsPath;
    if (
        filename.indexOf('.js') === -1 && 
        filename.indexOf('.jsx') === -1 &&
        filename.indexOf('.es6') === -1) {
            return false;
    }
    diagnostics.clear();   
    fetchFlowDiagnostic(document.getText(), filename).then((flowDiag) => {
        const vscodeDiagByFile = mapFlowDiagToVSCode(flowDiag.errors);
        Object.keys(vscodeDiagByFile).forEach((file) => {
            diagnostics.set( vscode.Uri.file(file), vscodeDiagByFile[file]);
        })
    });
}