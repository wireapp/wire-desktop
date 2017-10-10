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


import openGraph from '../openGraph';

describe('openGraph', () => {
  it('should resolve open graph data with image data', (done) => {
    const openGraphData = {
      "title": "Wire · Modern communication, full privacy. For iOS, Android, macOS, Windows, Linux and web.",
      "type": "website",
      "url": "https://wire.com/",
      "image": {
        "url": "https://lh3.ggpht.com/ElqTCcY1N0c3EAX27MRFoXynZlbTaJD2KEqYNXAPn5YQPZa6Bvsux4NCgEMoUhazdIWWelAU__Kzmr55j55EsgM=s1024"
      },
      "description": "HD quality calls, private and group chats with inline photos, music and video. Secure and perfectly synced across your devices."
    };

    openGraph('https://wire.com/')
      .then((meta) => {
        expect(meta.title).toBe(openGraphData.title);
        expect(meta.image.data).toBeDefined();
        done();
      })
      .catch(done.fail);
  });

  it('should excecute callback with open graph data containing image data', (done) => {
    const openGraphData = {
      "title": "Wire · Modern communication, full privacy. For iOS, Android, macOS, Windows, Linux and web.",
      "type": "website",
      "url": "https://wire.com/",
      "image": {
        "url": "https://lh3.ggpht.com/ElqTCcY1N0c3EAX27MRFoXynZlbTaJD2KEqYNXAPn5YQPZa6Bvsux4NCgEMoUhazdIWWelAU__Kzmr55j55EsgM=s1024"
      },
      "description": "HD quality calls, private and group chats with inline photos, music and video. Secure and perfectly synced across your devices."
    };

    openGraph('https://wire.com/', (error, meta) => {
      expect(error).toBeNull();
      expect(meta.title).toBe(openGraphData.title);
      expect(meta.image.data).toBeDefined();
      done();
    });
  });

  it('should return open graph data without image data', (done) => {
    const openGraphData = {
      "title": "Wire · Modern communication, full privacy. For iOS, Android, macOS, Windows, Linux and web.",
      "type": "website",
      "url": "https://wire.com/",
      "description": "HD quality calls, private and group chats with inline photos, music and video. Secure and perfectly synced across your devices."
    };

    openGraph('https://wire.com/')
      .then((meta) => {
        expect(meta.title).toBe(openGraphData.title);
        expect(meta.image).not.toBeDefined();
        done();
      })
      .catch(done.fail);
  });
});


