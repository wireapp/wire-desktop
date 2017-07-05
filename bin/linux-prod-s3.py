#!/usr/bin/env python
# coding: utf-8

#
# Wire
# Copyright (C) 2017 Wire Swiss GmbH
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
S3_PATH = 'linux/'
bin_root = os.path.dirname(os.path.realpath(__file__))
build_root = os.path.join(bin_root, '..', 'wrap', 'dist')
info_json = os.path.join(bin_root, '..', 'info.json')


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
  with open(info_json) as info_file:
    info = json.load(info_file)
  version = '%s.%s' % (info['version'], info['build'])

  files = [
    'wire-%s-i386.AppImage' % version,
    'wire-%s-x86_64.AppImage' % version,
    'debian/pool/main/wire_%s_amd64.deb' % version,
    'debian/pool/main/wire_%s_i386.deb' % version,
    'debian/dists/stable/Contents-all',
    'debian/dists/stable/Contents-all.bz2',
    'debian/dists/stable/Contents-all.gz',
    'debian/dists/stable/Contents-amd64',
    'debian/dists/stable/Contents-amd64.bz2',
    'debian/dists/stable/Contents-amd64.gz',
    'debian/dists/stable/Contents-i386',
    'debian/dists/stable/Contents-i386.bz2',
    'debian/dists/stable/Contents-i386.gz',
    'debian/dists/stable/Release',
    'debian/dists/stable/Release.gpg',
    'debian/dists/stable/main/binary-all/Packages',
    'debian/dists/stable/main/binary-all/Packages.bz2',
    'debian/dists/stable/main/binary-all/Packages.gz',
    'debian/dists/stable/main/binary-amd64/Packages',
    'debian/dists/stable/main/binary-amd64/Packages.bz2',
    'debian/dists/stable/main/binary-amd64/Packages.gz',
    'debian/dists/stable/main/binary-i386/Packages',
    'debian/dists/stable/main/binary-i386/Packages.bz2',
    'debian/dists/stable/main/binary-i386/Packages.gz',
  ]

  for filename in files:
    upload_file(os.path.join(build_root, filename), '%s%s' % (S3_PATH, filename))
