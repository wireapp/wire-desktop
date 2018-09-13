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

NEW_RELEASE_KEY = '{PATH}wire-internal-{VERSION}-RELEASES'.format(PATH=S3_PATH, VERSION=VERSION)
NEW_EXE_KEY = '{PATH}wire-{VERSION}.exe'.format(PATH=S3_PATH, VERSION=VERSION)

OLD_RELEASE_KEY = '{PATH}RELEASES'.format(S3_PATH)
OLD_EXE_KEY = '{PATH}WireInternalSetup.exe'.format(S3_PATH)

s3 = boto3.resource('s3')

s3.Object(BUCKET, OLD_RELEASE_KEY).delete()
print 'Deleted {FILENAME}'.format(OLD_RELEASE_KEY)

s3.Object(BUCKET, OLD_EXE_KEY).delete()
print 'Deleted {FILENAME}'.format(OLD_EXE_KEY)

s3.Object(BUCKET, OLD_RELEASE_KEY).copy_from(ACL='public-read', CopySource='{BUCKET}/{FILENAME}'.format(BUCKET=BUCKET, FILENAME=NEW_RELEASE_KEY))
print 'Copied {FILENAME} to {DESTINATION}'.format(FILENAME=NEW_RELEASE_KEY, DESTINATION=OLD_RELEASE_KEY)

s3.Object(BUCKET, OLD_EXE_KEY).copy_from(ACL='public-read', CopySource='{BUCKET}/{FILENAME}'.format(BUCKET=BUCKET, FILENAME=NEW_EXE_KEY))
print 'Copied {FILENAME} to {DESTINATION}'.format(FILENAME=NEW_EXE_KEY, DESTINATION=OLD_EXE_KEY)
