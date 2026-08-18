/*
 * Wire
 * Copyright (C) 2026 Wire Swiss GmbH
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

import * as electronBuilder from 'electron-builder';
import fs from 'fs-extra';

import path from 'path';

import {getCommonConfig} from './commonConfig';
import {WindowsMsiConfig} from './Config';

import {backupFiles, getLogger, restoreFiles} from '../../bin-utils';

const libraryName = path.basename(__filename).replace('.ts', '');
const logger = getLogger('build-tools', libraryName);
const mainDir = path.resolve(__dirname, '../../../');

const DEFAULT_MSI_IDENTITIES = {
  internal: {productName: 'WireInternal', upgradeCode: '673C5C7F-2923-483B-8EDB-34EDBDFCFF8A'},
  production: {productName: 'Wire', upgradeCode: '620FCDDD-30CB-4241-A347-D34CF682A358'},
  'wire-gov': {productName: 'WireGov', upgradeCode: '0FC26EF0-E415-4263-9C73-89D05BCD4E1A'},
} as const;

interface WindowsMsiConfigResult {
  builderConfig: electronBuilder.Configuration;
  windowsMsiConfig: WindowsMsiConfig;
}

function escapeXmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function validateUpgradeCode(upgradeCode: string): string {
  const normalized = upgradeCode.replace(/^\{(.+)\}$/, '$1').toUpperCase();
  if (!/^[0-9A-F]{8}-[0-9A-F]{4}-[1-5][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/.test(normalized)) {
    throw new Error(`Invalid Windows MSI upgrade code "${upgradeCode}".`);
  }
  return normalized;
}

// electron-builder's MSI target owns the shortcuts, files and upgrade lifecycle. This small WiX customization makes
// the URL protocol MSI-owned as well and gives the desktop shortcut the same AUMID as the Start Menu shortcut.
export function customizeMsiProject(
  project: string,
  customProtocolName: string,
  appId: string,
  productName: string,
  bannerFileName: string,
): string {
  if (!/^[a-z][a-z0-9+.-]*$/i.test(customProtocolName)) {
    throw new Error(`Invalid custom protocol name "${customProtocolName}".`);
  }

  const mainExecutablePosition = project.indexOf('Id="mainExecutable"');
  if (mainExecutablePosition < 0) {
    throw new Error('Could not find the main executable in the generated MSI project.');
  }

  const componentEndPosition = project.indexOf('</Component>', mainExecutablePosition);
  if (componentEndPosition < 0) {
    throw new Error('Could not find the main executable component in the generated MSI project.');
  }

  const protocol = escapeXmlAttribute(customProtocolName);
  const description = escapeXmlAttribute(`${productName} URL`);
  const protocolRegistry = [
    `        <RegistryKey Root="HKLM" Key="Software\\Classes\\${protocol}">`,
    `          <RegistryValue Type="string" Value="URL:${description}"/>`,
    '          <RegistryValue Name="URL Protocol" Type="string" Value=""/>',
    '          <RegistryKey Key="DefaultIcon">',
    '            <RegistryValue Type="string" Value="&quot;[#mainExecutable]&quot;,0"/>',
    '          </RegistryKey>',
    '          <RegistryKey Key="shell\\open\\command">',
    '            <RegistryValue Type="string" Value="&quot;[#mainExecutable]&quot; &quot;%1&quot;"/>',
    '          </RegistryKey>',
    '        </RegistryKey>',
    '      ',
  ].join('\n');

  let customizedProject =
    project.slice(0, componentEndPosition) + protocolRegistry + project.slice(componentEndPosition);

  const productOpeningTag = /<Product(?:\s[^>]*)?>/;
  if (!productOpeningTag.test(customizedProject)) {
    throw new Error('Could not find the product in the generated MSI project.');
  }
  const banner = escapeXmlAttribute(bannerFileName);
  customizedProject = customizedProject.replace(
    productOpeningTag,
    `$&\n    <WixVariable Id="WixUIBannerBmp" Value="${banner}"/>`,
  );

  const escapedAppId = escapeXmlAttribute(appId);
  const desktopShortcutPattern = /(<Shortcut Id="desktopShortcut"[^>]*?)\/>/;
  if (!desktopShortcutPattern.test(customizedProject)) {
    throw new Error('Could not find the desktop shortcut in the generated MSI project.');
  }
  customizedProject = customizedProject.replace(
    desktopShortcutPattern,
    `$1>\n            <ShortcutProperty Key="System.AppUserModel.ID" Value="${escapedAppId}"/>\n          </Shortcut>`,
  );

  return customizedProject;
}

export async function buildWindowsMsiConfig(
  wireJsonPath: string = path.join(mainDir, 'electron/wire.json'),
  envFilePath: string = path.join(mainDir, '.env.defaults'),
  manualSign?: boolean,
): Promise<WindowsMsiConfigResult> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);

  const appId = `com.squirrel.wire.${commonConfig.name.toLowerCase()}`;
  const defaultIdentity = DEFAULT_MSI_IDENTITIES[commonConfig.environment];
  if (!process.env.WIN_MSI_UPGRADE_CODE && commonConfig.name !== defaultIdentity.productName) {
    throw new Error(`Custom Windows product "${commonConfig.name}" must define a permanent WIN_MSI_UPGRADE_CODE.`);
  }
  const configuredUpgradeCode = process.env.WIN_MSI_UPGRADE_CODE || defaultIdentity.upgradeCode;
  const upgradeCode = validateUpgradeCode(configuredUpgradeCode);

  const windowsMsiConfig: WindowsMsiConfig = {
    appId,
    artifactName: '${productName}-${version}-${arch}.${ext}',
    upgradeCode,
  };

  const builderConfig: electronBuilder.Configuration = {
    appId: windowsMsiConfig.appId,
    buildVersion: commonConfig.version.replace(/-.*$/, ''),
    copyright: commonConfig.copyright,
    directories: {
      buildResources: commonConfig.electronDirectory,
      output: commonConfig.distDir,
    },
    msi: {
      artifactName: windowsMsiConfig.artifactName,
      createDesktopShortcut: true,
      createStartMenuShortcut: true,
      oneClick: false,
      perMachine: true,
      runAfterFinish: false,
      shortcutName: commonConfig.name,
      upgradeCode: windowsMsiConfig.upgradeCode,
      warningsAsErrors: true,
    },
    msiProjectCreated: async projectFile => {
      const bannerSource = path.join(mainDir, 'bin/build-tools/assets/msi-banner.bmp');
      const bannerFileName = path.basename(bannerSource);
      await fs.copy(bannerSource, path.join(path.dirname(projectFile), bannerFileName));
      const project = await fs.readFile(projectFile, 'utf8');
      const customizedProject = customizeMsiProject(
        project,
        commonConfig.customProtocolName,
        windowsMsiConfig.appId,
        commonConfig.name,
        bannerFileName,
      );
      await fs.writeFile(projectFile, customizedProject);
    },
    productName: commonConfig.name,
    publish: null,
    win: {
      executableName: commonConfig.name,
      icon: `${commonConfig.electronDirectory}/img/logo.ico`,
      // Production signing is performed explicitly by Jenkins using the managed signing service.
      signtoolOptions: manualSign ? {sign: async () => undefined} : undefined,
      target: ['msi'],
    },
  };

  return {builderConfig, windowsMsiConfig};
}

export async function buildWindowsMsi(
  builderConfig: electronBuilder.Configuration,
  packageJsonPath: string,
  wireJsonPath: string,
  envFilePath: string,
  architecture: electronBuilder.Arch = electronBuilder.Arch.x64,
): Promise<void> {
  const wireJsonResolved = path.resolve(wireJsonPath);
  const packageJsonResolved = path.resolve(packageJsonPath);
  const envFileResolved = path.resolve(envFilePath);
  const {commonConfig} = await getCommonConfig(envFileResolved, wireJsonResolved);
  const architectureName = electronBuilder.Arch[architecture];
  const appDirectory = path.resolve(`${commonConfig.buildDir}/${commonConfig.name}-win32-${architectureName}`);
  const targets = electronBuilder.Platform.WINDOWS.createTarget(['msi'], architecture);

  logger.info(`Building ${commonConfig.name} ${commonConfig.version} MSI for Windows ...`);

  if (!(await fs.pathExists(path.join(appDirectory, `${commonConfig.name}.exe`)))) {
    throw new Error(`Packaged Windows application not found in "${appDirectory}". Run the Windows build first.`);
  }

  const backup = await backupFiles([packageJsonResolved, wireJsonResolved]);
  const packageJsonContent = await fs.readJson(packageJsonResolved);

  try {
    await fs.writeJson(
      packageJsonResolved,
      {...packageJsonContent, productName: commonConfig.name, version: commonConfig.version.replace(/-.*$/, '')},
      {spaces: 2},
    );
    await fs.writeJson(wireJsonResolved, commonConfig, {spaces: 2});

    const builtPackages = await electronBuilder.build({config: builderConfig, prepackaged: appDirectory, targets});
    builtPackages.forEach(builtPackage => logger.log(`Built MSI package "${builtPackage}".`));
  } finally {
    await restoreFiles(backup);
  }
}
