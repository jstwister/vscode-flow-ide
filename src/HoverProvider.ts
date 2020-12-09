import * as vscode from 'vscode'
import { Extension } from './extension'
import prettier from 'prettier'

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
      let value = `type ${word} = ${typeAtPos.type}`
      try {
        value = prettier.format(`type ${word} = ${typeAtPos.type}`, {
          semi: false,
          parser: 'flow',
          trailingComma: 'es5',
        })
      } catch (error) {
        try {
          value = prettier.format(`type _${word}_ = ${typeAtPos.type}`, {
            semi: false,
            parser: 'flow',
            trailingComma: 'es5',
          })
        } catch (error) {}
      }
      return new vscode.Hover([
        'vscode-flow-ide',
        { language: 'javascriptreact', value },
      ])
    } catch (error) {
      if (!token.isCancellationRequested) this.extension.logError(error)
      return null
    }
  }
}
