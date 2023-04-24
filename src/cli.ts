#!/usr/bin/env node

import { mergeHTMLReports } from "./merge-reports";
import { Config } from "./types";
import { Command } from "commander";
import { LIB_VERSION } from './version';

const program = new Command();

program
  .version(LIB_VERSION)
  .description('CLI wrapper for merging HTML reports')
  .option('-o, --output <outputFolderName>', 'Output folder name', 'merged-html-report')
  .option('-b, --basePath <outputBasePath>', 'Output base path', process.cwd())
  .option('--overwrite', 'Overwrite existing reports', false)
  .option('--debug', 'Print debug information', false)
  .argument('<inputReportPaths...>', 'Input report paths')
  .action(async (inputReportPaths: string[], options) => {
    const config: Config = {
      outputFolderName: options.output,
      outputBasePath: options.basePath,
      overwriteExisting: options.overwrite,
      debug: options.debug,
    };

    try {
      await mergeHTMLReports(inputReportPaths, config);
      console.log('Reports merged successfully');
    } catch (error) {
      console.error('Error merging reports:', error);
    }
  });

program.parse(process.argv);
