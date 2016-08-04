#!/usr/bin/env python
# coding: utf-8

#
# Wire
# Copyright (C) 2016 Wire Swiss GmbH
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
import zipfile

HOCKEY_TOKEN = os.environ.get('WIN_HOCKEY_TOKEN')
HOCKEY_ID = os.environ.get('WIN_HOCKEY_ID')
HOCKEY_UPLOAD = 'https://rink.hockeyapp.net/api/2/apps/%s/app_versions/' % HOCKEY_ID
HOCKEY_NEW = 'https://rink.hockeyapp.net/api/2/apps/%s/app_versions/new' % HOCKEY_ID

bin_root = os.path.dirname(os.path.realpath(__file__))
wire_exe = os.path.join(bin_root, '..', 'wrap', 'internal', 'WireInternal-win32-ia32', 'WireInternalSetup.exe')
wire_zip = os.path.join(bin_root, 'WireInternalSetup.zip')
info_json = os.path.join(bin_root, '..', 'info.json')


def zipit(source, dest):
  os.chdir(os.path.dirname(os.path.abspath(source)))
  filename = os.path.basename(source)
  zipf = zipfile.ZipFile(dest, 'w')
  zipf.write(filename)
  zipf.close()


if __name__ == '__main__':

  print 'Compressing...'

  zipit(wire_exe, wire_zip)

  with open(info_json) as info_file:
    info = json.load(info_file)

  print 'Uploading %s.%s...' % (info['version'], info['build'])

  headers = {
    'X-HockeyAppToken': HOCKEY_TOKEN,
  }
  data = {
    'notify': 0,
    'notes': 'Jenkins Build',
    'status': 2,
    'bundle_short_version': info['version'],
    'bundle_version': info['build'],
  }
  files = {
    'ipa': open(wire_zip, 'rb')
  }

  response = requests.post(HOCKEY_NEW, data=data, headers=headers)
  response = requests.put('%s%s' % (HOCKEY_UPLOAD, response.json()['id']), files=files, data=data, headers=headers)

  if response.status_code in [200, 201]:
    print 'Uploaded!'
  else:
    print 'Error :('
