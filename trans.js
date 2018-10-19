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
const unzip = require('unzip');
const os = require('os');

const API_KEY = process.argv[2] || process.env.CROWDIN_API_KEY;
//const LOCALE_DIST = path.join(__dirname, 'electron', 'dist', 'locale');
const LOCALE_SOURCE = path.join(__dirname, 'electron', 'src', 'locale');
const TEMP_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'wd-'));
const ZIP_FILE = path.join(TEMP_DIR, 'translations.zip');

if (!API_KEY) {
  console.error(
    'Error: No API key set. Please set the API key as second argument or as global variable `CROWDIN_API_KEY`.'
  );
  process.exit(1);
}

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

const replaceInFiles = async () => {
  console.log('Converting files ...');

  const files = await fs.readdir(LOCALE_SOURCE);
  const stringFiles = files.filter(fileName => fileName.startsWith('strings-'));

  for (const fileName of stringFiles) {
    const resolvedPath = path.join(LOCALE_SOURCE, fileName);
    const locale = fileName.replace(/strings-([a-z]{2}).ts$/, '$1');

    if (!locale || !SUPPORTED_LOCALE.includes(locale)) {
      await fs.remove(resolvedPath);
      continue;
    }

    const content = await fs.readFile(resolvedPath, {encoding: 'utf-8'});
    const replacedContent = replaceText(content);

    if (replacedContent === null) {
      await fs.remove(resolvedPath);
    } else {
      await fs.writeFile(resolvedPath, replacedContent, {encoding: 'utf-8'});
    }
  }
};

const replaceText = text => {
  const regex = new RegExp("^string\\.([^=]+)=('[^']+');", 'gm');
  let strings = text.match(regex);
  if (strings === null || !strings.length) {
    return null;
  }
  strings = strings.sort();

  const headline = "import {Supportedi18nStrings} from '../interfaces/';\n\n";
  const identifier = 'const strings: Supportedi18nStrings = {\n';
  const bottomline = '};\n\nexport {strings};\n';

  const replacedStrings = strings.reduce((accumulator, string) => {
    const replacedString = string.replace(regex, '$1: $2,');
    return `${accumulator}  ${replacedString}\n`;
  }, '');

  return `${headline}${identifier}${replacedStrings}${bottomline}`;
};

const unzipFiles = () => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(ZIP_FILE)
      .pipe(unzip.Parse())
      .on('entry', entry => {
        const {path: entryPath, type: entryType} = entry;
        const resolvedPath = path
          .join(entryPath)
          .replace('electron/locale', 'electron/src/locale')
          .replace('.js', '.ts');
        if (!entry.path.startsWith('electron')) {
          entry.autodrain();
        } else if (entryType === 'Directory') {
          fs.ensureDirSync(resolvedPath);
        } else {
          console.log(`Extracting file ${resolvedPath} ...`);
          entry.pipe(
            fs.createWriteStream(resolvedPath, {
              encoding: 'utf-8',
            })
          );
        }
      })
      .on('error', error => reject(error))
      .on('finish', () => resolve());
  });
};

const crowdin = new Crowdin({key: API_KEY, project: 'wire-cs'});

console.log(`Downloading translation files from crowdin to "${ZIP_FILE}" ...`);

crowdin
  .downloadTranslations()
  .then(buffer => fs.writeFile(ZIP_FILE, buffer))
  .then(() => unzipFiles())
  .then(() => replaceInFiles())
  .catch(err => {
    console.log(err);
    process.exit(1);
  })
  .then(() => {
    console.log('All done!');
    process.exit();
  });
