#!/usr/bin/env bash

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

function jsonval {
  temp=`echo $json | sed 's/\\\\\//\//g' | sed 's/[{}]//g' | awk -v k="text" '{n=split($0,a,","); for (i=1; i<=n; i++) print a[i]}' | sed 's/\"\:\"/\|/g' | sed 's/[\,]/ /g' | sed 's/\"//g' | grep -w $prop`
  echo ${temp##*|}
}

if [[ $GIT_BRANCH =~ .*\/([0-9]*.[0-9]*).([0-9]*)$ ]]; then
  short_version=${BASH_REMATCH[1]}
  build_version=${BASH_REMATCH[2]}
fi

# create app
json=$(curl \
  -F "bundle_short_version=$short_version" \
  -F "bundle_version=$build_version" \
  -H "X-HockeyAppToken: $MACOS_MAS_HOCKEY_TOKEN" \
  https://rink.hockeyapp.net/api/2/apps/8fe169d9cb81d550b6478232560b8321/app_versions/new)

prop='config_url'
config_url=`jsonval`

if [[ $config_url =~ \/([0-9]*)$ ]]; then
    hockey_app_version=${BASH_REMATCH[1]}
fi

# upload zip to hockey
curl -X PUT \
  -F "notify=0" \
  -F "status=2" \
  -F "ipa=@Wire.pkg" \
  -H "X-HockeyAppToken: $MACOS_MAS_HOCKEY_TOKEN" \
  https://rink.hockeyapp.net/api/2/apps/8fe169d9cb81d550b6478232560b8321/app_versions/$hockey_app_version

# clean up
rm Wire.pkg
