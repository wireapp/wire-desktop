export class ContextMenuSelector {
  static getContextMenuState = state => state.contextMenuState;
  static isEditAccountMenuVisible = state => getContextMenuState(state).isEditAccountMenuVisible;
  static getPosition = state => getContextMenuState(state).position;
  static getAccountId = state => getContextMenuState(state).accountId;
  static getIsAtLeastAdmin = state => getContextMenuState(state).isAtLeastAdmin;
  static getLifecycle = state => getContextMenuState(state).lifecycle;
  static getSessionId = state => getContextMenuState(state).sessionId;
}
