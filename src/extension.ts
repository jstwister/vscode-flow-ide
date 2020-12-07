import HoverProvider from './HoverProvider'
import AutocompleteProvider from './AutocompleteProvider'
import CoverageProvider from './CoverageProvider'
import SignatureProvider from './SignatureProvider'
import DefinitionProvider from './DefinitionProvider'
import { setupDiagnostics } from './Diagnostics'
import * as vscode from 'vscode'

const supportedLanguages = ['javascriptreact', 'javascript']

const documentSelector = supportedLanguages.map((language) => ({
  language,
  scheme: 'file',
}))

export function activate(context: vscode.ExtensionContext) {
  const channel: vscode.OutputChannel = vscode.window.createOutputChannel(
    'vscode-flow-ide'
  )
  context.subscriptions.push(channel)

  // The registration needs to happen after a timeout because of
  context.subscriptions.push(
    vscode.languages.registerSignatureHelpProvider(
      documentSelector,
      new SignatureProvider({ channel }),
      '(',
      '.'
    )
  )

  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      documentSelector,
      new HoverProvider({ channel })
    )
  )

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      documentSelector,
      new AutocompleteProvider({ channel }),
      '.'
    )
  )

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      documentSelector,
      new DefinitionProvider({ channel })
    )
  )

  const coverage = new CoverageProvider(context.subscriptions, { channel })
  const refreshCoverage = () => {
    coverage.toggleDecorations()
    coverage.refreshCoverage()
  }
  vscode.commands.registerCommand('flow.coverage', refreshCoverage)
  setupDiagnostics(context.subscriptions, { channel })
}

// this method is called when your extension is deactivated
export function deactivate() {}
