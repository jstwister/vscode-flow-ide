/// <reference path="./cross-spawn.d.ts" />
import { spawn } from 'cross-spawn';
import {window, workspace} from 'vscode';
import * as fs from 'fs';

const NODE_NOT_FOUND = '[Flow] Cannot find node in PATH. The simpliest way to resolve it is install node globally'
const FLOW_NOT_FOUND = '[Flow] Cannot find flow in PATH. Try to install it by npm install flow-bin -g'

export function getPathToFlowFromConfig(): string {
	const config = workspace.getConfiguration('flowide');
    if (config) {
        return config.get('pathToFlow').toString();
    }
    return '';
}

export function nodeModuleFlowLocation(rootPath: string): string {
	if (process.platform === 'win32') {
		return `${rootPath}\\node_modules\\.bin\\flow.cmd`
	} else {
		return `${rootPath}/node_modules/.bin/flow`
	}
}
export function determineFlowPath() {
    let pathToFlow = '';
    const localInstall = getPathToFlowFromConfig() || nodeModuleFlowLocation(workspace.rootPath);
	if( fs.existsSync(localInstall) ) {
		pathToFlow = localInstall;
	} else {
		pathToFlow = 'flow';
	}
    return pathToFlow;
}

export function isFlowEnabled() {
	return workspace.getConfiguration('flowide').get('enabled')
}

function buildSearchFlowCommand(testPath: string): {command: string, args: Array<string>} {
  if (process.platform !== 'win32') {
    return {
      command: 'which',
      args: [testPath]
    }
  } else {
    const splitCharLocation = testPath.lastIndexOf('\\')
    const command = testPath.substring(splitCharLocation+1, testPath.length)
    const searchDirectory = testPath.substring(0, splitCharLocation)
    const args = !searchDirectory ? [command] : ['/r', searchDirectory, command]
    return {
      command: `${process.env.SYSTEMROOT || 'C:\\Windows'}\\System32\\where`,
      args: args
    }
  }
}

export function checkFlow() {
	try {
		const { command, args } = buildSearchFlowCommand(determineFlowPath());
		const check = spawn(command, args);
		let
		  flowOutput = "",
			flowOutputError = ""
		check.stdout.on('data', function (data) {
			flowOutput += data.toString();
		})
		check.stderr.on('data', function (data) {
			flowOutputError += data.toString();
		})
		check.on('exit', function (code) {
			if (code != 0) {
				window.showErrorMessage(FLOW_NOT_FOUND);
			}
		})
	} catch(e) {
		window.showErrorMessage(FLOW_NOT_FOUND);
	}
}