#!/bin/bash

old_exec="/opt/Wire/wire";

# Warn if old package is still installed
if test -e "${old_exec}"; then
  echo "WARNING: It seems that there are files from the old Wire package on"
  echo "your machine. We highly recommend that you remove the old version"
  echo "and then reinstall this package. You can remove the old package with"
  echo "the following command:"
  echo "sudo apt-get remove wire"
fi

# Clean up old invalid links
if [ -L '/usr/local/bin/wire' ] || [ -L '/usr/local/bin/${executable}' ]; then
  echo "Removing old invalid symlinks"
  if [ -L '/usr/local/bin/wire' ] && [ "$(readlink '/usr/local/bin/wire')" = "${old_exec}" ]; then rm -f /usr/local/bin/wire; fi
  if [ -L '/usr/local/bin/${executable}' ] && [ "$(readlink '/usr/local/bin/${executable}')" = '/opt/${sanitizedProductName}/${executable}' ]; then rm -f '/usr/local/bin/${executable}'; fi
fi

# The /usr/bin/${executable} symlink and chrome-sandbox's setuid bit are both declared as
# real package file attributes (see linuxSymlinkStagingDir and rpmChromeSandboxAttr in
# build-linux.ts) and applied by rpm itself during install, so nothing to do here for either.
