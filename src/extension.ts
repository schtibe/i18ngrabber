import * as jsonFile from 'jsonfile';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const set = require('lodash.set');

const addToLocaleFile = (placeholder: string, text: string, translationFile: string): Promise<string> => {
	return new Promise((resolve, reject) => {

		jsonFile.readFile(translationFile, (e: any, obj: any) => {
			/* eslint-disable no-irregular-whitespace */
			obj = obj || {};

			// this will transform dot notation
			set(obj, placeholder, text);

			jsonFile.writeFile(translationFile, obj, { spaces: 4 }, (err: any) => { reject(err); });
			resolve();
		});

		return translationFile;
	});
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "i18ngrabber" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('i18ngrabber.grabtext', () => {
		// The code you place here will be executed every time your command is executed

		var editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		var selection = editor.selection;

		var text = editor.document.getText(selection);

		if (text === '') {
			vscode.window.showInformationMessage('Please select your text');
			return;
		}

		vscode.window.showInputBox({
			value: "Enter The name of the placeholder"
		}).then(placeholder => {
			if (!placeholder) {
				// TODO error handling
				return;
			}

			// Display a message box to the user
			vscode.window.showInformationMessage(
				'Selected text:' + text + " input " + placeholder);

			editor?.edit((editBuilder) => {
				const newString = `{{ $t('${placeholder}') }}`;
				editBuilder.replace(
					selection,
					newString
				);
			});

			const config = vscode.workspace.getConfiguration('i18nGrabber');
			const translationFile = config.get('translationFileLocation', 'locale/en.json').toString();

			addToLocaleFile(placeholder, text, translationFile).then((file: string) => {

				vscode.window.showInformationMessage(
					`Added placeholder ${placeholder} to ${file}`
				);
			});


		});
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
