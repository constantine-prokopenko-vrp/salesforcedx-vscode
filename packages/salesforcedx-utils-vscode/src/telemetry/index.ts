/*
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { TelemetryService } from './telemetry';
export { TelemetryBuilder, TelemetryData, Properties, Measurements } from './telemetry';
export const telemetryService = TelemetryService.getInstance();
