/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Command, notificationService } from '@salesforce/salesforcedx-utils-vscode';
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import URI from 'vscode-uri';
import * as commandUtils from '../../../src/commands/commandUtils';
import {
  forceLightningLwcTestUIMobileRun
} from '../../../src/commands/forceLightningLwcTestUIMobileRun';
import {
  androidPlatform,
  OperationCancelledException,
  LWCUtils
} from '../../../src/commands/lwcUtils';
import { nls } from '../../../src/messages';

describe('forceLightningLwcTestUIMobileRun', () => {
  const sfdxMobileUTAMRunCommand = 'force:lightning:lwc:test:ui:mobile:run';
  const sfdxMobileConfigCommand = 'force:lightning:lwc:test:ui:mobile:configure';

  const root = /^win32/.test(process.platform) ? 'c:\\' : '/var';
  const mockLwcFileDirectory = path.join(
    root,
    'project',
    'force-app',
    'main',
    'default',
    'lwc',
    'foo'
  );
  const mockLwcFileDirectoryUri = URI.file(mockLwcFileDirectory);
  const mockLwcFilePath = path.join(mockLwcFileDirectory, 'foo.js');
  const mockLwcFilePathUri = URI.file(mockLwcFilePath);

  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sinon.restore();
    sandbox.restore();
  });

  it('shows an error when source path is not recognized as an lwc module file', async () => {
    const notLwcModulePath = path.join(root, 'foo');
    const notLwcModulePathUri = URI.file(notLwcModulePath);

    const expectedErrorMessage = nls.localize('force_lightning_lwc_file_nonexist', /^win32/.test(process.platform) ? 'c:\\foo' : '/var/foo');
    const showErrorSpy = sandbox.spy(commandUtils, 'showError');
    
    sandbox.stub(fs, 'existsSync').returns(false);
    sandbox.stub(fs, 'lstatSync').returns({ isDirectory() { return false; } } as fs.Stats);

    let err: Error | null = null;
    try {
      await forceLightningLwcTestUIMobileRun(notLwcModulePathUri);
    } catch (e) {
      err = e;
    }

    expect(err?.message).to.be.equal(expectedErrorMessage);

    expect(showErrorSpy.callCount).to.equal(1);
    expect(showErrorSpy.getCall(0).args[0].message).equals(expectedErrorMessage);
    expect(showErrorSpy.getCall(0).args[1]).equals('force_lightning_lwc_test_ui_mobile_run');
    expect(showErrorSpy.getCall(0).args[2]).equals(nls.localize('force_lightning_lwc_test_ui_mobile_run_text'));
  });

  it('cancels command if user cancels providing input', async () => {
    const existsSyncStub = sandbox.stub(fs, 'existsSync');
    existsSyncStub.returns(true);

    const lstatSyncStub = sandbox.stub(fs, 'lstatSync');
    lstatSyncStub.returns({
      isDirectory() {
        return true;
      }
    } as fs.Stats);

    const executeSFDXCommandStub = sandbox.stub(LWCUtils, 'executeSFDXCommand');
    const showWarningMessageSpy = sandbox.spy(vscode.window, 'showWarningMessage');
    sandbox.stub(vscode.window, 'showQuickPick').resolves(undefined);

    let err: Error | null = null;
    try {
      await forceLightningLwcTestUIMobileRun(mockLwcFileDirectoryUri);
    } catch (e) {
      err = e;
    }

    expect(err).to.be.equal(null);

    sinon.assert.notCalled(executeSFDXCommandStub);
    expect(
      showWarningMessageSpy.calledWith(new OperationCancelledException().message)
    );
  });

  it('runUTAMTest - Success (browse for WDIO config)', async () => {
    const configFile = '/path/to/wdio.conf.js';
    
    let commands: Command[] = [];

    const existsSyncStub = sandbox.stub(fs, 'existsSync');
    existsSyncStub.returns(true);

    const lstatSyncStub = sandbox.stub(fs, 'lstatSync');
    lstatSyncStub.returns({ isDirectory() { return false; } } as fs.Stats);

    sandbox.stub(LWCUtils, 'selectItem').callsFake(() => Promise.resolve({ label: 'Browse' }));
    sandbox.stub(vscode.window, 'showOpenDialog').callsFake(() => Promise.resolve([vscode.Uri.file(configFile)]));
    sandbox.stub(LWCUtils, 'executeSFDXCommand').callsFake((command, logName, startTime, monitorAndroidEmulatorProcess, onSuccess, onError) => { 
      commands.push(command);
      onSuccess();
    });

    const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');
    const showSuccessfulExecutionStub = sandbox.stub(notificationService, 'showSuccessfulExecution');
    showSuccessfulExecutionStub.returns(Promise.resolve());
    
    await forceLightningLwcTestUIMobileRun(mockLwcFilePathUri);

    expect(commands.length).to.be.equal(1);

    expect(commands[0].args).to.have.same.members([
      sfdxMobileUTAMRunCommand,
      '-f',
      configFile,
      '--spec',
      mockLwcFilePathUri.fsPath
    ]);

    expect(showSuccessfulExecutionStub).to.have.been.called;
    expect(showInformationMessageStub).to.have.been.called;
  });

  it('runUTAMTest - Success (create new WDIO config)', async () => {
    const configFile = '/path/to/wdio.conf.js';
    const appBundle = '/path/to/my.apk';

    let commands: Command[] = [];

    const existsSyncStub = sandbox.stub(fs, 'existsSync');
    existsSyncStub.returns(true);

    const lstatSyncStub = sandbox.stub(fs, 'lstatSync');
    lstatSyncStub.returns({ isDirectory() { return false; } } as fs.Stats);

    sandbox.stub(LWCUtils, 'selectPlatform').callsFake(() => Promise.resolve(androidPlatform));
    sandbox.stub(LWCUtils, 'selectTargetDevice').callsFake(() => Promise.resolve('Pixel_5_API_31'));
    sandbox.stub(LWCUtils, 'getUserInput').callsFake(() => Promise.resolve(''));
    sandbox.stub(LWCUtils, 'executeSFDXCommand').callsFake((command, logName, startTime, monitorAndroidEmulatorProcess, onSuccess, onError) => { 
      commands.push(command);
      onSuccess();
    });

    const selectItemStub = sandbox.stub(LWCUtils, 'selectItem');
    selectItemStub.callsFake((items) => {
      return Promise.resolve(items[0]); // return the first item in the list
    });

    const getFilePathStub = sandbox.stub(LWCUtils, 'getFilePath');
    getFilePathStub.callsFake((title) => {
      if (title === nls.localize('force_lightning_lwc_test_wdio_output_config_file_title')) {
        return Promise.resolve(configFile);
      } else if (title === nls.localize('force_lightning_lwc_app_bundle')) {
        return Promise.resolve(appBundle);
      } else {
        return Promise.resolve('');
      }
    });

    const showInformationMessageStub = sandbox.stub(vscode.window, 'showInformationMessage');
    const showSuccessfulExecutionStub = sandbox.stub(notificationService, 'showSuccessfulExecution');
    showSuccessfulExecutionStub.returns(Promise.resolve());

    await forceLightningLwcTestUIMobileRun(mockLwcFilePathUri);

    expect(commands.length).to.be.equal(2); // UTAM Create Config + UTAM Run

    expect(commands[0].args).to.have.same.members([
      sfdxMobileConfigCommand,
      '-p',
      'Android',
      '-d',
      'Pixel_5_API_31',
      '--bundlepath',
      appBundle,
      '--output',
      configFile,
      '--testframework',
      'jasmine',
      '--appactivity',
      'com.salesforce.chatter.Chatter',
      '--apppackage',
      'com.salesforce.chatter'
    ]);

    expect(commands[1].args).to.have.same.members([
      sfdxMobileUTAMRunCommand,
      '-f',
      configFile,
      '--spec',
      mockLwcFilePathUri.fsPath
    ]);

    expect(showSuccessfulExecutionStub).to.have.been.called;
    expect(showInformationMessageStub).to.have.been.called;
  });
});
