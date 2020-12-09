/// <reference path="./cross-spawn.d.ts" />
import { spawn } from 'cross-spawn'
import * as vscode from 'vscode'
import * as path from 'path'
import * as fs from 'fs'
import { Extension } from './extension'
import findRoot from 'find-root'
import resolve from 'resolve'

function formatArg(arg: string): string {
  return /[^-_a-z0-9=.\/]/i.test(arg) ? `'${arg.replace(/'/g, "'\\''")}'` : arg
}

const flowBinCache: Map<string, string | null> = new Map()

function cacheFlowBin(cwd: string, flowBin: string | null): void {
  let realpath = fs.realpathSync(cwd)
  const root = findRoot(realpath)
  do {
    flowBinCache.set(cwd, flowBin)
    flowBinCache.set(realpath, flowBin)
    cwd = path.dirname(cwd)
    const nextRealpath = path.dirname(realpath)
    if (realpath === root || nextRealpath === realpath) break
    realpath = nextRealpath
  } while (realpath && realpath !== root)
}

function purgeFlowBin(cwd: string): void {
  let realpath = fs.realpathSync(cwd)
  const root = findRoot(realpath)
  do {
    flowBinCache.delete(cwd)
    flowBinCache.delete(realpath)
    if (realpath === root) break
    cwd = path.dirname(cwd)
    const nextRealpath = path.dirname(realpath)
    if (realpath === root || nextRealpath === realpath) break
    realpath = nextRealpath
  } while (realpath && realpath !== root)
}

type ExecFlowOptions = {
  token?: vscode.CancellationToken
}

export default class FlowLib {
  private extension: Extension

  constructor(extension: Extension) {
    this.extension = extension
  }

  getPathToFlow(cwd: string): string | null {
    if (flowBinCache.has(cwd)) {
      return flowBinCache.get(cwd) || null
    }
    let result: string | null
    try {
      // flow-bin exports the path to the binary
      result = require(resolve.sync('flow-bin', {
        basedir: cwd,
      }))
      this.extension.channel.appendLine(`found flow-bin for ${cwd}: ${result}`)
    } catch (error) {
      result = null
      this.extension.channel.appendLine(`no flow-bin found for ${cwd}`)
    }
    cacheFlowBin(cwd, result)

    const watchedFile = result || path.join(findRoot(cwd), 'package.json')

    // purge the cached result if the binary changes
    // (if no binary was found, watch package.json for changes)
    const watcher = fs.watch(watchedFile)
    watcher.once('change', () => {
      this.extension.channel.appendLine(`changed: ${watchedFile}`)
      watcher.close()
      purgeFlowBin(cwd)
    })
    watcher.once('error', (err: Error) => {
      this.extension.channel.appendLine(
        `error watching ${watchedFile}: ${err.stack}`
      )
      watcher.close()
    })

    return result
  }

  async execFlow(
    fileContents,
    filename,
    args,
    options?: ExecFlowOptions
  ): Promise<any> {
    return await vscode.window.withProgress<any>(
      {
        location: vscode.ProgressLocation.Window,
        cancellable: false,
        title: 'Running Flow',
      },
      (progress) =>
        new Promise((resolve, reject) => {
          const command = `flow ${args.map(formatArg).join(' ')}`
          if (!fs.existsSync(filename)) {
            resolve(undefined)
            return
          }
          const cwd = path.dirname(filename)
          const flowBin = this.getPathToFlow(cwd)
          if (!flowBin) {
            resolve(undefined)
            return
          }
          this.extension.channel.appendLine(`Running: ${command}`)
          let flowOutput = ''
          let flowOutputError = ''
          const flowProc = spawn(flowBin, args, { cwd: cwd })
          if (options?.token) {
            options?.token.onCancellationRequested(() =>
              flowProc.kill('SIGINT')
            )
          }
          flowProc.on('error', reject)
          flowProc.stdout.on('data', (data) => {
            flowOutput += data.toString()
          })
          flowProc.stderr.on('data', (data) => {
            flowOutputError += data.toString()
          })
          flowProc.on('exit', (code?: number, signal?: string) => {
            if (
              options?.token?.isCancellationRequested &&
              signal === 'SIGINT'
            ) {
              this.extension.channel.appendLine(
                `Operation was canceled: ${command}`
              )
              reject(new Error(`operation was canceled`))
            } else if (flowOutputError) {
              this.extension.channel.appendLine(
                `${command} exited with ${
                  code != null ? `code ${code}` : `signal ${signal}`
                }: ${flowOutputError}`
              )
              reject(
                new Error(
                  `flow exited with ${
                    code != null ? `code ${code}` : `signal ${signal}`
                  }: ${flowOutputError}`
                )
              )
            } else {
              this.extension.channel.appendLine(
                `Result of ${command}: ${flowOutput}`
              )
              let result = flowOutput
              if (flowOutput && flowOutput.length) {
                result = JSON.parse(flowOutput)
              }
              resolve(result)
            }
          })
          flowProc.stdin.write(fileContents)
          flowProc.stdin.end()
        })
    )
  }

  getTypeAtPos(
    fileContents: string,
    fileName,
    pos: vscode.Position,
    options?: ExecFlowOptions
  ): Promise<any> {
    return this.execFlow(
      fileContents,
      fileName,
      [
        'type-at-pos',
        '--json',
        '--pretty',
        '--path',
        fileName,
        pos.line + 1,
        pos.character + 1,
      ],
      options
    )
  }

  getDiagnostics(fileContents: string, fileName: string): Promise<any> {
    return this.execFlow(fileContents, fileName, ['status', '--json'])
  }

  getAutocomplete(
    fileContents: string,
    fileName: string,
    pos: vscode.Position,
    options?: ExecFlowOptions
  ): Promise<any> {
    return this.execFlow(
      fileContents,
      fileName,
      ['autocomplete', '--json', fileName, pos.line + 1, pos.character + 1],
      options
    )
  }

  getDefinition(
    fileContents: string,
    fileName: string,
    pos: vscode.Position,
    options?: ExecFlowOptions
  ): Promise<any> {
    return this.execFlow(
      fileContents,
      fileName,
      ['get-def', '--json', fileName, pos.line + 1, pos.character + 1],
      options
    )
  }

  getCoverage(fileContents: string, fileName: string): Promise<any> {
    return this.execFlow(fileContents, fileName, [
      'coverage',
      '--json',
      fileName,
    ])
  }
}
