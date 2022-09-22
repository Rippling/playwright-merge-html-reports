/**
 * Copyright (c) Microsoft Corporation.
 * Additions and modifications by Anoop Raveendran <https://github.com/anooprav7>
 * https://github.com/microsoft/playwright/blob/main/packages/playwright-test/src/reporters/html.ts
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { JSZipObject } from "jszip";

export type Location = {
  file: string;
  line: number;
  column: number;
};

export type TestFileSummary = {
  fileId: string;
  fileName: string;
  tests: TestCaseSummary[];
  stats: Stats;
};

export type TestCaseSummary = {
  testId: string,
  title: string;
  path: string[];
  projectName: string;
  location: Location;
  annotations: { type: string, description?: string }[];
  outcome: 'skipped' | 'expected' | 'unexpected' | 'flaky';
  duration: number;
  ok: boolean;
};
export type Stats = {
  total: number;
  expected: number;
  unexpected: number;
  flaky: number;
  skipped: number;
  ok: boolean;
  duration: number;
};

export type HTMLReport = {
  files: TestFileSummary[];
  stats: Stats;
  projectNames: string[];
};

export type Config = {
  outputFolderName?: string,
  outputBasePath?: string
  overwriteExisting?: boolean
  debug?: boolean,
}

export type ZipDataFile = {
  relativePath: string;
  file: JSZipObject,
}

export interface FileReport {
  fileId: string;
  fileName: string;
  tests: TestsEntity[];
}

export interface TestsEntity {
  testId: string;
  title: string;
  projectName: string;
  location: Location;
  duration: number;
  annotations?: unknown[];
  outcome: string;
  path?: string[];
  results?: ResultsEntity[];
  ok: boolean;
}

export interface ResultsEntity {
  duration: number;
  startTime: string;
  retry: number;
  steps?: Step[];
  errors?: string[];
  status: string;
  attachments?: AttachmentsEntity[];
}

export interface Step {
  title: string;
  startTime: string;
  duration: number;
  steps?: Step[];
  count: number;
  snippet?: string;
  location?: Location;
  error?: string;
}

export interface AttachmentsEntity {
  name: string;
  contentType: string;
  path: string;
}
