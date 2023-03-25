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

import { createWriteStream, existsSync } from "fs";
import { mkdir, readFile, readdir, copyFile, appendFile, writeFile, rm, stat } from "fs/promises";
import path from "path";
import JSZip from "jszip";
import yazl from "yazl";
import Base64Encoder from "./Base64Encoder";
import type { HTMLReport, Config, ZipDataFile, Stats, FileReport } from "./types";

const defaultConfig: Required<Config> = {
  outputFolderName: "merged-html-report",
  outputBasePath: process.cwd(),
  overwriteExisting: true,
  debug: false,
}

const re = /<script>\nwindow\.playwrightReportBase64\s=\s"data:application\/zip;base64,(.+)<\/script>/

async function mergeHTMLReports(inputReportPaths: string[], givenConfig: Config = {}) {
  if(!Array.isArray(inputReportPaths) || inputReportPaths.length < 1) {
    console.log("No Input paths provided")
    process.exit(1);
  }

  // Merge config with default values
  const { outputFolderName, outputBasePath, overwriteExisting, debug } = {...defaultConfig, ...givenConfig};
  const outputPath = path.resolve(outputBasePath, `./${outputFolderName}`);

  if (existsSync(outputPath)) {
    if (overwriteExisting) {
      if (debug) {
        console.log('Cleaning output directory');
      }
      await rm(outputPath, { recursive: true, force: true })
    } else {
      throw new Error(`Report merge aborted. Output directory already exists and overwriteExisting set to false.\n
    path: ${outputPath}\n`)
    }
  } else {
    await mkdir(outputPath, { recursive: true });
  }

  let mergedZipContent = new yazl.ZipFile();
  let aggregateReportJson: HTMLReport | null = null;
  let baseIndexHtml = '';
  const fileReportMap = new Map<string, FileReport>();

  for (let reportDir of inputReportPaths) {
    console.log(`Processing "${reportDir}"`)
    const indexHTMLContent = await readFile(reportDir + "/index.html", "utf8");
    const [, base64Str] = re.exec(indexHTMLContent) ?? [];

    if (!base64Str) throw new Error('index.html does not contain report data');

    if (!baseIndexHtml) {
      baseIndexHtml = indexHTMLContent.replace(re, '');
    }

    const zipData = Buffer.from(base64Str, "base64").toString("binary");
    const zipFile = await JSZip.loadAsync(zipData);
    const zipDataFiles: ZipDataFile[] = [];

    zipFile.forEach((relativePath, file) => {
      zipDataFiles.push({ relativePath, file });
    })

    await Promise.all(zipDataFiles.map(async ({ relativePath, file }) => {
      const fileContentString = await file.async("string");
      if (relativePath !== "report.json") {
        const fileReportJson = JSON.parse(fileContentString) as FileReport;

        if (fileReportMap.has(relativePath)) {
          if (debug) {
            console.log('Merging duplicate file report: ' + relativePath);
          }

          const existingReport = fileReportMap.get(relativePath);

          if (existingReport?.fileId !== fileReportJson.fileId) throw new Error('Error: collision with file ids in two file reports')

          existingReport.tests.push(...fileReportJson.tests);
        } else {
          fileReportMap.set(relativePath, fileReportJson);
        }

      } else {
        const currentReportJson = JSON.parse(fileContentString);
        if (debug) {
          console.log('---------- report.json ----------');
          console.log(JSON.stringify(currentReportJson, null, 2));
        }
        if (!aggregateReportJson) aggregateReportJson = currentReportJson;
        else {
          currentReportJson.files.forEach((file) => {
            const existingGroup = aggregateReportJson?.files.find(({ fileId }) => fileId === file.fileId);

            if (existingGroup) {
              existingGroup.tests.push(...file.tests);
              mergeStats(existingGroup.stats, file.stats);
            } else {
              aggregateReportJson?.files.push(file);
            }
          })

         mergeStats(aggregateReportJson.stats, currentReportJson.stats);

         aggregateReportJson.projectNames = [
           ...new Set([
             ...aggregateReportJson.projectNames,
             ...currentReportJson.projectNames
           ])
         ];
        }
      }
    }));

    const contentFolderName = "data";
    const contentFolderPath = path.join(reportDir, contentFolderName);
    const contentOuputPath = path.join(outputPath, contentFolderName);

    if (existsSync(contentFolderPath)) {
      await copyDir(contentFolderPath, contentOuputPath, debug);
    }

    const traceFolderName = "trace";
    const traceFolderPath = path.join(reportDir, traceFolderName);
    const traceOuputPath = path.join(outputPath, traceFolderName);

    // only need to copy trace applicate dir once if needed
    if (existsSync(traceFolderPath) && !existsSync(traceOuputPath)) {
      await copyDir(traceFolderPath, traceOuputPath, debug);
    }

    if (debug) {
      console.log({
        reportDir
      });
    }
  }

  if (!baseIndexHtml) throw new Error('Base report index.html not found');

  fileReportMap.forEach((fileReport, relativePath) => {
     mergedZipContent.addBuffer(
       Buffer.from(JSON.stringify(fileReport)),
       relativePath,
     );
   })

  mergedZipContent.addBuffer(
    Buffer.from(JSON.stringify(aggregateReportJson)),
    "report.json"
  );

  if (debug) {
    console.log('---------- aggregateReportJson ----------');
    console.log(JSON.stringify(aggregateReportJson, null, 2));
  }

  const indexFilePath = path.join(outputPath, "index.html");
  await writeFile(indexFilePath, baseIndexHtml + `<script>
window.playwrightReportBase64 = "data:application/zip;base64,`)

  await new Promise((f) => {
    mergedZipContent.end(undefined, () => {
      mergedZipContent.outputStream
        .pipe(new Base64Encoder())
        .pipe(createWriteStream(indexFilePath, { flags: "a" }))
        .on("close", f);
    });
  });

  await appendFile(indexFilePath, '";</script>');
  console.log(`Successfully merged ${inputReportPaths.length} report${inputReportPaths.length === 1 ? '' : 's'}`);
}

export {
  mergeHTMLReports
}

function mergeStats(base: Stats, added: Stats) {
  base.total += added.total;
  base.expected += added.expected;
  base.unexpected += added.unexpected;
  base.flaky += added.flaky;
  base.skipped += added.skipped;
  base.duration += added.duration;
  base.ok = base.ok && added.ok;
}

async function copyDir(srcDirPath: string, srcDirOutputPath: string, debug: boolean) {
  await mkdir(srcDirOutputPath, { recursive: true });
      const traceFiles = await readdir(srcDirPath);
      await Promise.all(
        traceFiles.map(async (fileName) => {
          const srcPath = path.resolve(
            process.cwd(),
            path.join(srcDirPath,fileName)
          );
          const destPath = path.join(srcDirOutputPath, fileName);
          if (debug) {
            console.log({
              srcPath,
              destPath
            });
          }
          
          const fileStats = await stat(srcPath);
          if(fileStats.isDirectory()){
            return copyDir(srcPath, destPath, debug);
          }

          await copyFile(srcPath, destPath);
          if (debug) {
            console.log(fileName);
          }
        })
      );
}
