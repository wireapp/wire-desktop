#!/usr/bin/env node
/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */

// @ts-check

const {default: Crowdin} = require('crowdin-client');
const fs = require('fs-extra');
const path = require('path');
const JSZip = require('jszip');
const os = require('os');
const program = require('commander');

const CROWDIN_PROJECT = 'wire-cs';
const DEFAULT_LOCALE_SOURCE = path.join(__dirname, 'electron', 'src', 'locale');
const DEFAULT_LOCALE_STRINGS = path.join(__dirname, 'electron', 'src', 'locale', 'strings.ts');
const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'wd-'));
const TEMP_ZIP_FILE = path.join(TEMP_DIR, 'translations.zip');
const NO_API_KEY_ERROR_MESSAGE =
  '\n  error: No API key set. Please set the API key with --api-key or as global variable `CROWDIN_API_KEY`.\n';
const utf8EncodingFlag = {encoding: 'utf-8'};

const SUPPORTED_LOCALE = [
  'cs',
  'da',
  'de',
  'el',
  'es',
  'et',
  'fi',
  'fr',
  'hr',
  'hu',
  'it',
  'lt',
  'nl',
  'pl',
  'pt',
  'ro',
  'ru',
  'sk',
  'sl',
  'tr',
  'uk',
];

/**
 * @param {string} filesDir
 * @returns {Promise<void>}
 */
const createEnglishFile = async filesDir => {
  const sourceFile = path.join(filesDir, 'strings.ts');
  const englishFile = sourceFile.replace('.ts', '-en.ts');

  console.log(`Creating file "strings-en.ts" ...`);
  await fs.copy(sourceFile, englishFile);

  const content = await fs.readFile(englishFile, utf8EncodingFlag);
  const unformattedContent = formatText(content, true);
  const formattedContent = formatText(unformattedContent);
  await fs.writeFile(englishFile, formattedContent, utf8EncodingFlag);
};

/**
 * @param {string} text
 * @param {boolean} [isTS]
 * @returns {string}
 */
const formatText = (text, isTS) => {
  const headline = "import {Supportedi18nStrings} from '../interfaces/';\n\n";
  const identifier = 'const strings: Supportedi18nStrings = {\n';
  const bottomline = '};\n\nexport {strings};\n';

  if (isTS) {
    const stringsRegex = new RegExp("^\\s*([^:]+):\\s('[^']+'),$", 'gm');
    return text
      .replace('const strings = {\n', '')
      .replace(new RegExp(`${bottomline}\n?`), '')
      .replace(stringsRegex, 'string.$1=$2;');
  }
  const stringsRegex = new RegExp("^string\\.([^=]+)=('[^']+');$", 'gm');

  let strings = text.match(stringsRegex);

  if (strings === null || !strings.length) {
    return null;
  }

  strings = strings.sort();

  const replacedStrings = strings.reduce((accumulator, string) => {
    const replacedString = string.replace(stringsRegex, '$1: $2,');
    return `${accumulator}  ${replacedString}\n`;
  }, '');

  return `${headline}${identifier}${replacedStrings}${bottomline}`;
};

/**
 * @param {string} zipFilePath
 * @param {string} outputDir
 * @returns {Promise<void>}
 */
const unzipFiles = async (zipFilePath, outputDir) => {
  console.log(`Reading ZIP file "${zipFilePath}" ...`);
  const zip = new JSZip();
  const zipFile = await fs.readFile(zipFilePath);
  const entries = [];

  const zipData = await zip.loadAsync(zipFile);

  const localeRegex = new RegExp(`electron${path.sep}.*${path.sep}strings-([a-z]{2}).js$`);

  zipData.forEach((filePath, entry) => {
    const localeMatch = filePath.match(localeRegex);
    if (localeMatch && SUPPORTED_LOCALE.includes(localeMatch[1])) {
      entries.push([filePath, entry]);
    }
  });

  console.log(`Found "${entries.length}" files in ZIP file.`);

  const entryPromises = entries.map(async ([filePath, entry]) => {
    if (entry.name.startsWith('electron') && !entry.dir) {
      console.log(`Extracting file ${filePath} ...`);

      const resolvedFilePath = path
        .join(outputDir, filePath)
        .replace(`electron${path.sep}locale${path.sep}`, '')
        .replace('.js', '.ts');

      const content = await entry.async('text');

      const formattedContent = formatText(content);

      await fs.writeFile(resolvedFilePath, formattedContent, utf8EncodingFlag);
    }
  });

  await Promise.all(entryPromises);
};

/**
 * @param {string} apiKey
 * @param {string} outputDir
 */
const downloadAndFormat = async (apiKey, outputDir) => {
  const resolvedOutputDir = path.resolve(outputDir);
  await fs.ensureDir(resolvedOutputDir);

  const crowdin = new Crowdin({key: apiKey, project: CROWDIN_PROJECT});

  console.log(`Downloading translation files from crowdin to "${TEMP_ZIP_FILE}" ...`);

  try {
    const buffer = await crowdin.downloadTranslations();
    await fs.writeFile(TEMP_ZIP_FILE, buffer);
    await unzipFiles(TEMP_ZIP_FILE, resolvedOutputDir);
    await createEnglishFile(resolvedOutputDir);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  console.log('All done!');
  process.exit();
};

const formatAndUpload = async (apiKey, filePath) => {
  const resolvedPath = path.resolve(filePath);

  try {
    await fs.access(resolvedPath, fs.constants.F_OK | fs.constants.R_OK);
  } catch (error) {
    console.error(`\n  error: The specified file "${filePath}" does not exist.`);
    process.exit(1);
  }

  const crowdin = new Crowdin({key: apiKey, project: CROWDIN_PROJECT});
  const text = await fs.readFile(resolvedPath, utf8EncodingFlag);

  const formattedText = formatText(text, true);

  console.log(`Uploading "${resolvedPath}" to Crowdin ...`);

  try {
    await crowdin.uploadFile(formattedText);
    console.log('All done!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

program
  .name('Crowdin CLI')
  .description('Sync your translation files with Crowdin.')
  .option('-k, --api-key [key]', 'Set the Crowdin API key (also available as global variable `CROWDIN_API_KEY`)')
  .on('command:*', args => {
    console.error(`\n  error: invalid command \`${args[0]}'\n`);
    process.exit(1);
  });

program
  .command('download')
  .alias('d')
  .description('Download translation files from Crowdin')
  .option('-k, --api-key [key]', 'Set the Crowdin API key (also available as global variable `CROWDIN_API_KEY)')
  .option('-f, --files [dir]', 'Set the dir for locale files', DEFAULT_LOCALE_SOURCE)
  .action(command => {
    const apiKey = command.parent.apiKey || process.env.CROWDIN_API_KEY;
    const downloadDir = command.files;
    console.log({apiKey, downloadDir});

    if (!apiKey) {
      console.error(NO_API_KEY_ERROR_MESSAGE);
      process.exit(1);
    }

    downloadAndFormat(apiKey, downloadDir);
  });

program
  .command('upload')
  .alias('u')
  .description('Upload translation files to Crowdin')
  .option('-k, --api-key [key]', 'Set the Crowdin API key (also available as global variable `CROWDIN_API_KEY)')
  .option('-f, --file [dir]', 'Set the locale TS source file', DEFAULT_LOCALE_STRINGS)
  .action(command => {
    const apiKey = command.parent['api-key'] || process.env.CROWDIN_API_KEY;
    const filePath = command.file;
    console.log({apiKey, filePath});

    if (!apiKey) {
      console.error(NO_API_KEY_ERROR_MESSAGE);
      process.exit(1);
    }

    formatAndUpload(apiKey, filePath);
  });

program.parse(process.argv);

if (!program.args.length) {
  program.outputHelp();
  process.exit(1);
}
