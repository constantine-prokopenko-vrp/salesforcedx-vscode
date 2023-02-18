/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { step } from 'mocha-steps';
import { DefaultTreeItem, TextEditor, TreeItem } from 'wdio-vscode-service';
import {
  ScratchOrg
} from '../scratchOrg';
import * as utilities from '../utilities';
import * as fs from 'fs'; 
import path from 'path';

describe('SObjects Definitions', async () => {
  const tempProjectName = 'TempProject-sObjectsDefinitions';
  let scratchOrg: ScratchOrg;

  step('Set up the testing environment', async () => {
    scratchOrg = new ScratchOrg('sObjectsDefinitions', false);
    await scratchOrg.setUp();
    const projectPath = scratchOrg.projectFolderPath;
    const source = '/Users/ritam.agrawal/workspace/salesforcedx-vscode/automation-tests/test/testData/CustomSObjects'
    const destination = path.join(projectPath,'force-app/main/default/objects');
    // Copy custom sobjects from source to destination
    fs.cp(source, destination, { recursive: true }, (err) => {
      if (err) {
        console.error(err);
      }
    });
  });

  // Create a -meta.xml file through CP in force-app/main/default/objects
  step('Custom Objects Customer and Product are within objects folder', async () => {
    const workbench = await browser.getWorkbench();
    const sidebar = workbench.getSideBar();
    const content = sidebar.getContent();
    const treeViewSection = await content.getSection(tempProjectName.toUpperCase());
    expect(treeViewSection).not.toEqual(undefined);
    const objectTreeItem = await treeViewSection.findItem('objects') as DefaultTreeItem;
    expect(objectTreeItem).not.toEqual(undefined);
    await objectTreeItem.select();
    const customerObject = await objectTreeItem.findChildItem('Customer__c');
    expect(customerObject).not.toEqual(undefined);
    await customerObject?.expand();
    const productObject = await objectTreeItem.findChildItem('Product__c');
    expect(productObject).not.toEqual(undefined);
    await productObject?.expand();
  });
    
  step('Push Source to Org', async () => {
    const workbench = await browser.getWorkbench();
    await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Push Source to Default Scratch Org', 5);
    await utilities.pause(1);
    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Push Source to Default Scratch Org successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);
  });
  
  step('Refresh SObject Definitions for Custom SObjects', async () => {
    // Type'Sfdx: Refresh SObject Definitions in the Command Pallette'
    const workbench = await browser.getWorkbench();
    const prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Refresh SObject Definitions', 2);
    // Select "Custom SObjects" from the Drop down menu .
    await prompt.setText('Custom SObjects');
    await prompt.selectQuickPick('Custom SObjects');
    await utilities.pause(1);
    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Refresh SObject Definitions successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', 'sObjects', 10);
    expect(outputPanelText).not.toBeUndefined();

    // Search for 'Processed xxx Custom sObjects'
    const matchedResults = outputPanelText?.match(/Processed [0-9]{1,} Custom sObjects/gm);
    expect(matchedResults).not.toBe(undefined);
    // @ts-ignore: Object is possibly 'null'
    expect(matchedResults.length).toBe(1);
    // @ts-ignore: Object is possibly 'null'
    const customObjectCount = parseInt(matchedResults[matchedResults.length - 1].match(/[0-9]{1,}/)[0]);
    expect(customObjectCount).toBe(2);

    const sidebar = workbench.getSideBar();
    const content = sidebar.getContent();
    const treeViewSection = await content.getSection(tempProjectName.toUpperCase());
    expect(treeViewSection).not.toEqual(undefined);
    // Verify if '.sfdx' folder is in side panel
    const sfdxTreeItem = await treeViewSection.findItem('.sfdx') as DefaultTreeItem;
    expect(sfdxTreeItem).not.toEqual(undefined);
    await sfdxTreeItem.expand();
    expect(await sfdxTreeItem.isExpanded()).toBe(true);
    await utilities.pause(1);
    // Verify if 'tools' folder is within '.sfdx'
    const toolsTreeItem = await sfdxTreeItem.findChildItem('tools') as TreeItem;
    expect(toolsTreeItem).not.toEqual(undefined);
    await toolsTreeItem.expand();
    expect(await toolsTreeItem.isExpanded()).toBe(true);
    await utilities.pause(1);
    // Verify if 'sobjects' folder is within 'tools'
    const sobjectsTreeItem = await toolsTreeItem.findChildItem('sobjects') as TreeItem;
    expect(sobjectsTreeItem).not.toEqual(undefined);
    await sobjectsTreeItem.expand();
    expect(await sobjectsTreeItem.isExpanded()).toBe(true);
    await utilities.pause(1);
    // Verify if 'customObjects' folder is within 'sobjects'
    const customObjectsTreeItem = await sobjectsTreeItem.findChildItem('customObjects') as TreeItem;
    await customObjectsTreeItem.expand();
    expect(await customObjectsTreeItem.isExpanded()).toBe(true);
    await utilities.pause(1);
    expect(await treeViewSection.findItem('Customer__c.cls')).not.toBe(undefined);
    expect(await treeViewSection.findItem('Product__c.cls')).not.toBe(undefined);
  });
  step('Refresh SObject Definitions for Standard SObjects', async () => {
    // Type'Sfdx: Refresh SObject Definitions in the Command Pallette'
    const workbench = await browser.getWorkbench();
    const prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Refresh SObject Definitions', 5);
    // Select "Standard SObjects" from the Drop down menu .
    await prompt.setText('Standard SObjects');
    await prompt.selectQuickPick('Standard SObjects');
    await utilities.pause(1);
    // Expectation: Look for notification with text 'Sfdx: Refresh SObject Definitions successfully ran'
    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Refresh SObject Definitions successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);
    // Search for 'Standard sObjects' to obtain the whole text in output panel'
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', 'sObjects', 10);
    expect(outputPanelText).not.toBeUndefined();
    // Search for 'Processed xxx Standard sObjects'
    const matchedResults = outputPanelText?.match(/Processed [0-9]{1,} Standard sObjects/gm);
    expect(matchedResults).not.toBe(undefined);
    // @ts-ignore: Object is possibly 'null'
    expect(matchedResults.length).toBeGreaterThanOrEqual(2)
    // @ts-ignore: Object is possibly 'null'
    const sObjectCount = parseInt(matchedResults[matchedResults.length - 1].match(/[0-9]{1,}/)[0]);
    expect(sObjectCount).toBeGreaterThan(100);
    expect(sObjectCount).toBeLessThan(500);

    const sidebar = workbench.getSideBar();
    const content = sidebar.getContent();
    const treeViewSection = await content.getSection(tempProjectName.toUpperCase());
    expect(treeViewSection).not.toEqual(undefined);
    // Verify if 'standardObjects' folder is in side panel
    const standardObjectsTreeItem = await treeViewSection.findItem('standardObjects') as DefaultTreeItem;
    expect(standardObjectsTreeItem).not.toEqual(undefined);
    await standardObjectsTreeItem.expand();
    expect(await standardObjectsTreeItem.isExpanded()).toBe(true);
    await utilities.pause(1);
    expect(await treeViewSection.findItem('Account.cls')).not.toBe(undefined);
    expect(await treeViewSection.findItem('AccountCleanInfo.cls')).not.toBe(undefined);
    expect(await treeViewSection.findItem('AcceptedEventRelation.cls')).not.toBe(undefined);
  });
  step('Refresh SObject Definitions for All SObjects', async () => {
    // Clear the output for correct test validation.
    const outputView = await utilities.openOutputView();
    outputView.clearText();
    // Type'Sfdx: Refresh SObject Definitions in the Command Pallette'
    const workbench = await browser.getWorkbench();
    const prompt = await utilities.runCommandFromCommandPrompt(workbench, 'SFDX: Refresh SObject Definitions', 5);
    // Select "All SObjects" from the Drop down menu .
    await prompt.setText('All SObjects');
    await prompt.selectQuickPick('All SObjects');
    await utilities.pause(1);
    // Expectation: Look for notification with text 'Sfdx: Refresh SObject Definitions successfully ran'
    const successNotificationWasFound = await utilities.attemptToFindNotification(workbench, 'SFDX: Refresh SObject Definitions successfully ran', 10);
    expect(successNotificationWasFound).toBe(true);
    // Search for 'Standard sObjects' to obtain the whole text in output panel'
    const outputPanelText = await utilities.attemptToFindOutputPanelText('Salesforce CLI', 'sObjects', 10);
    expect(outputPanelText).not.toBeUndefined();
    // Search for 'Processed xxx Standard sObjects'
    const matchedResults = outputPanelText?.match(/Processed [0-9]{1,} [A-Za-z]{1,} sObjects/gm);
    expect(matchedResults).not.toBe(undefined);
    // @ts-ignore: Object is possibly 'null'
    expect(matchedResults.length).toBeGreaterThanOrEqual(2)
    // @ts-ignore: Object is possibly 'null'
    const sObjectCount = parseInt(matchedResults[0].match(/[0-9]{1,}/)[0]);
    expect(sObjectCount).toBeGreaterThan(400);
    // @ts-ignore: Object is possibly 'null'
    const customObjectCount = parseInt(matchedResults[matchedResults.length - 1].match(/[0-9]{1,}/)[0]);
    expect(customObjectCount).toBe(2);
  });

  step('Tear down and clean up the testing environment', async () => {
    await scratchOrg.tearDown();
  });
});
