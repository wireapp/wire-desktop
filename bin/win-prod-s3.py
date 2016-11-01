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

import boto3
import json
import os

BUCKET = os.environ.get('BUCKET')
S3_PATH = 'win/prod/'
bin_root = os.path.dirname(os.path.realpath(__file__))
build_root = os.path.join(bin_root, '..', 'wrap', 'prod', 'Wire-win32-ia32')
releases = os.path.join(build_root, 'RELEASES')
info_json = os.path.join(bin_root, '..', 'info.json')


def upload_file(source, dest):
  if not os.path.isfile(source):
    print '%s not found'
    return

  print 'Uploading %s to %s' % (os.path.basename(source), dest),

  s3 = boto3.resource('s3')
  data = open(source, 'rb')
  s3.Bucket(BUCKET).put_object(Key=dest, Body=data, ACL='public-read')
  print '- OK'

if __name__ == '__main__':
  with open(info_json) as info_file:
    info = json.load(info_file)
  version = '%s.%s' % (info['version'], info['build'])

  wire_nupkg = 'wire-%s-full.nupkg' % version
  wire_nupkg_full = os.path.join(build_root, wire_nupkg)
  wire_exe_full = os.path.join(build_root, 'WireSetup.exe')

  upload_file(wire_nupkg_full, '%s%s' % (S3_PATH, wire_nupkg))
  upload_file(wire_exe_full, '%swire-%s.exe' % (S3_PATH, version))
  upload_file(releases, '%swire-%s-RELEASES' % (S3_PATH, version))
