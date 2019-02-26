function enableLogging(): boolean {
  if (process.argv.includes('--enable-logging')) {
    return true;
  } else {
    return false;
  }
}

export {enableLogging};
