export class ContextMenuSelector {
  static getContextMenuState = state => state.contextMenuState;
  static isEditAccountMenuVisible = state => ContextMenuSelector.getContextMenuState(state).isEditAccountMenuVisible;
  static getPosition = state => ContextMenuSelector.getContextMenuState(state).position;
  static getAccountId = state => ContextMenuSelector.getContextMenuState(state).accountId;
  static getIsAtLeastAdmin = state => ContextMenuSelector.getContextMenuState(state).isAtLeastAdmin;
  static getLifecycle = state => ContextMenuSelector.getContextMenuState(state).lifecycle;
  static getSessionId = state => ContextMenuSelector.getContextMenuState(state).sessionId;
}
