import * as path from "path";
import { mkdirSync, existsSync } from "fs";
import { cwd } from "process";
import * as jsonFile from "jsonfile";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

import set = require("lodash.set");

const addToLocaleFile = (
  placeholder: string,
  text: string,
  translationFile: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    jsonFile.readFile(
      translationFile,
      (e: unknown, obj: Record<string, unknown>) => {
        /* eslint-disable no-irregular-whitespace */
        obj = obj || {};

        // this will transform dot notation
        set(obj, placeholder, text);

        jsonFile.writeFile(
          translationFile,
          obj,
          { spaces: 4 },
          (err: unknown) => {
            reject(err);
          },
        );
        resolve();
      },
    );
  });
};

const getConfigString = (name: string, _default: string) => {
  const config = vscode.workspace.getConfiguration("i18nGrabber");
  const configString = config.get(name, _default).toString();

  return configString;
};

const createIfNotExist = (translationFile: string): void => {
  const directory = path.dirname(translationFile);

  if (!existsSync(directory)) {
    mkdirSync(directory);
  }
};

const getPlaceholder = (): Thenable<string | undefined> => {
  return vscode.window.showInputBox({
    value: "Enter The name of the placeholder",
  });
};

const replaceString = (
  selection: vscode.Selection,
  placeholder: string,
): void => {
  const editor = vscode.window.activeTextEditor;

  const replaceTemplate = getConfigString(
    "replaceTemplate",
    '{{ $t("<placeholder>") }}',
  );

  const replacedString = replaceTemplate.replace("<placeholder>", placeholder);

  editor?.edit((editBuilder) => {
    const newString = replacedString;
    editBuilder.replace(selection, newString);
  });
};

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    "i18nGrabber.grabtext",
    async () => {
      const editor = vscode.window.activeTextEditor;

      if (!editor) {
        return; // No open text editor
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection);

      if (text === "") {
        vscode.window.showInformationMessage("Please select your text");
        return;
      }

      const placeholder = await getPlaceholder();

      if (!placeholder) {
        vscode.window.showErrorMessage("Please enter a placeholder name");
        return;
      }

      const translationFile = getConfigString(
        "translationFileLocation",
        "src/locales/en.json",
      );

      if (!vscode.workspace.rootPath) {
        vscode.window.showErrorMessage("Could not determine workspace path.");
        return;
      }

      const translationFilePath = path.join(
        vscode.workspace.rootPath,
        translationFile,
      );

      try {
        createIfNotExist(translationFilePath);
      } catch (error) {
        vscode.window.showErrorMessage(
          `Could not create file in ${cwd()}: ${error}`,
        );
        return;
      }

      try {
        replaceString(selection, placeholder);
      } catch (error) {
        vscode.window.showErrorMessage("Error replacing the string " + error);
      }

      try {
        await addToLocaleFile(placeholder, text, translationFilePath);
        vscode.window.showInformationMessage(
          `Added placeholder ${placeholder} to ${translationFile}`,
        );
      } catch (error) {
        vscode.window.showErrorMessage(
          "Could not write the translation to the file: " + error,
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
// export function deactivate() {}
