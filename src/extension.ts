import { dirname } from "path";
import { mkdirSync } from "fs";
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

const createIfNotExist = (translationFile: string) => {
  const directory = dirname(translationFile);
  return mkdirSync(directory);
};

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    "i18ngrabber.grabtext",
    () => {
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

      vscode.window
        .showInputBox({
          value: "Enter The name of the placeholder",
        })
        .then((placeholder) => {
          if (!placeholder) {
            // TODO error handling
            return;
          }

          // Display a message box to the user
          vscode.window.showInformationMessage(
            "Selected text:" + text + " input " + placeholder,
          );

          editor?.edit((editBuilder) => {
            const newString = `{{ $t('${placeholder}') }}`;
            editBuilder.replace(selection, newString);
          });

          const config = vscode.workspace.getConfiguration("i18nGrabber");
          const translationFile = config
            .get("translationFileLocation", "locale/en.json")
            .toString();

          createIfNotExist(translationFile);

          addToLocaleFile(placeholder, text, translationFile)
            .then(() => {
              vscode.window.showInformationMessage(
                `Added placeholder ${placeholder} to ${translationFile}`,
              );
            })
            .catch((error) => {
              vscode.window.showErrorMessage(error);
            });
        });
    },
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
// export function deactivate() {}
