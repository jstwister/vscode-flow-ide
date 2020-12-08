import * as vscode from 'vscode'
import { Extension } from './extension'
const beautify = require('js-beautify').js_beautify

export default class HoverProvider {
  private extension: Extension

  constructor(extension: Extension) {
    this.extension = extension
  }

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    try {
      const wordPosition = document.getWordRangeAtPosition(position)
      if (!wordPosition) return null
      const word = document.getText(wordPosition)
      const typeAtPos = await this.extension.flowLib.getTypeAtPos(
        document.getText(),
        document.uri.fsPath,
        position,
        { token }
      )
      if (!typeAtPos) return null
      try {
        const beautifiedData = beautify(typeAtPos.type, { indent_size: 4 })
        return new vscode.Hover([
          'Flow-IDE',
          { language: 'javascriptreact', value: `${word}: ${beautifiedData}` },
        ])
      } catch (error) {}
      return null
    } catch (error) {
      if (!token.isCancellationRequested) this.extension.logError(error)
      return null
    }
  }
}
