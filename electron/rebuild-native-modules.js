#!/usr/bin/env node

/*
   This is elijahmanor's cross-var (v1.0.3) with a few modifications.
   https://github.com/elijahmanor/cross-var
*/

'use strict';

const spawn = require('cross-spawn');
const exec = require('child_process').exec;
const arch = process.env.wire_target_arch ? process.env.wire_target_arch : process.arch;

const normalize = (args) => {
  return args.map((arg) => {
    Object.keys(process.env).forEach(key => {
      const regex = new RegExp(`\\$${key }|%${key }%`, 'i');
      arg = arg.replace(regex, process.env[key]);
    });
    return arg;
  });
};

let args = process.argv.slice(2);
if (args.length === 1) {
  const [command] = normalize(args);
  const proc = exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
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
