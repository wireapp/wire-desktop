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
info_json = os.path.join(bin_root, '..', 'info.json')
with open(info_json) as info_file:
  info = json.load(info_file)
version = '%s.%s' % (info['version'], info['build'])

NEW_RELEASE = 'wire-' + version + '-RELEASES'
NEW_EXE = 'wire-' + version + '.exe'

NEW_RELEASE_KEY = S3_PATH + NEW_RELEASE
NEW_EXE_KEY = S3_PATH + NEW_EXE

OLD_RELEASE_KEY = S3_PATH + 'RELEASES'
OLD_EXE_KEY = S3_PATH + 'WireSetup.exe'

s3 = boto3.resource('s3')

s3.Object(BUCKET, OLD_RELEASE_KEY).delete()
print 'deleted %s' % OLD_RELEASE_KEY

s3.Object(BUCKET, OLD_EXE_KEY).delete()
print 'deleted %s' % OLD_EXE_KEY

s3.Object(BUCKET, OLD_RELEASE_KEY).copy_from(CopySource='%s/%s' % (BUCKET, NEW_RELEASE_KEY))
print 'copied %s to %s ' % (NEW_RELEASE_KEY, OLD_RELEASE_KEY)

s3.Object(BUCKET, OLD_EXE_KEY).copy_from(CopySource='%s/%s' % (BUCKET, NEW_EXE_KEY))
print 'copied %s to %s ' % (NEW_EXE_KEY, OLD_EXE_KEY)
