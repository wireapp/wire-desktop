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
import json
import os

BUCKET = os.environ.get('BUCKET')
VERSION = os.environ.get('WRAPPER_BUILD').split('#')[1]

bin_root = os.path.dirname(os.path.realpath(__file__))
build_root = os.path.join(bin_root, '..', 'wrap', 'dist')
S3_PATH = 'linux/'


def upload_file(source, dest):
  if not os.path.isfile(source):
    print '%s not found' % source
    return

  print 'Uploading %s to %s' % (os.path.basename(source), dest),
  s3 = boto3.resource('s3')

  data = open(source, 'rb')
  s3.Bucket(name=BUCKET).put_object(Key=dest, Body=data, ACL='public-read')
  print '- OK'

if __name__ == '__main__':
  files = [
    'sha256sum.txt.asc',
    'Wire-%s-x86_64.AppImage' % VERSION,
    'debian/pool/main/Wire-%s-amd64.deb' % VERSION,
    'debian/dists/stable/Contents-amd64',
    'debian/dists/stable/Contents-amd64.bz2',
    'debian/dists/stable/Contents-amd64.gz',
    'debian/dists/stable/InRelease',
    'debian/dists/stable/Release',
    'debian/dists/stable/Release.gpg',
    'debian/dists/stable/main/binary-amd64/Packages',
    'debian/dists/stable/main/binary-amd64/Packages.bz2',
    'debian/dists/stable/main/binary-amd64/Packages.gz',
  ]

  for filename in files:
    upload_file(os.path.join(build_root, filename), '%s%s' % (S3_PATH, filename))
