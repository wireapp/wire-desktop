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
S3_PATH = 'win/internal/'

info_json = os.path.join(bin_root, '..', 'info.json')
with open(info_json) as info_file:
  info = json.load(info_file)
version = '%s.%s' % (info['version'], info['build'])

NEW_RELEASE = 'wire-internal-' + version + '-RELEASES'
NEW_EXE = 'wire-internal-' + version + '.exe'

NEW_RELEASE_KEY = S3_PATH + NEW_RELEASE
NEW_EXE_KEY = S3_PATH + NEW_EXE

OLD_RELEASE_KEY = S3_PATH + 'RELEASES'
OLD_EXE_KEY = S3_PATH + 'WireSetup.exe'

client = boto3.client(
  's3',
  aws_access_key_id=os.environ.get('AWS_ACCESS_KEY'),
  aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
)

client.delete_object(Bucket=BUCKET, Key=OLD_RELEASE_KEY)
print 'deleted %s' % OLD_RELEASE_KEY

client.delete_object(Bucket=BUCKET, Key=OLD_EXE_KEY)
print 'deleted %s' % OLD_EXE_KEY

client.copy_object(Bucket=BUCKET, CopySource='%s/%s' % (BUCKET, NEW_RELEASE_KEY), Key=OLD_RELEASE_KEY)
print 'copied %s to %s ' % (NEW_RELEASE_KEY, OLD_RELEASE_KEY)

client.copy_object(Bucket=BUCKET, CopySource='%s/%s' % (BUCKET, NEW_EXE_KEY), Key=OLD_EXE_KEY)
print 'copied %s to %s ' % (NEW_EXE_KEY, OLD_EXE_KEY)
