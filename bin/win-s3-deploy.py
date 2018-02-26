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

BUCKET = os.environ.get('BUCKET')
VERSION = os.environ.get('WRAPPER_BUILD').split('#')[1]

bin_root = os.path.dirname(os.path.realpath(__file__))

S3_PATH = 'win/internal/'

NEW_RELEASE = 'wire-internal-' + VERSION + '-RELEASES'
NEW_EXE = 'wire-internal-' + VERSION + '.exe'

NEW_RELEASE_KEY = S3_PATH + NEW_RELEASE
NEW_EXE_KEY = S3_PATH + NEW_EXE

OLD_RELEASE_KEY = S3_PATH + 'RELEASES'
OLD_EXE_KEY = S3_PATH + 'WireInternalSetup.exe'

s3 = boto3.resource('s3')

s3.Object(BUCKET, OLD_RELEASE_KEY).delete()
print 'deleted %s' % OLD_RELEASE_KEY

s3.Object(BUCKET, OLD_EXE_KEY).delete()
print 'deleted %s' % OLD_EXE_KEY

s3.Object(BUCKET, OLD_RELEASE_KEY).copy_from(ACL='public-read', CopySource='%s/%s' % (BUCKET, NEW_RELEASE_KEY))
print 'copied %s to %s ' % (NEW_RELEASE_KEY, OLD_RELEASE_KEY)

s3.Object(BUCKET, OLD_EXE_KEY).copy_from(ACL='public-read', CopySource='%s/%s' % (BUCKET, NEW_EXE_KEY))
print 'copied %s to %s ' % (NEW_EXE_KEY, OLD_EXE_KEY)
