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

import os
import requests

HOCKEY_URL = 'https://rink.hockeyapp.net/api/2/apps/upload'
HOCKEY_TOKEN = os.environ.get('MACOS_HOCKEY_TOKEN')

bin_root = os.path.dirname(os.path.realpath(__file__))
wire_app = os.path.join(bin_root, '..', 'wrap', 'build', 'WireInternal-mas-x64', 'WireInternal.app')
wire_zip = os.path.join(bin_root, 'WireInternal.zip')


def ditto(source, dest):
  os.system('ditto -c -k --sequesterRsrc --keepParent %s %s' % (source, dest))

if __name__ == '__main__':

  print 'Compressing...'

  ditto(wire_app, wire_zip)

  print 'Uploading...'

  headers = {'X-HockeyAppToken': HOCKEY_TOKEN}
  data = {'notify': 1, 'notes': 'Jenkins Build', 'status': 2}
  files = {'ipa': open(wire_zip, 'rb')}

  response = requests.post(HOCKEY_URL, files=files, data=data, headers=headers)

  if response.status_code in [200, 201]:
    os.remove(wire_zip)
    print 'Uploaded!'
  else:
    print 'Error :(', response.status_code
