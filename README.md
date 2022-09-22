# Merge Playwright HTML reports

- Merge Playwright HTML reports to a single HTML report
- The `index.html` file is generated and other artifacts (screenshot, trace file etc) are copied from the source folders to the merged Report folder
- Built on `node 14.18.1`.
- Note: `@playwright/test` is a peer dependency, not a dev dependency.

- Inspiration https://github.com/microsoft/playwright/issues/10437

## Usage

```bash
npm install playwright-merge-html-reports --dev
```

- You will need to install `@playwright/test` package first (if not already done). 
- In your Node.js script 
```js 
const { mergeHTMLReports } = require("playwright-merge-html-reports");
```
### Arguments
1. `inputReportPaths` - Array of path to html report folders
```js
mergeHTMLReports([
  process.cwd() + "/html_report-1",
  process.cwd() + "/html_report-2"
])
```
2. `config` - Optional
```js

const inputReportPaths = [
  process.cwd() + "/html_report-1",
  process.cwd() + "/html_report-2"
];

const config = {
  outputFolderName: "merged-html-report", // default value
  outputBasePath: process.cwd() // default value
}

mergeHTMLReports(inputReportPaths, config)
```

## Spec
- TS support
- Uses `jszip` and `yazl` for encoding and decoding zipped content from the `index.html` file.

## Upcoming features

- Usage directly on Command line
