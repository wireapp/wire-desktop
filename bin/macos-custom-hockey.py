#!/usr/bin/env python
# coding: utf-8

#
# Wire
# Copyright (C) 2019 Wire Swiss GmbH
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

import os
import requests

HOCKEY_ID = os.environ.get('MACOS_CUSTOM_HOCKEY_ID')
HOCKEY_TOKEN = os.environ.get('MACOS_CUSTOM_HOCKEY_TOKEN')

HOCKEY_UPLOAD = 'https://rink.hockeyapp.net/api/2/apps/%s/app_versions/' % HOCKEY_ID
HOCKEY_NEW = 'https://rink.hockeyapp.net/api/2/apps/%s/app_versions/new' % HOCKEY_ID

VERSION = os.environ.get('WRAPPER_BUILD').split('#')[1]

def find(extension, path):
  for root, dirs, files in os.walk(path):
    for file in files:
      if file.lower().endswith(extension.lower()):
        return os.path.join(root, file), file
  return None, None

bin_root = os.path.abspath(os.path.join(os.path.dirname(os.path.realpath(__file__)), '..'))
custom_pkg, custom_pkg_name = find('.pkg', bin_root)

if custom_pkg is None:
  raise Exception('No .pkg file found')

if __name__ == '__main__':

  print 'Uploading %s (v%s) ...' % (custom_pkg_name, VERSION)

  semver_version = VERSION.split('.')

  request_headers = {
    'X-HockeyAppToken': HOCKEY_TOKEN,
  }
  request_data = {
    'bundle_short_version': '%s.%s' % (semver_version[0], semver_version[1]),
    'bundle_version': semver_version[2],
    'notes': 'Jenkins Build',
    'notify': 0,
    'status': 2,
  }
  request_files = {
    'ipa': open(custom_pkg, 'rb')
  }

  response_create = requests.post(HOCKEY_NEW, data=request_data, headers=request_headers)

  if response_create.status_code in [200, 201]:
    response_version = response_create.json()['id']
    print 'Version %s successfully created' % response_version
  else:
    print response_create.json()
    raise Exception('Invalid status code: %s' % response_create.status_code)

  response_upload = requests.put('%s%s' % (HOCKEY_UPLOAD, response_version), files=request_files, data=request_data, headers=request_headers)

  if response_upload.status_code in [200, 201]:
    os.remove(custom_pkg)
    print 'Version %s successfully uploaded' % response_version
  else:
    print response_upload.json()
    raise Exception('Invalid status code: %s' % response_upload.status_code)
