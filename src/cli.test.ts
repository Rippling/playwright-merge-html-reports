import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

describe('CLI tests', () => {
  test('Should display help information', async () => {
    const { stdout } = await execAsync('npx merge-html-reports --help');
    expect(stdout).toContain('Usage:');
  });

  test('Should merge reports successfully', async () => {
    const { stdout } = await execAsync(
      `npx merge-html-reports --overwrite "${path.resolve(process.cwd(), "./html_report-1")}" "${path.resolve(process.cwd(), "./html_report-2")}"`
    );
    expect(stdout).toContain('Successfully merged');
  });

  test('Should throw an error for invalid input paths', async () => {
    try {
      await execAsync('npx merge-html-reports "non_existent_path"');
    } catch (error) {
      const typedError = error as { stderr: string };
      expect(typedError.stderr).toContain('No Input paths provided');
    }
  });

  test('Should generate report in specified output folder', async () => {
    const outputFolder = 'test-output';
    await execAsync(`npx merge-html-reports -o "${outputFolder}" "./html_report-1" "./html_report-2"`);
    const outputPath = path.join(process.cwd(), outputFolder);
    try {
      await fs.access(outputPath);
    } catch {
      fail(`Output folder "${outputPath}" should exist but it does not.`);
    }
    await fs.rm(outputPath, { recursive: true, force: true });
  });

  test('Should generate report in default output folder when not specified', async () => {
    const defaultOutputFolder = 'merged-html-report';
    await execAsync(`npx merge-html-reports "./html_report-1" "./html_report-2"`);
    const outputPath = path.join(process.cwd(), defaultOutputFolder);
    try {
      await fs.access(outputPath);
    } catch {
      fail(`Default output folder "${outputPath}" should exist but it does not.`);
    }
    await fs.rm(outputPath, { recursive: true, force: true });
  });

  test('Should overwrite existing report when --overwrite option is provided', async () => {
    const outputFolder = 'test-output';
    await execAsync(`npx merge-html-reports -o "${outputFolder}" "./html_report-1" "./html_report-2"`);

    const outputPath = path.join(process.cwd(), outputFolder);
    const initialReport = await fs.readFile(path.join(outputPath, 'index.html'), 'utf-8');

    await execAsync(`npx merge-html-reports --overwrite -o "${outputFolder}" "./html_report-2" "./html_report-4"`);
    const updatedReport = await fs.readFile(path.join(outputPath, 'index.html'), 'utf-8');

    expect(initialReport).not.toEqual(updatedReport);
    await fs.rmdir(outputPath, { recursive: true });
  });

  test('Should not overwrite existing report when --overwrite option is not provided', async () => {
    const outputFolder = 'test-output';
    await execAsync(`npx merge-html-reports -o "${outputFolder}" "./html_report-1" "./html_report-2"`);

    const outputPath = path.join(process.cwd(), outputFolder);
    const initialReport = await fs.readFile(path.join(outputPath, 'index.html'), 'utf-8');

    try {
      await execAsync(`npx merge-html-reports -o "${outputFolder}" "./html_report-2" "./html_report-4"`);
    } catch (error) {
      const typedError = error as { stderr: string };
      expect(typedError.stderr).toContain('Output directory already exists');
    }

    const updatedReport = await fs.readFile(path.join(outputPath, 'index.html'), 'utf-8');
    expect(initialReport).toEqual(updatedReport);
    await fs.rmdir(outputPath, { recursive: true });
  });

});
