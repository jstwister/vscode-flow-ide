# vscode-flow-ide

An alternative Flowtype extension for Visual Studio Code. Flowtype is a static type checker
ment to find errors in Javascript programs.

## Features

Autocomplete & diagnostics

![Autocomplete](img/autocomplete-diagnostic.gif)

Show types on hover
![Hover](img/hover.gif)

3. Parameter hints
![Param hints](img/param-hints.gif)

4. Inline flow type coverage


## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.

## Extension Settings
This extension contributes the following settings:

* `flowide.enable`: enable/disable this extension
* `flowide.pathToFlow`: Absolute path to the Flow executable. Set it only if the default behaviour of the extension
doesn't work out for you. The extension will try first
to read it from local `node_modules/flow-bin` or globally if not otherwise set here.
* `flowide.useCodeSnippetsOnFunctionSuggest` - Add the function paramters when selecting a function
to autocomple.

## Known Issues

* Parameter hints are not highlighted as the user types.

## Release Notes

### 1.0.0

Initial release of VSCode flow-ide

### Thanks
Inspired by [Flow for VSCode](https://github.com/flowtype/flow-for-vscode) and [Atom Flow-ide]( https://github.com/steelbrain/flow-ide )
## Working with Markdown

**Note:** You can author your README using Visual Studio Code.  Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on OSX or `Ctrl+\` on Windows and Linux)
* Toggle preview (`Shift+CMD+V` on OSX or `Shift+Ctrl+V` on Windows and Linux)
* Press `Ctrl+Space` (Windows, Linux) or `Cmd+Space` (OSX) to see a list of Markdown snippets