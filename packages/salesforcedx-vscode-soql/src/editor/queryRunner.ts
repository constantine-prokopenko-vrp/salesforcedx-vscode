/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Connection } from '@salesforce/core';
import { JsonMap } from '@salesforce/ts-types';
import { QueryResult } from 'jsforce';
import * as vscode from 'vscode';

export class QueryRunner {
  constructor(private connection: Connection) {}

  public async runQuery(
    queryText: string,
    options = { showErrors: true }
  ): Promise<QueryResult<JsonMap>> {
    try {
      const rawQueryData = (await this.connection.query(
        queryText
      )) as QueryResult<JsonMap>;
      const cleanQueryData = {
        ...rawQueryData,
        records: this.flattenQueryRecords(rawQueryData.records)
      };
      return cleanQueryData;
    } catch (error) {
      // TODO: i18n
      if (options.showErrors) {
        vscode.window.showErrorMessage(`${error.message}`);
      }
      throw error;
    }
  }
  /*
  As query complexity grows
  we will need to flatten the results of nested values
  in order to be parsed and diplayed correctly
  */
  private flattenQueryRecords(rawQueryRecords: JsonMap[]) {
    // filter out the attributes key
    return rawQueryRecords.map(
      ({ attributes, ...cleanRecords }) => cleanRecords
    );
  }
}
