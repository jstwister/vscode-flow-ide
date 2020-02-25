/// <reference path="./cross-spawn.d.ts" />
import { spawn } from 'cross-spawn';
import * as vscode from 'vscode';
import { getPathToFlow } from './utils';
import * as path from 'path';
import * as fs from  'fs';

export default class FlowLib {
    static execFlow(fileContents, filename, args): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(filename)) {
                resolve(undefined);
                return;
            }
            const cwd = path.dirname(filename);
            const flowBin = getPathToFlow(cwd)
            if (!flowBin) {
                resolve(undefined);
                return;
            }
            let flowOutput = "";
			let flowOutputError = "";
            const flowProc = spawn(flowBin, args, { cwd: cwd });
            flowProc.stdout.on('data', (data) => {
               flowOutput += data.toString();
            });
            flowProc.stderr.on('data', (data) => {
                flowOutputError += data.toString();
            });
            flowProc.on('exit', () => {
                if (flowOutputError) {
                    reject(flowOutputError);
                } else {
                    let result = flowOutput;
                    if(flowOutput && flowOutput.length) {
                        result = JSON.parse(flowOutput);
                    }
                    resolve(result);
                }
            });
            flowProc.stdin.write(fileContents);
            flowProc.stdin.end();
        });
    }

    static getTypeAtPos(fileContents: string, fileName, pos: vscode.Position): Promise<any> {
        return FlowLib.execFlow(
                    fileContents,
                    fileName,  
                    ['type-at-pos', '--json', '--pretty', '--path', fileName, pos.line + 1, pos.character + 1]);
    }

    static getDiagnostics(fileContents: string, fileName: string): Promise<any> {
        return FlowLib.execFlow(
                    fileContents,
                    fileName,  
                    ['status', '--json']);
    }

    static getAutocomplete(fileContents: string, fileName: string, pos: vscode.Position): Promise<any> {
        return FlowLib.execFlow(
                    fileContents,
                    fileName,  
                    ['autocomplete', '--json', fileName, pos.line + 1, pos.character + 1]);
    }

    static getDefinition(fileContents: string, fileName: string, pos: vscode.Position): Promise<any> {
        return FlowLib.execFlow(
                    fileContents,
                    fileName,  
                    ['get-def', '--json', fileName, pos.line + 1, pos.character + 1]);

                    
    }
    
    static getCoverage(fileContents: string, fileName: string): Promise<any> {
        return FlowLib.execFlow(
                    fileContents,
                    fileName,
                    ['coverage', '--json', fileName]);
    }
}