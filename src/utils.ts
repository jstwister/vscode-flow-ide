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

export function determineFlowPath() {
    let pathToFlow = '';
    const localInstall = getPathToFlowFromConfig() || `${workspace.rootPath}/node_modules/.bin/flow`;
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

export function checkNode() {
	try {
		const check = spawn(process.platform === 'win32' ? 'where' : 'which', ['node'])
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
				window.showErrorMessage(NODE_NOT_FOUND);
			}
		})
	} catch(e) {
		window.showErrorMessage(NODE_NOT_FOUND);
	}
}

export function checkFlow() {
	try {
		const check = spawn(process.platform === 'win32' ? 'where' : 'which', [determineFlowPath()])
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