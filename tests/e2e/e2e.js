const Application = require('spectron').Application;
const assert = require('assert');
const electronPath = require('electron'); // Require Electron from the binaries included in node_modules.

describe('Application launch', function () {
  this.timeout(10000);

  beforeEach(function () {
    this.app = new Application({
      // Your electron path can be any binary
      // i.e for OSX an example path could be '/Applications/MyApp.app/Contents/MacOS/MyApp'
      // But for the sake of the example we fetch it from our node_modules.
      path: electronPath,

      // Assuming you have the following directory structure

      //  |__ my project
      //     |__ ...
      //     |__ main.js
      //     |__ package.json
      //     |__ index.html
      //     |__ ...
      //     |__ test
      //        |__ spec.js  <- You are here! ~ Well you should be.

      // The following line tells spectron to look and use the main.js file
      // and the package.json located 1 level above.
      args: ['electron/']
    });
    return this.app.start();
  });

  afterEach(function () {
    // not working for the moment: see https://github.com/electron/spectron/issues/177#issuecomment-370790942
    // this.app.client.windowByIndex(2);
    if (this.app && this.app.isRunning()) {
      return this.app.stop();
    }
  });

  it('shows an initial window', function (done) {
    setTimeout(() => {
      this.app.client
          .getHTML('html').then(console.log.bind(console));
          //return this.app.client.getTitle().then(console.log.bind(console));
      done();
    }, 3000);

  });
});
