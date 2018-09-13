#!/usr/bin/env python
# coding: utf-8

#
# Wire
# Copyright (C) 2018 Wire Swiss GmbH
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see http://www.gnu.org/licenses/.
#

import json
import os
import requests
import subprocess

GITHUB_ACCESS_TOKEN = os.environ.get('GITHUB_ACCESS_TOKEN')
JOB_NAME = os.environ.get('JOB_NAME')
VERSION = os.environ.get('WRAPPER_BUILD').split('#')[1]

GITHUB_DRAFT_URL = 'https://api.github.com/repos/wireapp/wire-desktop/releases?access_token={ACCESS_TOKEN}'.format(GITHUB_ACCESS_TOKEN)

if __name__ == '__main__':
    # Get platform
    if 'Linux' in JOB_NAME:
        PLATFORM = 'Linux'
    elif 'macOS' in JOB_NAME:
        PLATFORM = 'macOS'
    elif 'Windows' in JOB_NAME:
        PLATFORM = 'Windows'

    print 'Createing a GitHub draft release draft for Wire for {PLATFORM} ({VERSION})...'.format(PLATFORM=PLATFORM, VERSION=VERSION)

    # Get last commit hash
    commitish = subprocess.check_output(['git', 'rev-parse', 'HEAD']).rstrip()

    description = """
        ### Release Notes
        <details open>
        <summary><b>Features</b></summary>
        <li>... (#1234)</li>
        </details>
        <br>

        <details open>
        <summary><b>Improvements</b></summary>
        <li>... (#1234)</li>
        </details>
        <br>

        <details>
        <summary><b>Fixes</b></summary>
        <li>... (#1234)</li>
        </details>
        <br>

        <details>
        <summary><b>Chores</b></summary>
        <li>... (#1234)</li>
        </details>

        ### Version

        Electron x.x.x
        Chrome xx.0.xxxx.x

        ### Public Release Date

        {PLATFORM} 2018-xx-xx

        ### Changelog

        [{PLATFORM}](https://github.com/wireapp/wire-desktop/compare/release%2F3.x.xxxx...release%2F{VERSION}
    """.format(PLATFORM=PLATFORM, VERSION=VERSION)

    data = {
        'tag_name': 'release/{VERSION}'.format(VERSION),
        'target_commitish': commitish,
        'name': '{VERSION} - {PLATFORM}'.format(VERSION=VERSION, PLATFORM=PLATFORM),
        'body': description,
        'draft': True,
        'prerelease': False,
    }

    print data

    response = requests.post(GITHUB_DRAFT_URL, json=data)

    if response.status_code in [200, 201]:
        print 'Draft created!'

        draft_data = json.loads(response.text)
        upload_url = '{URL}?access_token={ACCESS_TOKEN}'.format(URL=draft_data['upload_url'].split('{')[0], ACCESS_TOKEN=GITHUB_ACCESS_TOKEN)

        for file in os.listdir(os.getcwd()):
            if (file.endswith(('.asc','.AppImage','.deb','.exe','.pkg'))):
                filename = os.path.join(os.getcwd(), file)
                print 'Uploading asset {FILENAME}...'.format(filename)
                headers = {'Content-type': 'application/binary'}
                response = requests.post('{UPLOAD_URL}&name={FILENAME}'.format(UPLOAD_URL=upload_url, FILENAME=file), headers=headers, data=open(filename, 'rb').read())

                if response.status_code in [200, 201]:
                    print 'Upload successful!'
                else:
                    print 'Upload failed :(', response.status_code
                    print response.text
                    print 'Deleting draft, because upload failed'
                    response = requests.delete('{URL}?access_token={ACCESS_TOKEN}'.format(URL=draft_data['url'], ACCESS_TOKEN=GITHUB_ACCESS_TOKEN))

                    if response.status_code in [200, 204]:
                        print 'Draft deleted!'
                    else:
                        print 'Deleting draft failed :(', response.status_code
                        print response.text
                        exit(1)
    else:
        print 'Error :(', response.status_code
        print response.text
        exit(1)
