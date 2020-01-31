import * as path from 'path';
import { CheckedSwitchFile } from '../types';
import { getRailsContext } from '../rails-context';
import { viewMaker } from '../makers';
import { getSwitchesFromRule } from '../switches';
import { openFile, showPicker } from './util';
import { createView } from './create-view';
import * as vscode from 'vscode';

function isCurrentMethodView(methodName: string, filename: string): boolean {
  const viewName = path.basename(filename).split('.')[0];
  return viewName === methodName;
}

function filteredViewFiles(methodName: string, switchFiles: CheckedSwitchFile[]): CheckedSwitchFile[] {
  return switchFiles.filter(file => isCurrentMethodView(methodName, file.filename));
}

export function switchToView(): Promise<void> {
  return getRailsContext(async function(railsFile, workspace) {
    if (!railsFile.isController()) {
      return;
    }

    const switchFiles = await getSwitchesFromRule(viewMaker, railsFile);
    const openViewOnFirstMatch = vscode.workspace.getConfiguration('rails').get('openViewOnFirstMatch');

    if (switchFiles.length === 0) {
      return await createView();
    }

    if (
      switchFiles.length === 1 ||
      isCurrentMethodView(railsFile.methodName, switchFiles[0].filename)
    ) {
      return openFile(switchFiles[0].filename);
    }

    if ( switchFiles.length > 1 ) {
      const viewFiles = filteredViewFiles(railsFile.methodName, switchFiles)

      if (viewFiles.length == 1 || (openViewOnFirstMatch && viewFiles.length > 1) ) {
        return openFile(viewFiles[0].filename);
      } else {
        return showPicker(railsFile.railsRoot, switchFiles);
      }
    }
  });
}
