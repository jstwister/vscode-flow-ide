import * as vscode from 'vscode'
import FlowLib from './FlowLib'

export default class DefinitionProvider {
  private channel: vscode.OutputChannel

  constructor({ channel }: { channel: vscode.OutputChannel }) {
    this.channel = channel
  }

  async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Location | vscode.Location[] | null> {
    try {
      const fileContents = document.getText()
      const definition = await FlowLib.getDefinition(
        fileContents,
        document.uri.fsPath,
        position
      )
      if (definition && definition.path) {
        const startPosition = new vscode.Position(
          Math.max(0, definition.line - 1),
          Math.max(0, definition.start - 1)
        )
        const endPosition = new vscode.Position(
          Math.max(0, definition.endline - 1),
          Math.max(0, definition.end - 1)
        )
        const uri = vscode.Uri.file(definition.path)

        return new vscode.Location(
          uri,
          new vscode.Range(startPosition, endPosition)
        )
      }
      return null
    } catch (error) {
      this.channel.appendLine(error.stack)
      throw error
    }
  }
}
