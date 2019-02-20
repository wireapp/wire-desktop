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

WRAPPER_BUILD = os.environ.get('WRAPPER_BUILD')
VERSION = os.environ.get('BUILD_ID')
GITHUB_ACCESS_TOKEN = os.environ.get('GITHUB_ACCESS_TOKEN')
DRAFT_RESOURCE = 'https://api.github.com/repos/wireapp/wire-desktop/releases?access_token=%s' % (GITHUB_ACCESS_TOKEN)

if __name__ == '__main__':

  print 'Creating a draft...'

  # Get last commit hash
  commitish = subprocess.check_output(['git', 'rev-parse', 'HEAD']).rstrip()

  # Get platform
  if 'Linux' in WRAPPER_BUILD:
    PLATFORM = 'Linux'
  if 'Windows' in WRAPPER_BUILD:
    PLATFORM = 'Windows'
  if 'macOS' in WRAPPER_BUILD:
    PLATFORM = 'macOS'

  data = {
    'tag_name': "%s/%s" % (PLATFORM.lower(), VERSION),
    'target_commitish': commitish,
    'name': "%s - %s" % (VERSION, PLATFORM),
    'body': '...',
    'draft': True,
    'prerelease': False,
  }

  print data

  response = requests.post(DRAFT_RESOURCE, json=data)

  if response.status_code in [200, 201]:
    print 'Draft created!'

    draft_data = json.loads(response.text)
    upload_url = '%s?access_token=%s' % (draft_data['upload_url'].split('{')[0], GITHUB_ACCESS_TOKEN)

    for file in os.listdir(os.getcwd()):
      if (file.endswith(('.asc','.sig','.AppImage','.deb','.exe','.pkg'))):
        filename = os.path.join(os.getcwd(), file)
        print 'Upload asset %s...' % filename
        headers = {'Content-type': 'application/binary'}
        response = requests.post('%s&name=%s' % (upload_url, file), headers=headers, data=open(filename, 'rb').read())

        if response.status_code in [200, 201]:
          print 'Upload successful!'
        else:
          print 'Upload failed with %s :(' % (response.status_code)
          print response.text
          print 'Delete draft, because upload failed'
          response = requests.delete('%s?access_token=%s' % (draft_data['url'], GITHUB_ACCESS_TOKEN))
          if response.status_code in [200, 204]:
            print 'Draft deleted!'
          else:
            print 'Delete failed with %s :(' % (response.status_code)
            print response.text
          exit(1)
  else:
    print 'Error %s :(' % (response.status_code)
    print response.text
    exit(1)
