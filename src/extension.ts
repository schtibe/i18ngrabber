import * as jsonFile from 'jsonfile';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const set = require('lodash.set');

/**
 * Write a translation to it's corresponding file
 * @param  {String} locale       e.g. 'de'
 * @param  {String} key          e.g 'page.dashboard.title'
 * @param  {String} translation  The translation for <key>
 * @param  {String} dir          Directory to write files to
 * @return {Promise}
 */
const writeTranslationsToDisk = (locale: string, key: string, translation: string, dir: string): Promise<string> => {
	return new Promise((resolve, reject) => {
		let translationFile: string;

		translationFile = `${dir}/${locale}.json`;

		jsonFile.readFile(translationFile, (e: any, obj: any) => {
			/* eslint-disable no-irregular-whitespace */
			obj = obj || {};

			// this will transform dot notation
			set(obj, key, translation);

			jsonFile.writeFile(translationFile, obj, { spaces: 4 }, (err: any) => { reject(err); });
			resolve();
		});

		return translationFile;
	});
};

const addToLocaleFile = (placeholder: string, text: string) => {
	return writeTranslationsToDisk(
		'de', placeholder, text, 'locale/'
	);
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


			addToLocaleFile(placeholder, text).then((file: string) => {
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
