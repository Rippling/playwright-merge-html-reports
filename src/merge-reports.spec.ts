/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Anoop Raveendran
 */

import path from "path";

import { mergeHTMLReports } from "./merge-reports";

mergeHTMLReports([
  path.resolve(process.cwd(), "./html_report-1"),
  path.resolve(process.cwd(), "./html_report-2")
]);

mergeHTMLReports([
  path.resolve(process.cwd(), "./html_report-4"),
  path.resolve(process.cwd(), "./html_report-5")
], { outputFolderName: './test-merge-report' });
