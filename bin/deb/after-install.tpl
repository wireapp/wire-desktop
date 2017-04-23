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
if [ -L '/usr/local/bin/wire' ] || [ -L '/usr/local/bin/<%= executable %>' ]; then
  echo "Removing old invalid symlinks"
  if [ -L '/usr/local/bin/wire' ] && [ "$(readlink '/usr/local/bin/wire')" = "${old_exec}" ]; then rm -f /usr/local/bin/wire; fi
  if [ -L '/usr/local/bin/<%= executable %>' ] && [ "$(readlink '/usr/local/bin/<%= executable %>')" = '/opt/<% productFilename %>/<%= executable %>' ]; then rm -f '/usr/local/bin/<%= executable %>'; fi
fi

# Link to the binary
ln -sf '/opt/${productFilename}/${executable}' '/usr/bin/${executable}'
