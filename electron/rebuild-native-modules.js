#!/usr/bin/env node
/*
 * Wire
 * Copyright (C) 2017 Wire Swiss GmbH
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see http://www.gnu.org/licenses/.
 *
 */



const spawn = require('cross-spawn');
const exec = require('child_process').exec;
const arch = process.env.wire_target_arch ? process.env.wire_target_arch : process.arch;

const normalize = (args) => {
  return args.map((arg) => {
    Object.keys(process.env).forEach((key) => {
      const variableRegex = new RegExp(`\\$${key}|%${key}%`, 'i');
      arg = arg.replace(variableRegex, process.env[key]);
    });
    return arg;
  });
};

let args = process.argv.slice(2);
if (args.length === 1) {
  const [command] = normalize(args);
  const proc = exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Execution error:', error);
      return;
    }
    process.stdout.write(stdout);
    process.stderr.write(stderr);
    process.exit(proc.code);
  });
} else {
  args = normalize(args);
  const command = args.shift();
  args.unshift('--arch', arch, '--');
  const proc = spawn.sync(command, args, {stdio: 'inherit'});
  process.exit(proc.status);
}
