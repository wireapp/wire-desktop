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

import boto3
import os
import re

BUCKET = os.environ.get('BUCKET')
VERSION = os.environ.get('WRAPPER_BUILD').split('#')[1]
S3_PATH = os.environ.get('WIN_S3_PATH')

bin_root = os.path.dirname(os.path.realpath(__file__))
custom_root = os.path.join(bin_root, '..', 'wrap', 'custom')
regex = re.compile('(.+)-Setup\.exe', re.IGNORECASE)

def find(extension, path):
  for root, dirs, files in os.walk(path):
    for file in files:
      if file.lower().endswith(extension.lower()):
        return os.path.join(root, file), file
  return None, None

setup_exe_full, setup_exe_name = find('-Setup.exe', custom_root)

if setup_exe_full is None:
  raise Exception('No setup executable found')

print 'found executable %s' % setup_exe_full

app_name = regex.search(setup_exe_name).group(1)
build_root = os.path.join(custom_root, '..', 'wrap', 'custom')

NEW_RELEASE = app_name + '-' + VERSION + '-RELEASES'
NEW_EXE = app_name + '-' + VERSION + '.exe'

NEW_RELEASE_KEY = S3_PATH + '/' + NEW_RELEASE
NEW_EXE_KEY = S3_PATH + '/' + NEW_EXE

OLD_RELEASE_KEY = S3_PATH + '/RELEASES'
OLD_EXE_KEY = S3_PATH + ('/%s-Setup.exe' % app_name)

s3 = boto3.resource('s3')

s3.Object(BUCKET, OLD_RELEASE_KEY).delete()
print 'deleted %s' % OLD_RELEASE_KEY

s3.Object(BUCKET, OLD_EXE_KEY).delete()
print 'deleted %s' % OLD_EXE_KEY

s3.Object(BUCKET, OLD_RELEASE_KEY).copy_from(ACL='public-read', CopySource='%s/%s' % (BUCKET, NEW_RELEASE_KEY))
print 'copied %s to %s ' % (NEW_RELEASE_KEY, OLD_RELEASE_KEY)

s3.Object(BUCKET, OLD_EXE_KEY).copy_from(ACL='public-read', CopySource='%s/%s' % (BUCKET, NEW_EXE_KEY))
print 'copied %s to %s ' % (NEW_EXE_KEY, OLD_EXE_KEY)
