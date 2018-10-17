/*
 * Wire
 * Copyright (C) 2018 Wire Swiss GmbH
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

// taken from https://github.com/wireapp/wire-webapp/blob/staging/app/script/event/WebApp.js

/** Enum of different webapp events. */
interface z {
  event: {
    WebApp: {
      ANALYTICS: {
        EVENT: string;
        SUPER_PROPERTY: string;
      };
      APP: {
        UPDATE_PROGRESS: string;
      };
      AUDIO: {
        PLAY: string;
        PLAY_IN_LOOP: string;
        STOP: string;
      };
      BACKUP: {
        EXPORT: {
          START: string;
        };
        IMPORT: {
          START: string;
        };
      };
      BROADCAST: {
        SEND_MESSAGE: string;
      };
      CALL: {
        EVENT_FROM_BACKEND: string;
        MEDIA: {
          ADD_STREAM: string;
          CHOOSE_SCREEN: string;
          CONNECTION_CLOSED: string;
          MUTE_AUDIO: string;
          TOGGLE: string;
        };
        SIGNALING: {
          DELETE_FLOW: string;
          POST_FLOWS: string;
          SEND_ICE_CANDIDATE_INFO: string;
          SEND_LOCAL_SDP_INFO: string;
        };
        STATE: {
          CHECK: string;
          DELETE: string;
          JOIN: string;
          LEAVE: string;
          REJECT: string;
          REMOVE_PARTICIPANT: string;
          TOGGLE: string;
        };
      };
      CLIENT: {
        ADD: string;
        REMOVE: string;
        UPDATE: string;
        VERIFICATION_STATE_CHANGED: string;
      };
      CONNECT: {
        IMPORT_CONTACTS: string;
      };
      CONNECTION: {
        ACCESS_TOKEN: {
          RENEW: string;
          RENEWED: string;
        };
        ONLINE: string;
      };
      CONTENT: {
        SWITCH: string;
      };
      CONTEXT_MENU: string;
      CONVERSATION: {
        ASSET: {
          CANCEL: string;
        };
        CREATE_GROUP: string;
        DEBUG: string;
        DETAIL_VIEW: {
          SHOW: string;
        };
        EPHEMERAL_MESSAGE_TIMEOUT: string;
        EVENT_FROM_BACKEND: string;
        IMAGE: {
          SEND: string;
        };
        INPUT: {
          CLICK: string;
        };
        MAP_CONNECTION: string;
        MESSAGE: {
          ADDED: string;
          EDIT: string;
          REMOVED: string;
        };
        MISSED_EVENTS: string;
        PEOPLE: {
          HIDE: string;
        };
        PERSIST_STATE: string;
        SHOW: string;
      };
      DEBUG: {
        UPDATE_LAST_CALL_STATUS: string;
      };
      EVENT: {
        NOTIFICATION_HANDLING_STATE: string;
        UPDATE_TIME_OFFSET: string;
      };
      EXTENSIONS: {
        GIPHY: {
          SEND: string;
          SHOW: string;
        };
      };
      LEFT: {
        FADE_IN: string;
        HIDE: string;
      };
      LIFECYCLE: {
        ASK_TO_CLEAR_DATA: string;
        LOADED: string;
        REFRESH: string;
        RESTART: string;
        SIGN_OUT: string;
        SIGNED_OUT: string;
        UNREAD_COUNT: string;
        UPDATE: string;
      };
      NOTIFICATION: {
        CLICK: string;
        NOTIFY: string;
        PERMISSION_STATE: string;
        REMOVE_READ: string;
        SHOW: string;
      };
      PENDING: {
        SHOW: string;
      };
      PREFERENCES: {
        MANAGE_ACCOUNT: string;
        MANAGE_DEVICES: string;
        UPLOAD_PICTURE: string;
      };
      PROFILE: {
        SETTINGS: {
          SHOW: string;
        };
      };
      PROPERTIES: {
        UPDATE: {
          CONTACTS: string;
          EMOJI: {
            REPLACE_INLINE: string;
          };
          NOTIFICATIONS: string;
          PREVIEWS: {
            SEND: string;
          };
          PRIVACY: string;
          SOUND_ALERTS: string;
        };
        UPDATED: string;
      };
      SEARCH: {
        BADGE: {
          HIDE: string;
          SHOW: string;
        };
        HIDE: string;
        SHOW: string;
      };
      SHORTCUT: {
        ADD_PEOPLE: string;
        ARCHIVE: string;
        CALL_MUTE: string;
        CALL_REJECT: string;
        DELETE: string;
        NEXT: string;
        NOTIFICATIONS: string;
        PEOPLE: string;
        PICTURE: string;
        PING: string;
        PREV: string;
        SILENCE: string; // todo: deprecated - remove when user base of wrappers version >= 3.4 is large enough
        START: string;
      };
      SIGN_OUT: string;
      STORAGE: {
        SAVE_ENTITY: string;
      };
      SYSTEM_NOTIFICATION: {
        CLICK: string; // todo: deprecated - remove when user base of wrappers version >= 3.2 is large enough
      };
      TEAM: {
        EVENT_FROM_BACKEND: string;
        INFO: string;
        MEMBER_LEAVE: string;
        UPDATE_INFO: string;
      };
      TELEMETRY: {
        BACKEND_REQUESTS: string;
      };
      USER: {
        CLIENT_ADDED: string;
        CLIENT_REMOVED: string;
        CLIENTS_UPDATED: string;
        EVENT_FROM_BACKEND: string;
        PERSIST: string;
        SET_AVAILABILITY: string;
        UNBLOCKED: string;
        UPDATE: string;
      };
      WARNING: {
        DISMISS: string;
        MODAL: string;
        SHOW: string;
      };
      WINDOW: {
        RESIZE: {
          HEIGHT: string;
          WIDTH: string;
        };
      };
    };
  };
  // taken from https://github.com/wireapp/wire-webapp/blob/staging/app/script/lifecycle/UpdateSource.js
  lifecycle: {
    UPDATE_SOURCE: {
      DESKTOP: string;
      WEBAPP: string;
    };
  };
  util: {
    Environment: {
      version(showWrapperVersion?: boolean, doNotFormat?: boolean): string;
    };
  };
}

interface wire {
  app: any;
}

interface AccountInfo {
  accentID: number;
  name: string;
  picture: string;
  teamID: string;
  teamRole: string;
  userID: string;
}

export {AccountInfo, wire, z};
