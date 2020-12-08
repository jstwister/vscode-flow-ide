import * as vscode from 'vscode';
import FlowLib from './FlowLib';

export default class SignatureProvider implements vscode.SignatureHelpProvider {
    public provideSignatureHelp(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ):any {
            let theCall = this.walkBackwardsToBeginningOfCall(document, position);
            if (theCall == null) {
                return Promise.resolve(null);
            }
            let callerRange = this.previousTokenPosition(document, theCall.openParen);
            let callerPos = callerRange.end;
            let callerPosStart = callerRange.start;
            const fileContents = document.getText();
            const currentPosOffset = document.offsetAt(position);
            const callerEndPosOffset = document.offsetAt(callerPos);
            const callerStartPosOffset = document.offsetAt(callerPosStart);
            const callerName = fileContents.slice(callerStartPosOffset, callerEndPosOffset);
            const strToAutocomplete = fileContents.slice(0, callerEndPosOffset) + fileContents.slice(currentPosOffset);
            const autocompletePromise = FlowLib.getAutocomplete(strToAutocomplete, document.uri.fsPath, callerPos);
            
            return autocompletePromise.then((completions) => {
                const res = completions.result;
                const item = res.find((c) => c.func_details != null && c.name === callerName);
                if (!item) {
                    return null;
                }
                const signatureHelp = new vscode.SignatureHelp();
                const sig = new vscode.SignatureInformation(callerName + item.type, '');
                sig.parameters = item.func_details.params.map((detail) => {
                    return new vscode.ParameterInformation(`${detail.name}:${detail.type}`);
                });
                signatureHelp.signatures = [sig];
                signatureHelp.activeParameter = Math.min(theCall.commas.length-1, item.func_details.params.length - 1);
                signatureHelp.activeSignature = 0;
                return signatureHelp;
            });
    }
    private previousTokenPosition(document: vscode.TextDocument, position: vscode.Position): any {
		while (position.character > 0) {
			let word = document.getWordRangeAtPosition(position);
			if (word) {
				return word;
			}
			position = position.translate(0, -1);
		}
		return null;
	}

	private walkBackwardsToBeginningOfCall(document: vscode.TextDocument, position: vscode.Position): any {
		let currentLine = document.lineAt(position.line).text.substring(0, position.character);
		let parenBalance = 0;
		let commas:Array<vscode.Position> = [];
		for (let char = position.character; char >= 0; char--) {
			switch (currentLine[char]) {
				case '(':
					parenBalance--;
					if (parenBalance < 0) {
						return {
							openParen: new vscode.Position(position.line, char),
							commas: commas
						};
					}
					break;
				case ')':
					parenBalance++;
					break;
				case ',':
					if (parenBalance === 0) {
						commas.push(new vscode.Position(position.line, char));
					}
			}
		}
		return null;
	}
}
