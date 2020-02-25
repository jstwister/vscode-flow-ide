/// <reference path="./cross-spawn.d.ts" />
import {workspace} from 'vscode';
import findRoot from 'find-root';
import * as resolve from 'resolve';
import * as fs from 'fs';
import * as path from 'path';

export function isFlowEnabled() {
	return workspace.getConfiguration('flowide').get('enabled')
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

export function getPathToFlow(cwd: string): string | null {
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
