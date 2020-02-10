/// <reference path="./cross-spawn.d.ts" />
import { spawn } from 'cross-spawn';
import {window, workspace} from 'vscode';
import findRoot from 'find-root';
import * as resolve from 'resolve';
import * as fs from 'fs';
import * as path from 'path';

const NODE_NOT_FOUND = '[Flow] Cannot find node in PATH. The simpliest way to resolve it is install node globally'
const FLOW_NOT_FOUND = '[Flow] Cannot find flow in PATH. Try to install it by npm install flow-bin -g'

export function getPathToFlowFromConfig(): string {
	const config = workspace.getConfiguration('flowide');
    if (config) {
				const pathToFlow = config.get('pathToFlow');
				if (pathToFlow) return pathToFlow.toString();
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
		const {rootPath} = workspace;
    const localInstall = getPathToFlowFromConfig() || (rootPath && nodeModuleFlowLocation(rootPath));
	if( localInstall && fs.existsSync(localInstall) ) {
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

const flowBinCache: Map<string, string | null> = new Map();

function cacheFlowBin(cwd: string, flowBin: string | null): void {
	const root = findRoot(cwd);
	do {
		flowBinCache.set(cwd, flowBin);
		cwd = path.dirname(cwd);
	} while (cwd !== root);
}

function purgeFlowBin(cwd: string): void {
	const root = findRoot(cwd);
	do {
		flowBinCache.delete(cwd);
		cwd = path.dirname(cwd);
	} while (cwd !== root);
}

function getFlowBin(cwd: string): string | null {
	if (flowBinCache.has(cwd)) {
		return flowBinCache.get(cwd) || null;
	}
	let result: string | null;
	try {
		// flow-bin exports the path to the binary
		result = require(resolve.sync('flow-bin', {
			basedir: cwd,
		}));
	} catch (error) {
		result = null;
	}
	cacheFlowBin(cwd, result);

	// purge the cached result if the binary changes
	// (if no binary was found, watch package.json for changes)
	const watcher = fs.watch(result || path.join(findRoot(cwd), 'package.json'));
	watcher.once('change', () => {
		watcher.close();
		purgeFlowBin(cwd);
	});
	watcher.once('error', (err: Error) => {
		console.error(err.stack);
		watcher.close();
	});

	return result;
}

export function getPathToFlow(cwd: string): string {
	const pathFromConfig = getPathToFlowFromConfig();
	if (pathFromConfig) return pathFromConfig;
	const flowBin = getFlowBin(cwd);
	if (flowBin) return flowBin;
	checkFlow();
	return determineFlowPath();
}
