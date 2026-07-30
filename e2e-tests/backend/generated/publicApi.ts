/**
 * Wire-Server API
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from '@oazapfts/runtime';
import * as QS from '@oazapfts/runtime/query';
export const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders> = {
  headers: {},
  baseUrl: '/v15',
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
  server1: '/v15',
};
export type TokenType = 'Bearer';
export type Uuid = string;
export type AccessToken = {
  /** The opaque access token string */
  access_token: string;
  /** The number of seconds this token is valid */
  expires_in: number;
  token_type: TokenType;
  user: Uuid;
};
export type Email = string;
export type EmailUpdate = {
  email: Email;
};
export type UserSsoId = {
  scim_external_id?: string;
  subject?: string;
  tenant?: string;
};
export type ActivationResponse = {
  email?: Email;
  /** Whether this is the first successful activation (i.e. account activation). */
  first?: boolean;
  sso_id?: UserSsoId;
};
export type Ascii = string;
export type Activate = {
  code: Ascii;
  /** At least one of key, email, or phone has to be present while key takes precedence over email, and email takes precedence over phone. Whether to perform a dryrun, i.e. to only check whether activation would succeed. Dry-runs never issue access cookies or tokens on success but failures still count towards the maximum failure count. */
  dryrun: boolean;
  email?: Email;
  key?: Ascii;
};
export type Locale = string;
export type SendActivationCode = {
  email: Email;
  locale?: Locale;
};
export type VersionNumber = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
export type Domain = string;
export type VersionInfo = {
  development: VersionNumber[];
  domain: Domain;
  federation: boolean;
  supported: VersionNumber[];
};
export type AssetSource = unknown;
export type UtcTimeMillis = string;
export type AssetKey = string;
export type Asset = {
  domain: Domain;
  expires?: UtcTimeMillis;
  key: AssetKey;
  token?: Ascii;
};
export type NewAssetToken = {
  token: Ascii;
};
export type ClientCapability = 'legalhold-implicit-consent' | 'consumable-notifications';
export type ClientCapabilityList = ClientCapability[];
export type ClientClass = 'phone' | 'tablet' | 'desktop' | 'legalhold';
export type UtcTime = string;
export type MlsPublicKeys = {
  [key: string]: string;
};
export type ClientType = 'temporary' | 'permanent' | 'legalhold';
export type Client = {
  capabilities?: ClientCapabilityList;
  class?: ClientClass;
  cookie?: string;
  /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
  id: string;
  label?: string;
  last_active?: UtcTime;
  mls_public_keys?: MlsPublicKeys;
  model?: string;
  time: UtcTimeMillis;
  type: ClientType;
};
export type UncheckedPrekeyBundle = {
  id: number;
  key: string;
};
export type UpdateBotPrekeys = {
  prekeys: UncheckedPrekeyBundle[];
};
export type RoleName = string;
export type QualifiedUserId = {
  domain: Domain;
  id: Uuid;
};
export type ServiceRef = {
  id: Uuid;
  provider: Uuid;
};
export type OtherMember = {
  conversation_role?: RoleName;
  id?: Uuid;
  qualified_id: QualifiedUserId;
  service?: ServiceRef;
  /** deprecated */
  status?: number;
};
export type BotConvView = {
  id: Uuid;
  members: OtherMember[];
  name?: string;
};
export type AddBot = {
  locale?: Locale;
  provider: Uuid;
  service: Uuid;
};
export type AssetSize = 'preview' | 'complete';
export type AssetType = 'image';
export type UserAsset = {
  key: AssetKey;
  size?: AssetSize;
  type: AssetType;
};
export type Access = 'private' | 'invite' | 'link' | 'code';
export type AccessRoleLegacy = 'private' | 'team' | 'activated' | 'non_activated';
export type AccessRole = 'team_member' | 'non_team_member' | 'guest' | 'service';
export type AddPermission = 'admins' | 'everyone';
export type JoinType = 'external_add' | 'internal_add';
export type CellsState = 'disabled' | 'pending' | 'ready';
export type CipherSuiteTag = number;
export type HistoryDuration = string;
export type EpochTimestamp = string;
export type GroupConvType = 'group_conversation' | 'channel' | 'meeting';
export type GroupId = string;
export type History = {
  depth: HistoryDuration;
};
export type Member = {
  conversation_role?: RoleName;
  hidden?: boolean;
  hidden_ref?: string;
  id?: Uuid;
  otr_archived?: boolean;
  otr_archived_ref?: string;
  otr_muted_ref?: string;
  otr_muted_status?: number;
  qualified_id: QualifiedUserId;
  service?: ServiceRef;
  status?: unknown;
  status_ref?: unknown;
  status_time?: unknown;
};
export type OwnConvMembers = {
  /** All other current users of this conversation */
  others: OtherMember[];
  self: Member;
};
export type Protocol = 'proteus' | 'mls' | 'mixed';
export type QualifiedConvId = {
  domain: Domain;
  id: Uuid;
};
export type EdMemberLeftReason = 'left' | 'user-deleted' | 'removed';
export type TypingStatus = 'started' | 'stopped';
export type ConvType = 0 | 1 | 2 | 3;
export type HttpsUrl = string;
export type SimpleMember = {
  conversation_role?: RoleName;
  id?: Uuid;
  qualified_id: QualifiedUserId;
};
export type EventType =
  | 'conversation.member-join'
  | 'conversation.member-leave'
  | 'conversation.member-update'
  | 'conversation.rename'
  | 'conversation.access-update'
  | 'conversation.receipt-mode-update'
  | 'conversation.message-timer-update'
  | 'conversation.code-update'
  | 'conversation.code-delete'
  | 'conversation.create'
  | 'conversation.delete'
  | 'conversation.mls-reset'
  | 'conversation.connect-request'
  | 'conversation.typing'
  | 'conversation.otr-message-add'
  | 'conversation.mls-message-add'
  | 'conversation.mls-welcome'
  | 'conversation.protocol-update'
  | 'conversation.add-permission-update'
  | 'conversation.history-update';
export type EventVia = 'scim' | 'user';
export type Event = {
  conversation?: Uuid;
  /** The action of changing the permission to add members to a channel */
  data: {
    access: Access[];
    access_role?: AccessRoleLegacy;
    access_role_v2?: AccessRole[];
    add_permission: AddPermission;
    add_type: JoinType;
    cells_state?: CellsState;
    cipher_suite: CipherSuiteTag;
    code: Ascii;
    conversation_role?: RoleName;
    creator?: Uuid;
    /** Extra (symmetric) data (i.e. ciphertext, Base64 in JSON) that is common with all other recipients. */
    data?: string;
    depth: HistoryDuration;
    email?: string;
    /** The epoch number of the corresponding MLS group */
    epoch: number;
    epoch_timestamp: EpochTimestamp;
    group_conv_type?: GroupConvType;
    group_id: GroupId;
    /** Whether the conversation has a password */
    has_password: boolean;
    hidden?: boolean;
    hidden_ref?: string;
    history?: History;
    id?: Uuid;
    key: Ascii;
    last_event?: string;
    last_event_time?: string;
    members: OwnConvMembers;
    message?: string;
    /** Per-conversation message timer (can be null) */
    message_timer?: number;
    name: string;
    new_group_id?: GroupId;
    otr_archived?: boolean;
    otr_archived_ref?: string;
    otr_muted_ref?: string;
    otr_muted_status?: number;
    parent?: Uuid;
    protocol?: Protocol;
    qualified_id: QualifiedConvId;
    qualified_recipient: QualifiedUserId;
    qualified_target: QualifiedUserId;
    qualified_user_ids: QualifiedUserId[];
    reason: EdMemberLeftReason;
    /** Conversation receipt mode */
    receipt_mode: number;
    /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
    recipient: string;
    /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
    sender: string;
    status: TypingStatus;
    target?: Uuid;
    team?: Uuid;
    /** The ciphertext for the recipient (Base64 in JSON) */
    text: string;
    type: ConvType;
    uri: HttpsUrl;
    /** Deprecated, use qualified_user_ids */
    user_ids: Uuid[];
    users: SimpleMember[];
  };
  from?: Uuid;
  qualified_conversation: QualifiedConvId;
  qualified_from: QualifiedUserId;
  subconv?: string;
  team?: Uuid;
  time: UtcTimeMillis;
  type: EventType;
  via: EventVia;
};
export type AddBotResponse = {
  accent_id: number;
  assets: UserAsset[];
  /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
  client: string;
  event: Event;
  id: Uuid;
  name: string;
};
export type RemoveBotResponse = {
  event: Event;
};
export type Priority = 'low' | 'high';
export type UserClientMap = {
  [key: string]: {
    [key: string]: string;
  };
};
export type NewOtrMessage = {
  data?: string;
  native_priority?: Priority;
  native_push?: boolean;
  recipients: UserClientMap;
  report_missing?: Uuid[];
  /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
  sender: string;
  transient?: boolean;
};
export type UserClients = {
  [key: string]: string[];
};
export type ClientMismatch = {
  deleted: UserClients;
  missing: UserClients;
  redundant: UserClients;
  time: UtcTimeMillis;
};
export type AppInfo = {
  /** Category name (if uncertain, pick "other") */
  category: string;
  description: string;
};
export type Handle = string;
export type UserLegalHoldStatus = 'enabled' | 'pending' | 'disabled' | 'no_consent';
export type PictDeprecatedUseAssetsInstead = object[];
export type BaseProtocol = 'proteus' | 'mls';
export type UserType = 'regular' | 'app' | 'bot';
export type UserProfile = {
  accent_id: number;
  app?: AppInfo;
  assets?: UserAsset[];
  deleted?: boolean;
  email?: Email;
  expires_at?: UtcTimeMillis;
  handle?: Handle;
  id?: Uuid;
  legalhold_status: UserLegalHoldStatus;
  name: string;
  picture?: PictDeprecatedUseAssetsInstead;
  qualified_id: QualifiedUserId;
  searchable?: boolean;
  service?: ServiceRef;
  supported_protocols?: BaseProtocol[];
  team?: Uuid;
  text_status?: string;
  type?: UserType;
};
export type BotUserView = {
  accent_id: number;
  handle?: Handle;
  id: Uuid;
  name: string;
  team?: Uuid;
};
export type UserClientPrekeyMap = {
  [key: string]: {
    [key: string]: {
      id: number;
      key: string;
    };
  };
};
export type PubClient = {
  class?: ClientClass;
  /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
  id: string;
};
export type QualifiedNewOtrMessage = unknown;
export type QualifiedUserClients = {
  [key: string]: {
    [key: string]: string[];
  };
};
export type MessageSendingStatus = {
  deleted: QualifiedUserClients;
  failed_to_confirm_clients: QualifiedUserClients;
  failed_to_send: QualifiedUserClients;
  missing: QualifiedUserClients;
  redundant: QualifiedUserClients;
  time: UtcTimeMillis;
};
export type TurnUri = string;
export type TurnUsername = string;
export type RtcIceServer = {
  credential: Ascii;
  /** Array of TURN server addresses of the form 'turn:<addr>:<port>' */
  urls: TurnUri[];
  username: TurnUsername;
};
export type SftServer = {
  /** Array containing exactly one SFT server address of the form 'https://<addr>:<port>' */
  urls: HttpsUrl[];
};
export type RtcConfiguration = {
  /** Array of 'RTCIceServer' objects */
  ice_servers: RtcIceServer[];
  /** True if the client should connect to an SFT in the sft_servers_all and request it to federate */
  is_federating?: boolean;
  /** Array of 'SFTServer' objects (optional) */
  sft_servers?: SftServer[];
  /** Array of all SFT servers */
  sft_servers_all?: SftServer[];
  /** Number of seconds after which the configuration should be refreshed (advisory) */
  ttl: number;
};
export type NewClient = {
  capabilities?: ClientCapabilityList;
  class?: ClientClass;
  /** The cookie label, i.e. the label used when logging in. */
  cookie?: string;
  label?: string;
  lastkey: UncheckedPrekeyBundle;
  mls_public_keys?: MlsPublicKeys;
  model?: string;
  /** The password of the authenticated user for verification. Note: Required for registration of the 2nd, 3rd, ... client. */
  password?: string;
  /** Prekeys for other clients to establish OTR sessions. */
  prekeys: UncheckedPrekeyBundle[];
  type: ClientType;
  verification_code?: Ascii;
};
export type DPoPAccessToken = string;
export type AccessTokenType = 'DPoP';
export type DPoPAccessTokenResponse = {
  expires_in: number;
  token: DPoPAccessToken;
  type: AccessTokenType;
};
export type DeleteClient = {
  /** The password of the authenticated user for verification. The password is not required for deleting temporary clients. */
  password?: string;
};
export type UpdateClient = {
  capabilities?: ClientCapabilityList;
  /** A new name for this client. */
  label?: string;
  lastkey?: UncheckedPrekeyBundle;
  mls_public_keys?: MlsPublicKeys;
  /** New prekeys for other clients to establish OTR sessions. */
  prekeys?: UncheckedPrekeyBundle[];
};
export type Relation =
  | 'accepted'
  | 'blocked'
  | 'pending'
  | 'ignored'
  | 'sent'
  | 'cancelled'
  | 'missing-legalhold-consent';
export type UserConnection = {
  conversation?: Uuid;
  from: Uuid;
  last_update: UtcTimeMillis;
  qualified_conversation?: QualifiedConvId;
  qualified_to: QualifiedUserId;
  status: Relation;
  to?: Uuid;
};
export type ConnectionUpdate = {
  status: Relation;
};
export type ConvTeamInfo = {
  /** This field MUST NOT be used by clients. It is here only for backwards compatibility of the interface. */
  managed: unknown;
  teamid: Uuid;
};
export type NewConv = {
  access?: Access[];
  access_role?: AccessRole[];
  add_permission?: AddPermission;
  cells?: boolean;
  conversation_role?: RoleName;
  group_conv_type?: GroupConvType;
  history?: History;
  /** Per-conversation message timer */
  message_timer?: number;
  name?: string;
  parent?: Uuid;
  protocol?: BaseProtocol;
  /** List of qualified user IDs (excluding the requestor) to be part of this conversation */
  qualified_users?: QualifiedUserId[];
  /** Conversation receipt mode */
  receipt_mode?: number;
  /** Don't add creator to the conversation, only works for team admins not wanting to be part of the channels they create. */
  skip_creator?: boolean;
  team?: ConvTeamInfo;
  /** List of user IDs (excluding the requestor) to be part of this conversation (deprecated) */
  users?: Uuid[];
};
export type ConvMembers = {
  /** All other current users of this conversation */
  others: OtherMember[];
  self?: Member;
};
export type CreateGroupConversation = {
  access: Access[];
  access_role: AccessRole[];
  add_permission?: AddPermission;
  cells_state?: CellsState;
  cipher_suite?: CipherSuiteTag;
  creator?: Uuid;
  /** The epoch number of the corresponding MLS group */
  epoch: number;
  epoch_timestamp?: UtcTime;
  failed_to_add: QualifiedUserId[];
  group_conv_type?: GroupConvType;
  group_id: GroupId;
  history?: History;
  last_event?: string;
  last_event_time?: string;
  members: ConvMembers;
  /** Per-conversation message timer (can be null) */
  message_timer?: number;
  name?: string;
  parent?: Uuid;
  protocol?: Protocol;
  qualified_id: QualifiedConvId;
  /** Conversation receipt mode */
  receipt_mode?: number;
  team?: Uuid;
  type: ConvType;
};
export type ConversationCode = {
  code: Ascii;
  key: Ascii;
};
export type ConversationCoverView = {
  has_password: boolean;
  id: Uuid;
  name?: string;
};
export type JoinConversationByCode = {
  code: Ascii;
  key: Ascii;
  password?: string;
};
export type ListConversations = {
  qualified_ids: QualifiedConvId[];
};
export type OwnConversation = {
  access: Access[];
  access_role: AccessRole[];
  add_permission?: AddPermission;
  cells_state?: CellsState;
  cipher_suite?: CipherSuiteTag;
  creator?: Uuid;
  /** The epoch number of the corresponding MLS group */
  epoch: number;
  epoch_timestamp?: UtcTime;
  group_conv_type?: GroupConvType;
  group_id: GroupId;
  history?: History;
  id?: Uuid;
  last_event?: string;
  last_event_time?: string;
  members: OwnConvMembers;
  /** Per-conversation message timer (can be null) */
  message_timer?: number;
  name?: string;
  parent?: Uuid;
  protocol?: Protocol;
  qualified_id: QualifiedConvId;
  /** Conversation receipt mode */
  receipt_mode?: number;
  team?: Uuid;
  type: ConvType;
};
export type ConversationsResponse = {
  /** The server failed to fetch these conversations, most likely due to network issues while contacting a remote server */
  failed: QualifiedConvId[];
  found: OwnConversation[];
  /** These conversations either don't exist or are deleted. */
  not_found: QualifiedConvId[];
};
export type ConversationIdsPagingState = string;
export type GetPaginatedConversationIds = {
  paging_state?: ConversationIdsPagingState;
  /** optional, must be <= 1000, defaults to 1000. */
  size?: number;
};
export type ConversationIdsPage = {
  has_more: boolean;
  paging_state: ConversationIdsPagingState;
  qualified_conversations: QualifiedConvId[];
};
export type OwnConversationV9 = {
  access: Access[];
  access_role: AccessRole[];
  add_permission?: AddPermission;
  cells_state?: CellsState;
  cipher_suite?: CipherSuiteTag;
  creator?: Uuid;
  /** The epoch number of the corresponding MLS group */
  epoch: number;
  epoch_timestamp?: UtcTime;
  group_conv_type?: GroupConvType;
  group_id: GroupId;
  history?: History;
  id?: Uuid;
  last_event?: string;
  last_event_time?: string;
  members: OwnConvMembers;
  /** Per-conversation message timer (can be null) */
  message_timer?: number;
  name?: string;
  parent?: Uuid;
  protocol?: Protocol;
  qualified_id: QualifiedConvId;
  /** Conversation receipt mode */
  receipt_mode?: number;
  team?: Uuid;
  type: ConvType;
};
export type OwnConversationV6 = {
  access: Access[];
  access_role: AccessRole[];
  add_permission?: AddPermission;
  cells_state?: CellsState;
  cipher_suite?: CipherSuiteTag;
  creator?: Uuid;
  /** The epoch number of the corresponding MLS group */
  epoch: number;
  epoch_timestamp?: UtcTime;
  group_conv_type?: GroupConvType;
  group_id: GroupId;
  history?: History;
  id?: Uuid;
  last_event?: string;
  last_event_time?: string;
  members: OwnConvMembers;
  /** Per-conversation message timer (can be null) */
  message_timer?: number;
  name?: string;
  parent?: Uuid;
  protocol?: Protocol;
  qualified_id: QualifiedConvId;
  /** Conversation receipt mode */
  receipt_mode?: number;
  team?: Uuid;
  type: ConvType;
};
export type Conversation = {
  access: Access[];
  access_role: AccessRole[];
  add_permission?: AddPermission;
  cells_state?: CellsState;
  cipher_suite?: CipherSuiteTag;
  creator?: Uuid;
  /** The epoch number of the corresponding MLS group */
  epoch: number;
  epoch_timestamp?: UtcTime;
  group_conv_type?: GroupConvType;
  group_id: GroupId;
  history?: History;
  last_event?: string;
  last_event_time?: string;
  members: ConvMembers;
  /** Per-conversation message timer (can be null) */
  message_timer?: number;
  name?: string;
  parent?: Uuid;
  protocol?: Protocol;
  qualified_id: QualifiedConvId;
  /** Conversation receipt mode */
  receipt_mode?: number;
  team?: Uuid;
  type: ConvType;
};
export type ConversationAccessData = {
  access: Access[];
  access_role: AccessRole[];
};
export type AddPermissionUpdate = {
  add_permission: AddPermission;
};
export type GroupInfoData = unknown;
export type ConversationHistoryUpdate = {
  history: History;
};
export type InviteQualified = {
  conversation_role?: RoleName;
  qualified_users: QualifiedUserId[];
};
export type OtherMemberUpdate = {
  conversation_role?: RoleName;
};
export type ConversationMessageTimerUpdate = {
  message_timer?: number;
};
export type ConversationRename = {
  /** The new conversation name */
  name: string;
};
export type ProtocolUpdate = {
  protocol?: Protocol;
};
export type ConversationReceiptModeUpdate = {
  /** Conversation receipt mode */
  receipt_mode: number;
};
export type MemberUpdate = {
  hidden?: boolean;
  hidden_ref?: string;
  otr_archived?: boolean;
  otr_archived_ref?: string;
  otr_muted_ref?: string;
  otr_muted_status?: number;
};
export type MlsReset = {
  epoch: number;
  group_id: GroupId;
};
export type ClientIdentity = {
  /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
  client_id: string;
  domain: Domain;
  user_id: Uuid;
};
export type PublicSubConversation = {
  cipher_suite?: CipherSuiteTag;
  /** The epoch number of the corresponding MLS group */
  epoch: number;
  epoch_timestamp?: UtcTime;
  group_id: GroupId;
  members: ClientIdentity[];
  parent_qualified_id: QualifiedConvId;
  subconv_id: string;
};
export type TypingData = {
  status: TypingStatus;
};
export type ConversationCodeInfo = {
  code: Ascii;
  /** Whether the conversation has a password */
  has_password: boolean;
  key: Ascii;
  uri: HttpsUrl;
};
export type CreateConversationCodeRequest = {
  /** Password for accessing the conversation via guest link. Set to null or omit for no password. */
  password?: string;
};
export type LockStatus = 'locked' | 'unlocked';
export type FeatureStatus = 'enabled' | 'disabled';
export type GuestLinksConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type Action =
  | 'add_conversation_member'
  | 'remove_conversation_member'
  | 'modify_conversation_name'
  | 'modify_conversation_message_timer'
  | 'modify_conversation_receipt_mode'
  | 'modify_conversation_access'
  | 'modify_other_conversation_member'
  | 'leave_conversation'
  | 'delete_conversation'
  | 'modify_add_permission';
export type ConversationRole = {
  /** The set of actions allowed for this role */
  actions?: Action[];
  conversation_role?: RoleName;
};
export type ConversationRolesList = {
  conversation_roles: ConversationRole[];
};
export type CookieType = 'session' | 'persistent';
export type Cookie = {
  created: UtcTime;
  expires: UtcTime;
  id: number;
  label?: string;
  successor?: number;
  type: CookieType;
};
export type CookieList = {
  cookies: Cookie[];
};
export type RemoveCookies = {
  /** A list of cookie IDs to revoke */
  ids?: number[];
  /** A list of cookie labels for which to revoke the cookies */
  labels?: string[];
  /** The user's password */
  password: string;
};
export type CustomBackend = {
  config_json_url: HttpsUrl;
  webapp_welcome_url: HttpsUrl;
};
export type VerifyDeleteUser = {
  code: Ascii;
  key: Ascii;
};
export type Token = string;
export type DomainOwnershipToken = {
  domain_ownership_token: Token;
};
export type BackendConfig = {
  config_url: HttpsUrl;
  webapp_url: HttpsUrl;
};
export type DomainRedirectConfigTag = 'remove' | 'backend' | 'no-registration';
export type DomainRedirectConfig = {
  backend: BackendConfig;
  domain_redirect: DomainRedirectConfigTag;
};
export type DomainVerificationChallenge = {
  dns_verification_token: Ascii;
  id: Uuid;
  token: Token;
};
export type ChallengeToken = {
  challenge_token: Token;
};
export type TeamDomainRedirectTag = 'no-registration' | 'none';
export type TeamInvite20Tag = 'allowed' | 'not-allowed' | 'team';
export type TeamInviteConfig = {
  domain_redirect?: TeamDomainRedirectTag;
  sso?: string;
  team: Uuid;
  team_invite: TeamInvite20Tag;
};
export type AllowedGlobalOperationsConfig = {
  mlsConversationReset: boolean;
};
export type AllowedGlobalOperationsConfigLockableFeature = {
  config: AllowedGlobalOperationsConfig;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type AppLockConfig = {
  enforceAppLock: boolean;
  inactivityTimeoutSecs: number;
};
export type AppLockConfigLockableFeature = {
  config: AppLockConfig;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type AppsConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type AssetAuditLogConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type CellsPropertyStatus = 'enabled' | 'disabled' | 'enforced';
export type CellsProperty = {
  default: CellsPropertyStatus;
  enabled: boolean;
};
export type CellsCollaboraStatus = {
  enabled: boolean;
};
export type CellsUserMetaTags = {
  allowFreeValues: boolean;
  defaultValues: string[];
};
export type CellsNamespaces = {
  usermetaTags: CellsUserMetaTags;
};
export type CellsMetadata = {
  namespaces: CellsNamespaces;
};
export type CellsPublicLinks = {
  enableFiles: boolean;
  enableFolders: boolean;
  enforceExpirationDefault: number;
  enforceExpirationMax: number;
  enforcePassword: boolean;
};
export type CellsRecycle = {
  allowSkip: boolean;
  autoPurgeDays: number;
  disable: boolean;
};
export type CellsConfigStorage = {
  perFileQuotaBytes: string;
  recycle: CellsRecycle;
};
export type CellsUsers = {
  externals: boolean;
  guests: boolean;
};
export type CellsConfig = {
  channels: CellsProperty;
  collabora: CellsCollaboraStatus;
  groups: CellsProperty;
  metadata: CellsMetadata;
  one2one: CellsProperty;
  publicLinks: CellsPublicLinks;
  storage: CellsConfigStorage;
  users: CellsUsers;
};
export type CellsConfigLockableFeature = {
  config: CellsConfig;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type CellsBackend = {
  url: HttpsUrl;
};
export type CollaboraEdition = 'NO' | 'CODE' | 'COOL';
export type CellsCollabora = {
  edition: CollaboraEdition;
};
export type CellsStorage = {
  perUserQuotaBytes: string;
};
export type CellsInternalConfig = {
  backend: CellsBackend;
  collabora: CellsCollabora;
  storage: CellsStorage;
};
export type CellsInternalConfigLockableFeature = {
  config: CellsInternalConfig;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type ChannelPermissions = 'team-members' | 'everyone' | 'admins';
export type ChannelsConfig = {
  allowed_to_create_channels: ChannelPermissions;
  allowed_to_open_channels: ChannelPermissions;
};
export type ChannelsConfigLockableFeature = {
  config: ChannelsConfig;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type ChatBubblesConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type ClassifiedDomainsConfig = {
  domains: Domain[];
};
export type ClassifiedDomainsConfigLockableFeature = {
  config: ClassifiedDomainsConfig;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type ConferenceCallingConfig = {
  useSFTForOneToOneCalls?: boolean;
};
export type ConferenceCallingConfigLockableFeature = {
  config?: ConferenceCallingConfig;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type ConsumableNotificationsConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type DigitalSignaturesConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type DomainRegistrationConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type EnforceFileDownloadLocation = {
  enforcedDownloadLocation?: string;
};
export type EnforceFileDownloadLocationLockableFeature = {
  config: EnforceFileDownloadLocation;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type ExposeInvitationUrLsToTeamAdminConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type FileSharingConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type LegalholdConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type LimitedEventFanoutConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type MeetingsConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type MeetingsPremiumConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type MlsConfig = {
  allowedCipherSuites: CipherSuiteTag[];
  defaultCipherSuite: CipherSuiteTag;
  defaultProtocol: Protocol;
  groupInfoDiagnostics?: boolean;
  protocolToggleUsers: Uuid[];
  supportedProtocols: Protocol[];
};
export type MlsConfigLockableFeature = {
  config: MlsConfig;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type MlsE2EIdConfig = {
  acmeDiscoveryUrl?: HttpsUrl;
  crlProxy?: HttpsUrl;
  useProxyOnMobile?: boolean;
  verificationExpiration: number;
};
export type MlsE2EIdConfigLockableFeature = {
  config: MlsE2EIdConfig;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type MlsMigration = {
  finaliseRegardlessAfter?: string;
  startTime?: string;
};
export type MlsMigrationLockableFeature = {
  config: MlsMigration;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type OutlookCalIntegrationConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type SearchVisibilityAvailableConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type SearchVisibilityInboundConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type SelfDeletingMessagesConfig = {
  enforcedTimeoutSeconds: number;
};
export type SelfDeletingMessagesConfigLockableFeature = {
  config: SelfDeletingMessagesConfig;
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type SimplifiedUserConnectionRequestQrCodeLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type SndFactorPasswordChallengeConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type SsoConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type StealthUsersConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type RequireExternalEmailVerificationConfigLockableFeature = {
  lockStatus: LockStatus;
  status: FeatureStatus;
  ttl?: number;
};
export type AllTeamFeatures = {
  allowedGlobalOperations: AllowedGlobalOperationsConfigLockableFeature;
  appLock: AppLockConfigLockableFeature;
  apps: AppsConfigLockableFeature;
  assetAuditLog: AssetAuditLogConfigLockableFeature;
  cells: CellsConfigLockableFeature;
  cellsInternal: CellsInternalConfigLockableFeature;
  channels: ChannelsConfigLockableFeature;
  chatBubbles: ChatBubblesConfigLockableFeature;
  classifiedDomains: ClassifiedDomainsConfigLockableFeature;
  conferenceCalling: ConferenceCallingConfigLockableFeature;
  consumableNotifications: ConsumableNotificationsConfigLockableFeature;
  conversationGuestLinks: GuestLinksConfigLockableFeature;
  digitalSignatures: DigitalSignaturesConfigLockableFeature;
  domainRegistration: DomainRegistrationConfigLockableFeature;
  enforceFileDownloadLocation: EnforceFileDownloadLocationLockableFeature;
  exposeInvitationURLsToTeamAdmin: ExposeInvitationUrLsToTeamAdminConfigLockableFeature;
  fileSharing: FileSharingConfigLockableFeature;
  legalhold: LegalholdConfigLockableFeature;
  limitedEventFanout: LimitedEventFanoutConfigLockableFeature;
  meetings: MeetingsConfigLockableFeature;
  meetingsPremium: MeetingsPremiumConfigLockableFeature;
  mls: MlsConfigLockableFeature;
  mlsE2EId: MlsE2EIdConfigLockableFeature;
  mlsMigration: MlsMigrationLockableFeature;
  outlookCalIntegration: OutlookCalIntegrationConfigLockableFeature;
  searchVisibility: SearchVisibilityAvailableConfigLockableFeature;
  searchVisibilityInbound: SearchVisibilityInboundConfigLockableFeature;
  selfDeletingMessages: SelfDeletingMessagesConfigLockableFeature;
  simplifiedUserConnectionRequestQRCode: SimplifiedUserConnectionRequestQrCodeLockableFeature;
  sndFactorPasswordChallenge: SndFactorPasswordChallengeConfigLockableFeature;
  sso: SsoConfigLockableFeature;
  stealthUsers: StealthUsersConfigLockableFeature;
  validateSAMLemails: RequireExternalEmailVerificationConfigLockableFeature;
};
export type GetDomainRegistrationRequest = {
  email: Email;
};
export type BackendConfig2 = {
  config_url: HttpsUrl;
  webapp_url?: HttpsUrl;
};
export type DomainRedirect20Tag = 'none' | 'locked' | 'sso' | 'backend' | 'no-registration' | 'pre-authorized';
export type DomainRedirectResponseV10 = {
  backend: BackendConfig2;
  domain_redirect: DomainRedirect20Tag;
  due_to_existing_account?: boolean;
  sso_code: Uuid;
};
export type CheckHandles = {
  handles: string[];
  return: number;
};
export type Uri = string;
export type WireIdP = {
  apiVersion: 'WireIdPAPIV1' | 'WireIdPAPIV2';
  domain: string;
  handle: string;
  oldIssuers: Uri[];
  replacedBy: string;
  team: Uuid;
};
export type SignedCertificate = string;
export type IdPMetadata = {
  certAuthnResponse: SignedCertificate[];
  issuer: Uri;
  requestURI: string;
};
export type IdPConfig = {
  extraInfo: WireIdP;
  id: Uri;
  metadata: IdPMetadata;
};
export type IdPList = {
  providers: IdPConfig[];
};
export type IdPMetadataInfo = {
  value?: string;
};
export type ConnectionsPagingState = string;
export type GetPaginatedConnections = {
  paging_state?: ConnectionsPagingState;
  /** optional, must be <= 500, defaults to 100. */
  size?: number;
};
export type ConnectionsPage = {
  connections: UserConnection[];
  has_more: boolean;
  paging_state: ConnectionsPagingState;
};
export type QualifiedHandle = {
  domain: Domain;
  handle: Handle;
};
export type ListUsersQuery = {
  qualified_handles?: QualifiedHandle[];
  qualified_ids?: QualifiedUserId[];
};
export type ListUsersById = {
  failed?: QualifiedUserId[];
  found: UserProfile[];
};
export type Login = {
  email?: Email;
  handle?: Handle;
  label?: string;
  password: string;
  verification_code?: Ascii;
};
export type Frequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type Recurrence = {
  frequency: Frequency;
  interval?: number;
  until?: UtcTime;
};
export type NewMeeting = {
  end_time: UtcTime;
  invited_emails?: Email[];
  recurrence?: Recurrence;
  start_time: UtcTime;
  title: string;
};
export type QualifiedMeetingId = {
  domain: Domain;
  id: Uuid;
};
export type Meeting = {
  created_at: UtcTime;
  end_time: UtcTime;
  invited_emails: Email[];
  qualified_conversation: QualifiedConvId;
  qualified_creator: QualifiedUserId;
  qualified_id: QualifiedMeetingId;
  recurrence?: Recurrence;
  start_time: UtcTime;
  title: string;
  trial: boolean;
  updated_at: UtcTime;
};
export type UpdateMeeting = {
  end_time?: UtcTime;
  recurrence?: Recurrence;
  start_time?: UtcTime;
  title?: string;
};
export type CommitBundle = unknown;
export type MlsMessageSendingStatus = {
  /** A list of events caused by sending the message. */
  events: Event[];
  time: UtcTimeMillis;
};
export type KeyPackage = string;
export type KeyPackageRef = string;
export type KeyPackageBundleEntry = {
  /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
  client: string;
  domain: Domain;
  key_package: KeyPackage;
  key_package_ref: KeyPackageRef;
  user: Uuid;
};
export type KeyPackageBundle = {
  key_packages: KeyPackageBundleEntry[];
};
export type DeleteKeyPackages = {
  key_packages: KeyPackageRef[];
};
export type KeyPackageUpload = {
  key_packages: KeyPackage[];
};
export type OwnKeyPackages = {
  count: number;
};
export type MlsMessage = unknown;
export type SomeKey = unknown;
export type MlsKeys = {
  ecdsa_secp256r1_sha256: SomeKey;
  ecdsa_secp384r1_sha384: SomeKey;
  ecdsa_secp521r1_sha512: SomeKey;
  ed25519: SomeKey;
};
export type MlsKeysByPurpose = {
  removal: MlsKeys;
};
export type Event2 = {
  /** Event type */
  type?: string;
  [key: string]: unknown;
};
export type QueuedNotification = {
  id: Uuid;
  /** List of events */
  payload: Event2[];
};
export type QueuedNotificationList = {
  /** Whether there are still more notifications. */
  has_more?: boolean;
  /** Notifications */
  notifications: QueuedNotification[];
  time?: UtcTime;
};
export type OAuthSession = {
  created_at: UtcTimeMillis;
  refresh_token_id: Uuid;
};
export type OAuthApplication = {
  id: Uuid;
  /** The OAuth client's name */
  name: string;
  /** The OAuth client's sessions */
  sessions: OAuthSession[];
};
export type PasswordReqBody = {
  password?: string;
};
export type OAuthCodeChallenge = string;
export type CodeChallengeMethod = 'S256';
export type RedirectUrl = string;
export type OAuthResponseType = 'code';
export type CreateOAuthAuthorizationCodeRequest = {
  client_id: Uuid;
  code_challenge: OAuthCodeChallenge;
  code_challenge_method: CodeChallengeMethod;
  redirect_uri: RedirectUrl;
  response_type: OAuthResponseType;
  /** The scopes which are requested to get authorization for, separated by a space */
  scope: string;
  /** An opaque value used by the client to maintain state between the request and callback. The authorization server includes this value when redirecting the user-agent back to the client.  The parameter SHOULD be used for preventing cross-site request forgery */
  state: string;
};
export type OAuthClient = {
  application_name: string;
  client_id: Uuid;
  redirect_url: RedirectUrl;
};
export type OAuthRevokeRefreshTokenRequest = {
  client_id: Uuid;
  /** The refresh token */
  refresh_token: string;
};
export type OAuthAuthorizationCode = string;
export type OAuthGrantType = 'authorization_code' | 'refresh_token';
export type OAuthAccessTokenRequest = {
  client_id: Uuid;
  code: OAuthAuthorizationCode;
  /** The code verifier to complete the code challenge */
  code_verifier: string;
  grant_type: OAuthGrantType;
  redirect_uri: RedirectUrl;
};
export type OAuthRefreshAccessTokenRequest = {
  client_id: Uuid;
  grant_type: OAuthGrantType;
  /** The refresh token */
  refresh_token: string;
};
export type EitherOAuthAccessTokenRequestOAuthRefreshAccessTokenRequest =
  | {
      Left: OAuthAccessTokenRequest;
    }
  | {
      Right: OAuthRefreshAccessTokenRequest;
    };
export type OAuthAccessTokenType = 'Bearer';
export type OAuthAccessTokenResponse = {
  /** The access token, which has a relatively short lifetime */
  access_token: string;
  /** The lifetime of the access token in seconds */
  expires_in: number;
  /** The refresh token, which has a relatively long lifetime, and can be used to obtain a new access token */
  refresh_token: string;
  token_type: OAuthAccessTokenType;
};
export type NewOne2OneConv = {
  name?: string;
  /** List of qualified user IDs (excluding the requestor) to be part of this conversation */
  qualified_users?: QualifiedUserId[];
  team?: ConvTeamInfo;
  /** List of user IDs (excluding the requestor) to be part of this conversation (deprecated) */
  users?: Uuid[];
};
export type OwnConversationV3 = {
  access: Access[];
  access_role: AccessRole[];
  add_permission?: AddPermission;
  cells_state?: CellsState;
  cipher_suite: CipherSuiteTag;
  creator?: Uuid;
  /** The epoch number of the corresponding MLS group */
  epoch: number;
  epoch_timestamp: EpochTimestamp;
  group_conv_type?: GroupConvType;
  group_id: GroupId;
  history?: History;
  id?: Uuid;
  last_event?: string;
  last_event_time?: string;
  members: OwnConvMembers;
  /** Per-conversation message timer (can be null) */
  message_timer?: number;
  name?: string;
  parent?: Uuid;
  protocol?: Protocol;
  qualified_id: QualifiedConvId;
  /** Conversation receipt mode */
  receipt_mode?: number;
  team?: Uuid;
  type: ConvType;
};
export type MlsOne2OneConversationSomeKey = {
  conversation: OwnConversationV9;
  public_keys: MlsKeysByPurpose;
};
export type NewPasswordReset = {
  email?: Email;
  /** Email */
  phone?: string;
};
export type CompletePasswordReset = {
  code: Ascii;
  key: Ascii;
  password: string;
};
export type PropertyKeysAndValues = object;
export type PropertyValue = unknown;
export type DeleteProvider = {
  password: string;
};
export type Provider = {
  description: string;
  email: Email;
  id: Uuid;
  name: string;
  url: HttpsUrl;
};
export type UpdateProvider = {
  description?: string;
  name?: string;
  url?: HttpsUrl;
};
export type ProviderActivationResponse = {
  email: Email;
};
export type ProviderLogin = {
  email: Email;
  password: string;
};
export type PasswordChange = {
  new_password: string;
  old_password: string;
};
export type PasswordReset = {
  email: Email;
};
export type NewProvider = {
  description: string;
  email: Email;
  name: string;
  password?: string;
  url: HttpsUrl;
};
export type NewProviderResponse = {
  id: Uuid;
  password?: string;
};
export type ServiceKeyPem = string;
export type ServiceKeyType = 'rsa';
export type ServiceKey = {
  pem: ServiceKeyPem;
  size: number;
  type: ServiceKeyType;
};
export type ServiceTag =
  | 'audio'
  | 'books'
  | 'business'
  | 'design'
  | 'education'
  | 'entertainment'
  | 'finance'
  | 'fitness'
  | 'food-drink'
  | 'games'
  | 'graphics'
  | 'health'
  | 'integration'
  | 'lifestyle'
  | 'media'
  | 'medical'
  | 'movies'
  | 'music'
  | 'news'
  | 'photography'
  | 'poll'
  | 'productivity'
  | 'quiz'
  | 'rating'
  | 'shopping'
  | 'social'
  | 'sports'
  | 'travel'
  | 'tutorial'
  | 'video'
  | 'weather';
export type Service = {
  assets: UserAsset[];
  auth_tokens: Ascii[];
  base_url: HttpsUrl;
  description: string;
  enabled: boolean;
  id: Uuid;
  name: string;
  public_keys: ServiceKey[];
  summary: string;
  tags: ServiceTag[];
};
export type NewService = {
  assets: UserAsset[];
  auth_token?: Ascii;
  base_url: HttpsUrl;
  description: string;
  name: string;
  public_key: ServiceKeyPem;
  summary: string;
  tags: ServiceTag[];
};
export type NewServiceResponse = {
  auth_token?: Ascii;
  id: Uuid;
};
export type DeleteService = {
  password: string;
};
export type UpdateService = {
  assets?: UserAsset[];
  description?: string;
  name?: string;
  summary?: string;
  tags?: ServiceTag[];
};
export type UpdateServiceConn = {
  auth_tokens?: Ascii[];
  base_url?: HttpsUrl;
  enabled?: boolean;
  password: string;
  public_keys?: ServiceKeyPem[];
};
export type ServiceProfile = {
  assets: UserAsset[];
  description: string;
  enabled: boolean;
  id: Uuid;
  name: string;
  provider: Uuid;
  summary: string;
  tags: ServiceTag[];
};
export type Transport = 'GCM' | 'APNS' | 'APNS_SANDBOX' | 'APNS_VOIP' | 'APNS_VOIP_SANDBOX';
export type PushToken = {
  /** Application */
  app: string;
  /** Client ID */
  client: string;
  /** Access Token */
  token: string;
  transport: Transport;
};
export type PushTokenList = {
  /** Push tokens */
  tokens: PushToken[];
};
export type ManagedBy = 'wire' | 'scim';
export type CurrencyAlpha =
  | 'AED'
  | 'AFN'
  | 'ALL'
  | 'AMD'
  | 'ANG'
  | 'AOA'
  | 'ARS'
  | 'AUD'
  | 'AWG'
  | 'AZN'
  | 'BAM'
  | 'BBD'
  | 'BDT'
  | 'BGN'
  | 'BHD'
  | 'BIF'
  | 'BMD'
  | 'BND'
  | 'BOB'
  | 'BOV'
  | 'BRL'
  | 'BSD'
  | 'BTN'
  | 'BWP'
  | 'BYN'
  | 'BZD'
  | 'CAD'
  | 'CDF'
  | 'CHE'
  | 'CHF'
  | 'CHW'
  | 'CLF'
  | 'CLP'
  | 'CNY'
  | 'COP'
  | 'COU'
  | 'CRC'
  | 'CUC'
  | 'CUP'
  | 'CVE'
  | 'CZK'
  | 'DJF'
  | 'DKK'
  | 'DOP'
  | 'DZD'
  | 'EGP'
  | 'ERN'
  | 'ETB'
  | 'EUR'
  | 'FJD'
  | 'FKP'
  | 'GBP'
  | 'GEL'
  | 'GHS'
  | 'GIP'
  | 'GMD'
  | 'GNF'
  | 'GTQ'
  | 'GYD'
  | 'HKD'
  | 'HNL'
  | 'HRK'
  | 'HTG'
  | 'HUF'
  | 'IDR'
  | 'ILS'
  | 'INR'
  | 'IQD'
  | 'IRR'
  | 'ISK'
  | 'JMD'
  | 'JOD'
  | 'JPY'
  | 'KES'
  | 'KGS'
  | 'KHR'
  | 'KMF'
  | 'KPW'
  | 'KRW'
  | 'KWD'
  | 'KYD'
  | 'KZT'
  | 'LAK'
  | 'LBP'
  | 'LKR'
  | 'LRD'
  | 'LSL'
  | 'LYD'
  | 'MAD'
  | 'MDL'
  | 'MGA'
  | 'MKD'
  | 'MMK'
  | 'MNT'
  | 'MOP'
  | 'MRO'
  | 'MUR'
  | 'MVR'
  | 'MWK'
  | 'MXN'
  | 'MXV'
  | 'MYR'
  | 'MZN'
  | 'NAD'
  | 'NGN'
  | 'NIO'
  | 'NOK'
  | 'NPR'
  | 'NZD'
  | 'OMR'
  | 'PAB'
  | 'PEN'
  | 'PGK'
  | 'PHP'
  | 'PKR'
  | 'PLN'
  | 'PYG'
  | 'QAR'
  | 'RON'
  | 'RSD'
  | 'RUB'
  | 'RWF'
  | 'SAR'
  | 'SBD'
  | 'SCR'
  | 'SDG'
  | 'SEK'
  | 'SGD'
  | 'SHP'
  | 'SLL'
  | 'SOS'
  | 'SRD'
  | 'SSP'
  | 'STD'
  | 'SVC'
  | 'SYP'
  | 'SZL'
  | 'THB'
  | 'TJS'
  | 'TMT'
  | 'TND'
  | 'TOP'
  | 'TRY'
  | 'TTD'
  | 'TWD'
  | 'TZS'
  | 'UAH'
  | 'UGX'
  | 'USD'
  | 'USN'
  | 'UYI'
  | 'UYU'
  | 'UZS'
  | 'VEF'
  | 'VND'
  | 'VUV'
  | 'WST'
  | 'XAF'
  | 'XAG'
  | 'XAU'
  | 'XBA'
  | 'XBB'
  | 'XBC'
  | 'XBD'
  | 'XCD'
  | 'XDR'
  | 'XOF'
  | 'XPD'
  | 'XPF'
  | 'XPT'
  | 'XSU'
  | 'XTS'
  | 'XUA'
  | 'XXX'
  | 'YER'
  | 'ZAR'
  | 'ZMW'
  | 'ZWL';
export type Icon = string;
export type BindingNewTeamUser = {
  currency?: CurrencyAlpha;
  icon: Icon;
  /** The decryption key for the team icon S3 asset */
  icon_key?: string;
  /** team name */
  name: string;
};
export type NewUser = {
  accent_id?: number;
  assets?: UserAsset[];
  email?: Email;
  email_code?: Ascii;
  expires_in?: number;
  invitation_code?: Ascii;
  label?: string;
  locale?: Locale;
  managed_by?: ManagedBy;
  name: string;
  password?: string;
  picture?: PictDeprecatedUseAssetsInstead;
  sso_id?: UserSsoId;
  supported_protocols?: BaseProtocol[];
  team?: BindingNewTeamUser;
  team_code?: Ascii;
  team_id?: Uuid;
  uuid?: Uuid;
};
export type AccountStatus = 'active' | 'suspended' | 'deleted' | 'ephemeral' | 'pending-invitation';
export type User = {
  accent_id: number;
  assets?: UserAsset[];
  deleted?: boolean;
  email?: Email;
  email_unvalidated?: Email;
  expires_at?: UtcTimeMillis;
  handle?: Handle;
  id?: Uuid;
  locale: Locale;
  managed_by?: ManagedBy;
  name: string;
  picture?: PictDeprecatedUseAssetsInstead;
  qualified_id: QualifiedUserId;
  searchable?: boolean;
  service?: ServiceRef;
  sso_id?: UserSsoId;
  status: AccountStatus;
  supported_protocols?: BaseProtocol[];
  team?: Uuid;
  text_status?: string;
  type: UserType;
};
export type ScimTokenInfo = {
  created_at: UtcTime;
  description: string;
  id: Uuid;
  idp?: Uuid;
  name: string;
  team: Uuid;
};
export type ScimTokenList = {
  tokens: ScimTokenInfo[];
};
export type CreateScimToken = {
  description: string;
  idp?: Uuid;
  name?: string;
  password?: string;
  verification_code?: Ascii;
};
export type CreateScimTokenResponse = {
  info: ScimTokenInfo;
  token: string;
};
export type ScimTokenName = {
  name: string;
};
export type Contact = {
  accent_id?: number;
  handle?: string;
  id?: Uuid;
  name: string;
  qualified_id: QualifiedUserId;
  team?: Uuid;
  type: UserType;
};
export type PagingState = string;
export type FederatedUserSearchPolicy = 'no_search' | 'exact_handle_search' | 'full_search';
export type SearchResultContact = {
  /** List of contacts found */
  documents: Contact[];
  /** Total number of hits */
  found: number;
  /** Indicates whether there are more results to be fetched */
  has_more?: boolean;
  paging_state?: PagingState;
  /** Total number of hits returned */
  returned: number;
  search_policy: FederatedUserSearchPolicy;
  /** Search time in ms */
  took: number;
};
export type DeleteUser = {
  password?: string;
};
export type DeletionCodeTimeout = {
  expires_in: number;
};
export type UserUpdate = {
  accent_id?: number;
  assets?: UserAsset[];
  name?: string;
  picture?: PictDeprecatedUseAssetsInstead;
  text_status?: string;
};
export type HandleUpdate = {
  handle: string;
};
export type LocaleUpdate = {
  locale: Locale;
};
export type SupportedProtocolUpdate = {
  supported_protocols: BaseProtocol[];
};
export type ServiceProfilePage = {
  has_more: boolean;
  services: ServiceProfile[];
};
export type ServiceTagList = ServiceTag[];
export type GetByEmailReq = {
  email: Email;
};
export type GetByEmailResp = {
  sso_code?: Uuid;
};
export type SsoSettings = {
  default_sso_code?: Uri;
};
export type SystemSettings = {
  /** Whether Nomad client profiles are enabled; null or absence means not enabled. */
  nomadProfiles?: boolean;
  /** Whether MLS is enabled or not */
  setEnableMls: boolean;
  /** Do not allow certain user creation flows */
  setRestrictUserCreation: boolean;
};
export type SystemSettingsPublic = {
  /** Whether Nomad client profiles are enabled; null or absence means not enabled. */
  nomadProfiles?: boolean;
  /** Do not allow certain user creation flows */
  setRestrictUserCreation: boolean;
};
export type AcceptTeamInvitation = {
  code: Ascii;
  /** The user account password. */
  password: string;
};
export type Role = 'owner' | 'admin' | 'member' | 'partner';
export type UriRefAbsolute = string;
export type InvitationUserView = {
  created_at: UtcTimeMillis;
  created_by?: Uuid;
  created_by_email?: Email;
  email: Email;
  id: Uuid;
  /** Name of the invitee (1 - 128 characters) */
  name?: string;
  role?: Role;
  team: Uuid;
  url?: UriRefAbsolute;
};
export type UpdateServiceWhitelist = {
  id: Uuid;
  provider: Uuid;
  whitelisted: boolean;
};
export type DomainRegistrationResponse = {
  authorized_team?: Uuid;
  backend: BackendConfig2;
  dns_verification_token?: Ascii;
  domain: Domain;
  domain_redirect: DomainRedirect20Tag;
  sso_code: Uuid;
  team: Uuid;
  team_invite: TeamInvite20Tag;
};
export type RegisteredDomains = {
  registered_domains: DomainRegistrationResponse[];
};
export type TeamDeleteData = {
  password?: string;
  verification_code?: Ascii;
};
export type TeamBinding = true | false;
export type Team = {
  binding?: TeamBinding;
  creator: Uuid;
  icon: Icon;
  icon_key?: string;
  id: Uuid;
  name: string;
  splash_screen?: Icon;
};
export type TeamUpdateData = {
  icon?: Icon;
  icon_key?: string;
  name?: string;
  splash_screen?: Icon;
};
export type NewApp = {
  accent_id?: number;
  assets?: UserAsset[];
  /** Category name (if uncertain, pick "other") */
  category: string;
  description: string;
  name: string;
  password: string;
};
export type SomeUserToken = string;
export type CreatedApp = {
  cookie: SomeUserToken;
  user: UserProfile;
};
export type PutApp = {
  accent_id?: number;
  assets?: UserAsset[];
  /** Category name (if uncertain, pick "other") */
  category?: string;
  description?: string;
  name?: string;
};
export type RefreshAppCookieResponse = {
  cookie: SomeUserToken;
};
export type ConversationSearchResult = {
  access: Access[];
  admin_count: number;
  id: Uuid;
  member_count: number;
  name?: string;
};
export type ConversationPage = {
  page: ConversationSearchResult[];
};
export type CollaboratorPermission = 'create_team_conversation' | 'implicit_connection';
export type TeamCollaborator = {
  permissions: CollaboratorPermission[];
  team: Uuid;
  user: Uuid;
};
export type NewTeamCollaborator = {
  permissions: CollaboratorPermission[];
  user: Uuid;
};
export type TeamConversation = {
  conversation: Uuid;
  /** This field MUST NOT be used by clients. It is here only for backwards compatibility of the interface. */
  managed: unknown;
};
export type TeamConversationList = {
  conversations: TeamConversation[];
};
export type AppLockConfigFeature = {
  config: AppLockConfig;
  status: FeatureStatus;
  ttl?: number;
};
export type CellsConfigFeature = {
  config: CellsConfig;
  status: FeatureStatus;
  ttl?: number;
};
export type ChannelsConfigFeature = {
  config: ChannelsConfig;
  status: FeatureStatus;
  ttl?: number;
};
export type ConferenceCallingConfigFeature = {
  config?: ConferenceCallingConfig;
  status: FeatureStatus;
  ttl?: number;
};
export type GuestLinksConfigFeature = {
  status: FeatureStatus;
  ttl?: number;
};
export type EnforceFileDownloadLocationFeature = {
  config: EnforceFileDownloadLocation;
  status: FeatureStatus;
  ttl?: number;
};
export type ExposeInvitationUrLsToTeamAdminConfigFeature = {
  status: FeatureStatus;
  ttl?: number;
};
export type FileSharingConfigFeature = {
  status: FeatureStatus;
  ttl?: number;
};
export type LegalholdConfigFeature = {
  status: FeatureStatus;
  ttl?: number;
};
export type MeetingsConfigFeature = {
  status: FeatureStatus;
  ttl?: number;
};
export type MeetingsPremiumConfigFeature = {
  status: FeatureStatus;
  ttl?: number;
};
export type MlsConfigFeature = {
  config: MlsConfig;
  status: FeatureStatus;
  ttl?: number;
};
export type MlsE2EIdConfigFeature = {
  config: MlsE2EIdConfig;
  status: FeatureStatus;
  ttl?: number;
};
export type MlsMigrationFeature = {
  config: MlsMigration;
  status: FeatureStatus;
  ttl?: number;
};
export type OutlookCalIntegrationConfigFeature = {
  status: FeatureStatus;
  ttl?: number;
};
export type SearchVisibilityAvailableConfigFeature = {
  status: FeatureStatus;
  ttl?: number;
};
export type SearchVisibilityInboundConfigFeature = {
  status: FeatureStatus;
  ttl?: number;
};
export type SelfDeletingMessagesConfigFeature = {
  config: SelfDeletingMessagesConfig;
  status: FeatureStatus;
  ttl?: number;
};
export type SndFactorPasswordChallengeConfigFeature = {
  status: FeatureStatus;
  ttl?: number;
};
export type UserIdList = {
  user_ids: Uuid[];
};
export type ListType = true | false;
export type Permissions = {
  /** Permissions that this user is able to grant others */
  copy: number;
  /** Permissions that the user has */
  self: number;
};
export type TeamMember = {
  created_at?: UtcTimeMillis;
  created_by?: Uuid;
  legalhold_status?: UserLegalHoldStatus;
  permissions?: Permissions;
  user: Uuid;
};
export type TeamMemberList = {
  hasMore: ListType;
  /** the array of team members */
  members: TeamMember[];
};
export type Invitation = {
  created_at: UtcTimeMillis;
  created_by?: Uuid;
  email: Email;
  id: Uuid;
  /** Name of the invitee (1 - 128 characters) */
  name?: string;
  role?: Role;
  team: Uuid;
  url?: UriRefAbsolute;
};
export type InvitationList = {
  /** Indicator that the server has more invitations than returned. */
  has_more: boolean;
  invitations: Invitation[];
};
export type InvitationRequest = {
  /** Whether invitations to existing users are allowed. */
  allow_existing?: boolean;
  email: Email;
  locale?: Locale;
  /** Name of the invitee (1 - 128 characters). */
  name?: string;
  role?: Role;
};
export type RemoveLegalHoldSettingsRequest = {
  password?: string;
};
export type Fingerprint = string;
export type ViewLegalHoldServiceInfo = {
  auth_token: Ascii;
  base_url: HttpsUrl;
  fingerprint: Fingerprint;
  public_key: ServiceKeyPem;
  team_id: Uuid;
};
export type LhServiceStatus = 'configured' | 'not_configured' | 'disabled';
export type ViewLegalHoldService = {
  settings?: ViewLegalHoldServiceInfo;
  status: LhServiceStatus;
};
export type NewLegalHoldService = {
  auth_token: Ascii;
  base_url: HttpsUrl;
  public_key: ServiceKeyPem;
};
export type DisableLegalHoldForUserRequest = {
  password?: string;
};
export type Id = {
  /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
  id: string;
};
export type UserLegalHoldStatusResponse = {
  client?: Id;
  last_prekey?: UncheckedPrekeyBundle;
  status: UserLegalHoldStatus;
};
export type ApproveLegalHoldForUserRequest = {
  password?: string;
};
export type TeamMembersPagingState = string;
export type TeamMembersPage = {
  hasMore: boolean;
  members: TeamMember[];
  pagingState: TeamMembersPagingState;
};
export type NewTeamMember = {
  /** the team member to add (the legalhold_status field must be null or missing!) */
  member: {
    created_at?: UtcTimeMillis;
    created_by?: Uuid;
    permissions: Permissions;
    user: Uuid;
  };
};
export type TeamMemberDeleteData = {
  /** The account password to authorise the deletion. */
  password?: string;
};
export type Sso = {
  issuer: string;
  nameid: string;
};
export type TeamContact = {
  accent_id?: number;
  created_at?: UtcTimeMillis;
  email?: Email;
  email_unvalidated?: Email;
  handle?: string;
  id: Uuid;
  managed_by?: ManagedBy;
  name: string;
  role?: Role;
  saml_idp?: string;
  scim_external_id?: string;
  searchable: boolean;
  sso?: Sso;
  team?: Uuid;
  type: UserType;
  /** List of user group ids the user is a member of */
  user_groups: Uuid[];
};
export type SearchResultTeamContact = {
  /** List of contacts found */
  documents: TeamContact[];
  /** Total number of hits */
  found: number;
  /** Indicates whether there are more results to be fetched */
  has_more?: boolean;
  paging_state?: PagingState;
  /** Total number of hits returned */
  returned: number;
  search_policy: FederatedUserSearchPolicy;
  /** Search time in ms */
  took: number;
};
export type TeamSearchVisibility = 'standard' | 'no-name-outside-team';
export type TeamSearchVisibilityView = {
  search_visibility: TeamSearchVisibility;
};
export type TeamSize = {
  /** Team size. */
  teamSize: number;
};
export type ServerTime = {
  time: UtcTime;
};
export type CreateUserTeam = {
  team_id: Uuid;
  team_name: string;
};
export type UserGroupMeta = {
  channels?: QualifiedConvId[];
  channelsCount?: number;
  createdAt: UtcTimeMillis;
  id: Uuid;
  managedBy: ManagedBy;
  membersCount?: number;
  name: string;
};
export type UserGroupPage = {
  page: UserGroupMeta[];
  total: number;
};
export type NewUserGroup = {
  members: Uuid[];
  name: string;
};
export type UserGroup = {
  channels?: QualifiedConvId[];
  channelsCount?: number;
  createdAt: UtcTimeMillis;
  id: Uuid;
  managedBy: ManagedBy;
  members: Uuid[];
  membersCount?: number;
  name: string;
};
export type CheckUserGroupName = {
  name: string;
};
export type UserGroupNameAvailability = {
  name_available: boolean;
};
export type UserGroupUpdate = {
  name: string;
};
export type UpdateUserGroupChannels = {
  channels: Uuid[];
};
export type UserGroupAddUsers = {
  members: Uuid[];
};
export type UpdateUserGroupMembers = {
  members: Uuid[];
};
export type LimitedQualifiedUserIdList500 = {
  qualified_users: QualifiedUserId[];
};
export type UserMapSetPubClient = {
  [key: string]: PubClient[];
};
export type QualifiedUserMapSetPubClient = {
  [key: string]: UserMapSetPubClient;
};
export type QualifiedUserClientPrekeyMapV4 = {
  failed_to_list?: QualifiedUserId[];
  qualified_user_client_prekeys: {
    [key: string]: UserClientPrekeyMap;
  };
};
export type ClientPrekey = {
  /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
  client: string;
  prekey: UncheckedPrekeyBundle;
};
export type PrekeyBundle = {
  clients: ClientPrekey[];
  user: Uuid;
};
export type RichField = {
  type: string;
  value: string;
};
export type RichInfoAssocList = {
  fields: RichField[];
  version: number;
};
export type SetSearchable = {
  set_searchable: boolean;
};
export type VerificationAction = 'create_scim_token' | 'login' | 'delete_team';
export type SendVerificationCode = {
  action: VerificationAction;
  email: Email;
};
/**
 * Obtain an access tokens for a cookie
 */
export function access(
  {
    clientId,
  }: {
    clientId?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: AccessToken;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials';
          message: string;
        };
      }
  >(
    `/access${QS.query(
      QS.explode({
        client_id: clientId,
      }),
    )}`,
    {
      ...opts,
      method: 'POST',
    },
  );
}
/**
 * Log out in order to remove a cookie from the server
 */
export function logout(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials';
          message: string;
        };
      }
  >('/access/logout', {
    ...opts,
    method: 'POST',
  });
}
/**
 * Change your email address
 */
export function changeSelfEmail(
  {
    emailUpdate,
  }: {
    emailUpdate: EmailUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 202;
        data: unknown[];
      }
    | {
        status: 204;
        data: unknown[];
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-email';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials' | 'blacklisted-email';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'key-exists';
          message: string;
        };
      }
  >(
    '/access/self/email',
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: emailUpdate,
    }),
  );
}
/**
 * Activate (i.e. confirm) an email address.
 */
export function getActivate(
  {
    key,
    code,
  }: {
    key: string;
    code: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ActivationResponse;
      }
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-phone' | 'invalid-email';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'invalid-code';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'key-exists';
          message: string;
        };
      }
  >(
    `/activate${QS.query(
      QS.explode({
        key,
        code,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Activate (i.e. confirm) an email address.
 */
export function postActivate(
  {
    activate,
  }: {
    activate: Activate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ActivationResponse;
      }
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-phone' | 'invalid-email';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'invalid-code';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'key-exists';
          message: string;
        };
      }
  >(
    '/activate',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: activate,
    }),
  );
}
/**
 * Send (or resend) an email activation code.
 */
export function postActivateSend(
  {
    sendActivationCode,
  }: {
    sendActivationCode: SendActivationCode;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-email';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'blacklisted-email';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'key-exists';
          message: string;
        };
      }
    | {
        status: 451;
        data: {
          code: 451;
          label: 'domain-blocked-for-registration';
          message: string;
        };
      }
  >(
    '/activate/send',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: sendActivationCode,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-version"]
 *
 *
 */
export function getVersion(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: VersionInfo;
  }>('/api-version', {
    ...opts,
  });
}
/**
 * Upload an asset
 */
export function assetsUpload(
  {
    assetSource,
  }: {
    assetSource?: AssetSource;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: Asset;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'incomplete-body' | 'invalid-length';
          message: string;
        };
      }
    | {
        status: 413;
        data: {
          code: 413;
          label: 'client-error';
          message: string;
        };
      }
  >('/assets', {
    ...opts,
    method: 'POST',
    body: assetSource,
  });
}
/**
 * Delete an asset
 */
export function assetsDelete(
  {
    keyDomain,
    key,
  }: {
    keyDomain: string;
    key: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'unauthorised';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/assets/${encodeURIComponent(keyDomain)}/${encodeURIComponent(key)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Download an asset
 */
export function assetsDownload(
  {
    keyDomain,
    key,
    assetToken,
    assetTokenQuery,
  }: {
    keyDomain: string;
    key: string;
    assetToken?: string;
    assetTokenQuery?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 302;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    `/assets/${encodeURIComponent(keyDomain)}/${encodeURIComponent(key)}${QS.query(
      QS.explode({
        asset_token: assetTokenQuery,
      }),
    )}`,
    {
      ...opts,
      headers: oazapfts.mergeHeaders(opts?.headers, {
        'Asset-Token': assetToken,
      }),
    },
  );
}
/**
 * Delete an asset token
 */
export function tokensDelete(
  {
    key,
  }: {
    key: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(`/assets/${encodeURIComponent(key)}/token`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Renew an asset token
 */
export function tokensRenew(
  {
    key,
  }: {
    key: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: NewAssetToken;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'unauthorised';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/assets/${encodeURIComponent(key)}/token`, {
    ...opts,
    method: 'POST',
  });
}
/**
 * Establish websocket connection
 */
export function awaitNotifications(
  {
    client,
  }: {
    client?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/await${QS.query(
      QS.explode({
        client,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Upload an asset
 */
export function assetsUploadV3Bot(
  {
    assetSource,
  }: {
    assetSource?: AssetSource;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: Asset;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'incomplete-body' | 'invalid-length';
          message: string;
        };
      }
    | {
        status: 413;
        data: {
          code: 413;
          label: 'client-error';
          message: string;
        };
      }
  >('/bot/assets', {
    ...opts,
    method: 'POST',
    body: assetSource,
  });
}
/**
 * Delete an asset
 */
export function assetsDeleteV3Bot(
  {
    key,
  }: {
    key: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'unauthorised';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/bot/assets/${encodeURIComponent(key)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Download an asset
 */
export function assetsDownloadV3Bot(
  {
    key,
    assetToken,
    assetTokenQuery,
  }: {
    key: string;
    assetToken?: string;
    assetTokenQuery?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 302;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    `/bot/assets/${encodeURIComponent(key)}${QS.query(
      QS.explode({
        asset_token: assetTokenQuery,
      }),
    )}`,
    {
      ...opts,
      headers: oazapfts.mergeHeaders(opts?.headers, {
        'Asset-Token': assetToken,
      }),
    },
  );
}
/**
 * Get client for bot
 */
export function botGetClient(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Client;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'client-not-found';
          message: string;
        };
      }
  >('/bot/client', {
    ...opts,
  });
}
/**
 * List prekeys for bot
 */
export function botListPrekeys(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: number[];
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
  >('/bot/client/prekeys', {
    ...opts,
  });
}
/**
 * Update prekeys for bot
 */
export function botUpdatePrekeys(
  {
    updateBotPrekeys,
  }: {
    updateBotPrekeys: UpdateBotPrekeys;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'client-not-found';
          message: string;
        };
      }
  >(
    '/bot/client/prekeys',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: updateBotPrekeys,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-bot-conversation"]
 *
 *
 */
export function getBotConversation(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: BotConvView;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team' | 'no-conversation';
          message: string;
        };
      }
  >('/bot/conversation', {
    ...opts,
  });
}
/**
 * Add bot
 */
export function addBot(
  {
    conv,
    addBot,
  }: {
    conv: string;
    addBot: AddBot;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: AddBotResponse;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'service-disabled' | 'too-many-members' | 'invalid-conversation' | 'access-denied';
          message: string;
        };
      }
  >(
    `/bot/conversations/${encodeURIComponent(conv)}`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: addBot,
    }),
  );
}
/**
 * Remove bot
 */
export function removeBot(
  {
    conv,
    bot,
  }: {
    conv: string;
    bot: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: RemoveBotResponse;
      }
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-conversation' | 'access-denied';
          message: string;
        };
      }
  >(`/bot/conversations/${encodeURIComponent(conv)}/${encodeURIComponent(bot)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "post-bot-message-unqualified"]
 *
 *
 */
export function postBotMessageUnqualified(
  {
    ignoreMissing,
    reportMissing,
    newOtrMessage,
  }: {
    ignoreMissing?: string;
    reportMissing?: string;
    newOtrMessage: NewOtrMessage;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: ClientMismatch;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'unknown-client' | 'missing-legalhold-consent-old-clients' | 'missing-legalhold-consent';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 412;
        data: ClientMismatch;
      }
  >(
    `/bot/messages${QS.query(
      QS.explode({
        ignore_missing: ignoreMissing,
        report_missing: reportMissing,
      }),
    )}`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newOtrMessage,
    }),
  );
}
/**
 * Delete self
 */
export function botDeleteSelf(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-bot' | 'access-denied';
          message: string;
        };
      }
  >('/bot/self', {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Get self
 */
export function botGetSelf(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: UserProfile;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >('/bot/self', {
    ...opts,
  });
}
/**
 * List users
 */
export function botListUsers(
  {
    ids,
  }: {
    ids: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: BotUserView[];
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
  >(
    `/bot/users${QS.query(
      QS.explode({
        ids,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Claim users prekeys
 */
export function botClaimUsersPrekeys(
  {
    userClients,
  }: {
    userClients: UserClients;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: UserClientPrekeyMap;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'missing-legalhold-consent'
            | 'missing-legalhold-consent-old-clients'
            | 'too-many-clients'
            | 'access-denied';
          message: string;
        };
      }
  >(
    '/bot/users/prekeys',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: userClients,
    }),
  );
}
/**
 * Get user clients
 */
export function botGetUserClients(
  {
    user,
  }: {
    user: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: PubClient[];
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
  >(`/bot/users/${encodeURIComponent(user)}/clients`, {
    ...opts,
  });
}
/**
 * Broadcast an encrypted message to all team members and all contacts (accepts JSON or Protobuf)
 */
export function postOtrBroadcastUnqualified(
  {
    ignoreMissing,
    reportMissing,
    newOtrMessage,
  }: {
    ignoreMissing?: string;
    reportMissing?: string;
    newOtrMessage: NewOtrMessage;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: ClientMismatch;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'too-many-users-to-broadcast';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'unknown-client' | 'missing-legalhold-consent-old-clients' | 'missing-legalhold-consent';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 412;
        data: ClientMismatch;
      }
  >(
    `/broadcast/otr/messages${QS.query(
      QS.explode({
        ignore_missing: ignoreMissing,
        report_missing: reportMissing,
      }),
    )}`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newOtrMessage,
    }),
  );
}
/**
 * Post an encrypted message to all team members and all contacts (accepts only Protobuf)
 */
export function postProteusBroadcast(
  {
    qualifiedNewOtrMessage,
  }: {
    qualifiedNewOtrMessage: QualifiedNewOtrMessage;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: MessageSendingStatus;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'too-many-users-to-broadcast';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'unknown-client' | 'missing-legalhold-consent-old-clients' | 'missing-legalhold-consent';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 412;
        data: MessageSendingStatus;
      }
  >('/broadcast/proteus/messages', {
    ...opts,
    method: 'POST',
    body: qualifiedNewOtrMessage,
  });
}
/**
 * Retrieve all TURN server addresses and credentials. Clients are expected to do a DNS lookup to resolve the IP addresses of the given hostnames
 */
export function getCallsConfigV2(
  {
    limit,
  }: {
    limit?: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: RtcConfiguration;
  }>(
    `/calls/config/v2${QS.query(
      QS.explode({
        limit,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * List the registered clients
 */
export function listClients(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: Client[];
  }>('/clients', {
    ...opts,
  });
}
/**
 * Register a new client
 */
export function addClient(
  {
    newClient,
  }: {
    newClient: NewClient;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: Client;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'bad-request';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'code-authentication-required' | 'code-authentication-failed' | 'missing-auth' | 'too-many-clients';
          message: string;
        };
      }
  >(
    '/clients',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newClient,
    }),
  );
}
/**
 * Create a JWT DPoP access token
 */
export function createAccessToken(
  {
    cid,
    dPoP,
  }: {
    cid: string;
    dPoP: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: DPoPAccessTokenResponse;
  }>(`/clients/${encodeURIComponent(cid)}/access-token`, {
    ...opts,
    method: 'POST',
    headers: oazapfts.mergeHeaders(opts?.headers, {
      DPoP: dPoP,
    }),
  });
}
/**
 * Delete an existing client
 */
export function deleteClient(
  {
    client,
    deleteClient,
  }: {
    client: string;
    deleteClient: DeleteClient;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/clients/${encodeURIComponent(client)}`,
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: deleteClient,
    }),
  );
}
/**
 * Get a registered client by ID
 */
export function getClient(
  {
    client,
  }: {
    client: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Client;
      }
    | {
        status: 404;
      }
  >(`/clients/${encodeURIComponent(client)}`, {
    ...opts,
  });
}
/**
 * Update a registered client
 */
export function updateClient(
  {
    client,
    updateClient,
  }: {
    client: string;
    updateClient: UpdateClient;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-duplicate-public-key' | 'bad-request';
          message: string;
        };
      }
  >(
    `/clients/${encodeURIComponent(client)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: updateClient,
    }),
  );
}
/**
 * Read back what the client has been posting about itself
 */
export function getClientCapabilities(
  {
    client,
  }: {
    client: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: ClientCapabilityList;
  }>(`/clients/${encodeURIComponent(client)}/capabilities`, {
    ...opts,
  });
}
/**
 * Get a new nonce for a client CSR
 */
export function getNonce(
  {
    client,
  }: {
    client: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(`/clients/${encodeURIComponent(client)}/nonce`, {
    ...opts,
  });
}
/**
 * Get a new nonce for a client CSR
 */
export function headNonce(
  {
    client,
  }: {
    client: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(`/clients/${encodeURIComponent(client)}/nonce`, {
    ...opts,
    method: 'HEAD',
  });
}
/**
 * List the remaining prekey IDs of a client
 */
export function getClientPrekeys(
  {
    client,
  }: {
    client: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: number[];
  }>(`/clients/${encodeURIComponent(client)}/prekeys`, {
    ...opts,
  });
}
/**
 * Get an existing connection to another user (local or remote)
 */
export function getConnection(
  {
    uidDomain,
    uid,
  }: {
    uidDomain: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: UserConnection;
      }
    | {
        status: 404;
      }
  >(`/connections/${encodeURIComponent(uidDomain)}/${encodeURIComponent(uid)}`, {
    ...opts,
  });
}
/**
 * Create a connection to another user
 */
export function createConnection(
  {
    uidDomain,
    uid,
  }: {
    uidDomain: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: UserConnection;
      }
    | {
        status: 201;
        data: UserConnection;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-user';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'no-identity'
            | 'connection-limit'
            | 'missing-legalhold-consent'
            | 'missing-legalhold-consent-old-clients';
          message: string;
        };
      }
  >(`/connections/${encodeURIComponent(uidDomain)}/${encodeURIComponent(uid)}`, {
    ...opts,
    method: 'POST',
  });
}
/**
 * Update a connection to another user
 */
export function updateConnection(
  {
    uidDomain,
    uid,
    connectionUpdate,
  }: {
    uidDomain: string;
    uid: string;
    connectionUpdate: ConnectionUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: UserConnection;
      }
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-user';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'no-identity'
            | 'bad-conn-update'
            | 'not-connected'
            | 'connection-limit'
            | 'missing-legalhold-consent'
            | 'missing-legalhold-consent-old-clients';
          message: string;
        };
      }
  >(
    `/connections/${encodeURIComponent(uidDomain)}/${encodeURIComponent(uid)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: connectionUpdate,
    }),
  );
}
/**
 * Create a new conversation
 */
export function createGroupConversation(
  {
    newConv,
  }: {
    newConv: NewConv;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: CreateGroupConversation;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'history-not-supported' | 'mls-not-enabled' | 'non-empty-member-list';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'channels-not-enabled'
            | 'not-mls-conversation'
            | 'missing-legalhold-consent'
            | 'operation-denied'
            | 'no-team-member'
            | 'not-connected'
            | 'access-denied';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          non_federating_backends: Domain[];
        };
      }
    | {
        status: 533;
        data: {
          unreachable_backends: Domain[];
        };
      }
  >(
    '/conversations',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newConv,
    }),
  );
}
/**
 * Check validity of a conversation code.
 */
export function codeCheck(
  {
    xForwardedFor,
    conversationCode,
  }: {
    xForwardedFor: string;
    conversationCode: ConversationCode;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-conversation-password';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation' | 'no-conversation-code';
          message: string;
        };
      }
  >(
    '/conversations/code-check',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: conversationCode,
      headers: oazapfts.mergeHeaders(opts?.headers, {
        'X-Forwarded-For': xForwardedFor,
      }),
    }),
  );
}
/**
 * Get limited conversation information by key/code pair
 */
export function getConversationByReusableCode(
  {
    key,
    code,
  }: {
    key: string;
    code: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ConversationCoverView;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'access-denied' | 'invalid-conversation-password';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation' | 'no-conversation-code';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'guest-links-disabled';
          message: string;
        };
      }
  >(
    `/conversations/join${QS.query(
      QS.explode({
        key,
        code,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Join a conversation using a reusable code
 */
export function joinConversationByCodeUnqualified(
  {
    joinConversationByCode,
  }: {
    joinConversationByCode: JoinConversationByCode;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'too-many-members'
            | 'no-team-member'
            | 'invalid-op'
            | 'access-denied'
            | 'invalid-conversation-password';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation' | 'no-conversation-code';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'guest-links-disabled';
          message: string;
        };
      }
  >(
    '/conversations/join',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: joinConversationByCode,
    }),
  );
}
/**
 * Get conversation metadata for a list of conversation ids
 */
export function listConversations(
  {
    listConversations,
  }: {
    listConversations: ListConversations;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: ConversationsResponse;
  }>(
    '/conversations/list',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: listConversations,
    }),
  );
}
/**
 * Get all conversation IDs.
 */
export function listConversationIds(
  {
    getPaginatedConversationIds,
  }: {
    getPaginatedConversationIds: GetPaginatedConversationIds;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: ConversationIdsPage;
  }>(
    '/conversations/list-ids',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: getPaginatedConversationIds,
    }),
  );
}
/**
 * Get the user's MLS self-conversation
 */
export function getMlsSelfConversation(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: OwnConversationV9;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-not-enabled';
          message: string;
        };
      }
  >('/conversations/mls-self', {
    ...opts,
  });
}
/**
 * Create a self-conversation
 */
export function createSelfConversation(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: OwnConversationV6;
      }
    | {
        status: 201;
        data: OwnConversationV6;
      }
  >('/conversations/self', {
    ...opts,
    method: 'POST',
  });
}
/**
 * Get a conversation by ID
 */
export function getConversation(
  {
    cnvDomain,
    cnv,
  }: {
    cnvDomain: string;
    cnv: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Conversation;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(`/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}`, {
    ...opts,
  });
}
/**
 * Update access modes for a conversation
 */
export function updateConversationAccess(
  {
    cnvDomain,
    cnv,
    conversationAccessData,
  }: {
    cnvDomain: string;
    cnv: string;
    conversationAccessData: ConversationAccessData;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-op' | 'access-denied' | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/access`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: conversationAccessData,
    }),
  );
}
/**
 * Update the permissions for adding members to a channel
 */
export function updateChannelAddPermission(
  {
    cnvDomain,
    cnv,
    addPermissionUpdate,
  }: {
    cnvDomain: string;
    cnv: string;
    addPermissionUpdate: AddPermissionUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'invalid-op'
            | 'not-connected'
            | 'operation-denied'
            | 'no-team-member'
            | 'access-denied'
            | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team' | 'no-conversation';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          non_federating_backends: Domain[];
        };
      }
    | {
        status: 533;
        data: {
          unreachable_backends: Domain[];
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/add-permission`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: addPermissionUpdate,
    }),
  );
}
/**
 * Get MLS group information
 */
export function getGroupInfo(
  {
    cnvDomain,
    cnv,
  }: {
    cnvDomain: string;
    cnv: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: GroupInfoData;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-not-enabled';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'mls-missing-group-info' | 'no-conversation';
          message: string;
        };
      }
  >(`/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/groupinfo`, {
    ...opts,
  });
}
/**
 * Update history settings of a conversation
 */
export function updateConversationHistory(
  {
    cnvDomain,
    cnv,
    conversationHistoryUpdate,
  }: {
    cnvDomain: string;
    cnv: string;
    conversationHistoryUpdate: ConversationHistoryUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'history-not-supported';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'action-denied' | 'invalid-op' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/history`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: conversationHistoryUpdate,
    }),
  );
}
/**
 * Add qualified members to an existing conversation.
 */
export function addMembersToConversation(
  {
    cnvDomain,
    cnv,
    inviteQualified,
  }: {
    cnvDomain: string;
    cnv: string;
    inviteQualified: InviteQualified;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-group-id-not-supported';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'missing-legalhold-consent'
            | 'not-connected'
            | 'no-team-member'
            | 'access-denied'
            | 'too-many-members'
            | 'invalid-op'
            | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          non_federating_backends: Domain[];
        };
      }
    | {
        status: 533;
        data: {
          unreachable_backends: Domain[];
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/members`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: inviteQualified,
    }),
  );
}
/**
 * Replace the members of a conversation.
 */
export function replaceMembersInConversation(
  {
    cnvDomain,
    cnv,
    inviteQualified,
  }: {
    cnvDomain: string;
    cnv: string;
    inviteQualified: InviteQualified;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-group-id-not-supported';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'missing-legalhold-consent'
            | 'not-connected'
            | 'no-team-member'
            | 'access-denied'
            | 'too-many-members'
            | 'invalid-op'
            | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          non_federating_backends: Domain[];
        };
      }
    | {
        status: 533;
        data: {
          unreachable_backends: Domain[];
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/members`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: inviteQualified,
    }),
  );
}
/**
 * Remove a member from a conversation
 */
export function removeMember(
  {
    cnvDomain,
    cnv,
    usrDomain,
    usr,
  }: {
    cnvDomain: string;
    cnv: string;
    usrDomain: string;
    usr: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-op' | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/members/${encodeURIComponent(
      usrDomain,
    )}/${encodeURIComponent(usr)}`,
    {
      ...opts,
      method: 'DELETE',
    },
  );
}
/**
 * Update membership of the specified user
 */
export function updateOtherMember(
  {
    cnvDomain,
    cnv,
    usrDomain,
    usr,
    otherMemberUpdate,
  }: {
    cnvDomain: string;
    cnv: string;
    usrDomain: string;
    usr: string;
    otherMemberUpdate: OtherMemberUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-op' | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation-member' | 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/members/${encodeURIComponent(
      usrDomain,
    )}/${encodeURIComponent(usr)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: otherMemberUpdate,
    }),
  );
}
/**
 * Update the message timer for a conversation
 */
export function updateConversationMessageTimer(
  {
    cnvDomain,
    cnv,
    conversationMessageTimerUpdate,
  }: {
    cnvDomain: string;
    cnv: string;
    conversationMessageTimerUpdate: ConversationMessageTimerUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-op' | 'access-denied' | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/message-timer`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: conversationMessageTimerUpdate,
    }),
  );
}
/**
 * Update conversation name
 */
export function updateConversationName(
  {
    cnvDomain,
    cnv,
    conversationRename,
  }: {
    cnvDomain: string;
    cnv: string;
    conversationRename: ConversationRename;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-op' | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/name`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: conversationRename,
    }),
  );
}
/**
 * Post an encrypted message to a conversation (accepts only Protobuf)
 */
export function postProteusMessage(
  {
    cnvDomain,
    cnv,
    qualifiedNewOtrMessage,
  }: {
    cnvDomain: string;
    cnv: string;
    qualifiedNewOtrMessage: QualifiedNewOtrMessage;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: MessageSendingStatus;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'unknown-client' | 'missing-legalhold-consent-old-clients' | 'missing-legalhold-consent';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 412;
        data: MessageSendingStatus;
      }
  >(`/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/proteus/messages`, {
    ...opts,
    method: 'POST',
    body: qualifiedNewOtrMessage,
  });
}
/**
 * Update the protocol of the conversation
 */
export function updateConversationProtocol(
  {
    cnvDomain,
    cnv,
    protocolUpdate,
  }: {
    cnvDomain: string;
    cnv: string;
    protocolUpdate: ProtocolUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-migration-criteria-not-satisfied';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-denied' | 'no-team-member' | 'invalid-op' | 'action-denied' | 'invalid-protocol-transition';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team' | 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/protocol`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: protocolUpdate,
    }),
  );
}
/**
 * Update receipt mode for a conversation
 */
export function updateConversationReceiptMode(
  {
    cnvDomain,
    cnv,
    conversationReceiptModeUpdate,
  }: {
    cnvDomain: string;
    cnv: string;
    conversationReceiptModeUpdate: ConversationReceiptModeUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'mls-receipts-not-allowed' | 'invalid-op' | 'access-denied' | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/receipt-mode`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: conversationReceiptModeUpdate,
    }),
  );
}
/**
 * Get self membership properties
 */
export function getConversationSelf(
  {
    cnvDomain,
    cnv,
  }: {
    cnvDomain: string;
    cnv: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Member;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(`/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/self`, {
    ...opts,
  });
}
/**
 * Update self membership properties
 */
export function updateConversationSelf(
  {
    cnvDomain,
    cnv,
    memberUpdate,
  }: {
    cnvDomain: string;
    cnv: string;
    memberUpdate: MemberUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/self`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: memberUpdate,
    }),
  );
}
/**
 * Delete an MLS subconversation
 */
export function deleteSubconversation(
  {
    cnvDomain,
    cnv,
    subconv,
    mlsReset,
  }: {
    cnvDomain: string;
    cnv: string;
    subconv: string;
    mlsReset: MlsReset;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: unknown[];
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-not-enabled';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'mls-stale-message';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/subconversations/${encodeURIComponent(
      subconv,
    )}`,
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: mlsReset,
    }),
  );
}
/**
 * Get information about an MLS subconversation
 */
export function getSubconversation(
  {
    cnvDomain,
    cnv,
    subconv,
  }: {
    cnvDomain: string;
    cnv: string;
    subconv: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: PublicSubConversation;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'mls-subconv-unsupported-convtype' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/subconversations/${encodeURIComponent(
      subconv,
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Get MLS group information of subconversation
 */
export function getSubconversationGroupInfo(
  {
    cnvDomain,
    cnv,
    subconv,
  }: {
    cnvDomain: string;
    cnv: string;
    subconv: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: GroupInfoData;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-not-enabled';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'mls-missing-group-info' | 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/subconversations/${encodeURIComponent(
      subconv,
    )}/groupinfo`,
    {
      ...opts,
    },
  );
}
/**
 * Leave an MLS subconversation
 */
export function leaveSubconversation(
  {
    cnvDomain,
    cnv,
    subconv,
  }: {
    cnvDomain: string;
    cnv: string;
    subconv: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-not-enabled' | 'mls-protocol-error';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'mls-stale-message';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/subconversations/${encodeURIComponent(
      subconv,
    )}/self`,
    {
      ...opts,
      method: 'DELETE',
    },
  );
}
/**
 * Sending typing notifications
 */
export function memberTypingQualified(
  {
    cnvDomain,
    cnv,
    typingData,
  }: {
    cnvDomain: string;
    cnv: string;
    typingData: TypingData;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/typing`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: typingData,
    }),
  );
}
/**
 * Delete conversation code
 */
export function removeCodeUnqualified(
  {
    cnv,
  }: {
    cnv: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Event;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(`/conversations/${encodeURIComponent(cnv)}/code`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Get existing conversation code
 */
export function getCode(
  {
    cnv,
  }: {
    cnv: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ConversationCodeInfo;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation' | 'no-conversation-code';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'guest-links-disabled';
          message: string;
        };
      }
  >(`/conversations/${encodeURIComponent(cnv)}/code`, {
    ...opts,
  });
}
/**
 * Create or recreate a conversation code
 */
export function createConversationCodeUnqualified(
  {
    cnv,
    createConversationCodeRequest,
  }: {
    cnv: string;
    createConversationCodeRequest: CreateConversationCodeRequest;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ConversationCodeInfo;
      }
    | {
        status: 201;
        data: Event;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'create-conv-code-conflict' | 'guest-links-disabled';
          message: string;
        };
      }
  >(
    `/conversations/${encodeURIComponent(cnv)}/code`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: createConversationCodeRequest,
    }),
  );
}
/**
 * Get the status of the guest links feature for a conversation that potentially has been created by someone from another team.
 */
export function getConversationGuestLinksStatus(
  {
    cnv,
  }: {
    cnv: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: GuestLinksConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(`/conversations/${encodeURIComponent(cnv)}/features/conversationGuestLinks`, {
    ...opts,
  });
}
/**
 * Post an encrypted message to a conversation (accepts JSON or Protobuf)
 */
export function postOtrMessageUnqualified(
  {
    cnv,
    ignoreMissing,
    reportMissing,
    newOtrMessage,
  }: {
    cnv: string;
    ignoreMissing?: string;
    reportMissing?: string;
    newOtrMessage: NewOtrMessage;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: ClientMismatch;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'unknown-client' | 'missing-legalhold-consent-old-clients' | 'missing-legalhold-consent';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 412;
        data: ClientMismatch;
      }
  >(
    `/conversations/${encodeURIComponent(cnv)}/otr/messages${QS.query(
      QS.explode({
        ignore_missing: ignoreMissing,
        report_missing: reportMissing,
      }),
    )}`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newOtrMessage,
    }),
  );
}
/**
 * Get existing roles available for the given conversation
 */
export function getConversationRoles(
  {
    cnv,
  }: {
    cnv: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ConversationRolesList;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(`/conversations/${encodeURIComponent(cnv)}/roles`, {
    ...opts,
  });
}
/**
 * Retrieve the list of cookies currently stored for the user
 */
export function listCookies(
  {
    labels,
  }: {
    labels?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: CookieList;
  }>(
    `/cookies${QS.query(
      QS.explode({
        labels,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Revoke stored cookies
 */
export function removeCookies(
  {
    removeCookies,
  }: {
    removeCookies: RemoveCookies;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials';
          message: string;
        };
      }
  >(
    '/cookies/remove',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: removeCookies,
    }),
  );
}
/**
 * Shows information about custom backends related to a given email domain
 */
export function getCustomBackendByDomain(
  {
    domain,
  }: {
    domain: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: CustomBackend;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'custom-backend-not-found';
          message: string;
        };
      }
  >(`/custom-backend/by-domain/${encodeURIComponent(domain)}`, {
    ...opts,
  });
}
/**
 * Verify account deletion with a code.
 */
export function verifyDelete(
  {
    verifyDeleteUser,
  }: {
    verifyDeleteUser: VerifyDeleteUser;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-code';
          message: string;
        };
      }
  >(
    '/delete',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: verifyDeleteUser,
    }),
  );
}
/**
 * Authorize a team to operate on a verified domain
 */
export function domainVerificationAuthorizeTeam(
  {
    domain,
    domainOwnershipToken,
  }: {
    domain: string;
    domainOwnershipToken: DomainOwnershipToken;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 401;
        data: {
          code: 401;
          label: 'domain-registration-update-auth-failure';
          message: string;
        };
      }
    | {
        status: 402;
        data: {
          code: 402;
          label: 'domain-registration-update-payment-required';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-forbidden-for-domain-registration-state';
          message: string;
        };
      }
  >(
    `/domain-verification/${encodeURIComponent(domain)}/authorize-team`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: domainOwnershipToken,
    }),
  );
}
/**
 * Update the domain redirect configuration
 */
export function updateDomainRedirect(
  {
    authorization,
    domain,
    domainRedirectConfig,
  }: {
    authorization: string;
    domain: string;
    domainRedirectConfig: DomainRedirectConfig;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 401;
        data: {
          code: 401;
          label: 'domain-registration-update-auth-failure';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-forbidden-for-domain-registration-state';
          message: string;
        };
      }
  >(
    `/domain-verification/${encodeURIComponent(domain)}/backend`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: domainRedirectConfig,
      headers: oazapfts.mergeHeaders(opts?.headers, {
        Authorization: authorization,
      }),
    }),
  );
}
/**
 * Get a DNS verification challenge
 */
export function domainVerificationChallenge(
  {
    domain,
  }: {
    domain: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: DomainVerificationChallenge;
  }>(`/domain-verification/${encodeURIComponent(domain)}/challenges`, {
    ...opts,
    method: 'POST',
  });
}
/**
 * Verify a DNS verification challenge
 */
export function verifyChallenge(
  {
    domain,
    challengeId,
    challengeToken,
  }: {
    domain: string;
    challengeId: string;
    challengeToken: ChallengeToken;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: DomainOwnershipToken;
      }
    | {
        status: 401;
        data: {
          code: 401;
          label: 'domain-registration-update-auth-failure';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'domain-verification-failed';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'challenge-not-found';
          message: string;
        };
      }
  >(
    `/domain-verification/${encodeURIComponent(domain)}/challenges/${encodeURIComponent(challengeId)}`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: challengeToken,
    }),
  );
}
/**
 * Update the team-invite configuration
 */
export function updateTeamInvite(
  {
    domain,
    teamInviteConfig,
  }: {
    domain: string;
    teamInviteConfig: TeamInviteConfig;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 402;
        data: {
          code: 402;
          label: 'domain-registration-update-payment-required';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-forbidden-for-domain-registration-state';
          message: string;
        };
      }
  >(
    `/domain-verification/${encodeURIComponent(domain)}/team`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: teamInviteConfig,
    }),
  );
}
/**
 * Verify a DNS verification challenge for a team
 */
export function verifyChallengeTeam(
  {
    domain,
    challengeId,
    challengeToken,
  }: {
    domain: string;
    challengeId: string;
    challengeToken: ChallengeToken;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: DomainOwnershipToken;
      }
    | {
        status: 401;
        data: {
          code: 401;
          label: 'domain-registration-update-auth-failure';
          message: string;
        };
      }
    | {
        status: 402;
        data: {
          code: 402;
          label: 'domain-registration-update-payment-required';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-forbidden-for-domain-registration-state';
          message: string;
        };
      }
  >(
    `/domain-verification/${encodeURIComponent(domain)}/team/challenges/${encodeURIComponent(challengeId)}`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: challengeToken,
    }),
  );
}
/**
 * Consume events over a websocket connection
 */
export function consumeEvents(
  {
    client,
    syncMarker,
  }: {
    client?: string;
    syncMarker?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/events${QS.query(
      QS.explode({
        client,
        sync_marker: syncMarker,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Gets feature configs for a user
 */
export function getAllFeatureConfigsForUser(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: AllTeamFeatures;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-denied' | 'no-team-member';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >('/feature-configs', {
    ...opts,
  });
}
/**
 * Get domain registration configuration by email
 */
export function getDomainRegistration(
  {
    getDomainRegistrationRequest,
  }: {
    getDomainRegistrationRequest: GetDomainRegistrationRequest;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: DomainRedirectResponseV10;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-domain';
          message: string;
        };
      }
  >(
    '/get-domain-registration',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: getDomainRegistrationRequest,
    }),
  );
}
/**
 * Check availability of user handles
 */
export function checkUserHandles(
  {
    checkHandles,
  }: {
    checkHandles: CheckHandles;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: Handle[];
  }>(
    '/handles',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: checkHandles,
    }),
  );
}
/**
 * Check whether a user handle can be taken
 */
export function checkUserHandle(
  {
    handle,
  }: {
    handle: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: unknown[];
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-handle';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/handles/${encodeURIComponent(handle)}`, {
    ...opts,
    method: 'HEAD',
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "idp-get-all"]
 *
 *
 */
export function idpGetAll(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: IdPList;
  }>('/identity-providers', {
    ...opts,
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "idp-create"]
 *
 *
 */
export function idpCreate(
  {
    replaces,
    apiVersion,
    handle,
    idPMetadataInfo,
  }: {
    replaces?: string;
    apiVersion?: 'v1' | 'v2';
    handle?: string;
    idPMetadataInfo: IdPMetadataInfo;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 201;
    data: IdPConfig;
  }>(
    `/identity-providers${QS.query(
      QS.explode({
        replaces,
        api_version: apiVersion,
        handle,
      }),
    )}`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: idPMetadataInfo,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "idp-delete"]
 *
 *
 */
export function idpDelete(
  {
    id,
    purge,
  }: {
    id: string;
    purge?: boolean;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/identity-providers/${encodeURIComponent(id)}${QS.query(
      QS.explode({
        purge,
      }),
    )}`,
    {
      ...opts,
      method: 'DELETE',
    },
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "idp-get"]
 *
 *
 */
export function idpGet(
  {
    id,
  }: {
    id: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: IdPConfig;
  }>(`/identity-providers/${encodeURIComponent(id)}`, {
    ...opts,
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "idp-update"]
 *
 *
 */
export function idpUpdate(
  {
    id,
    handle,
    idPMetadataInfo,
  }: {
    id: string;
    handle?: string;
    idPMetadataInfo: IdPMetadataInfo;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: IdPConfig;
  }>(
    `/identity-providers/${encodeURIComponent(id)}${QS.query(
      QS.explode({
        handle,
      }),
    )}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: idPMetadataInfo,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "idp-get-raw"]
 *
 *
 */
export function idpGetRaw(
  {
    id,
  }: {
    id: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchBlob<{
    status: 200;
    data: string;
  }>(`/identity-providers/${encodeURIComponent(id)}/raw`, {
    ...opts,
  });
}
/**
 * List the connections to other users, including remote users
 */
export function listConnections(
  {
    getPaginatedConnections,
  }: {
    getPaginatedConnections: GetPaginatedConnections;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: ConnectionsPage;
  }>(
    '/list-connections',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: getPaginatedConnections,
    }),
  );
}
/**
 * List users
 */
export function listUsersByIdsOrHandles(
  {
    listUsersQuery,
  }: {
    listUsersQuery: ListUsersQuery;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: ListUsersById;
  }>(
    '/list-users',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: listUsersQuery,
    }),
  );
}
/**
 * Authenticate a user to obtain a cookie and first access token
 */
export function login(
  {
    persist,
    login,
  }: {
    persist?: boolean;
    login: Login;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: AccessToken;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'code-authentication-required'
            | 'code-authentication-failed'
            | 'pending-activation'
            | 'suspended'
            | 'invalid-credentials';
          message: string;
        };
      }
  >(
    `/login${QS.query(
      QS.explode({
        persist,
      }),
    )}`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: login,
    }),
  );
}
/**
 * Create a new meeting
 */
export function createMeeting(
  {
    newMeeting,
  }: {
    newMeeting: NewMeeting;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: Meeting;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-op';
          message: string;
        };
      }
    | {
        status: 533;
        data: {
          unreachable_backends: Domain[];
        };
      }
  >(
    '/meetings',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newMeeting,
    }),
  );
}
/**
 * Get a single meeting by ID
 */
export function getMeeting(
  {
    domain,
    id,
  }: {
    domain: string;
    id: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Meeting;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'meeting-not-found';
          message: string;
        };
      }
  >(`/meetings/${encodeURIComponent(domain)}/${encodeURIComponent(id)}`, {
    ...opts,
  });
}
/**
 * Update an existing meeting
 */
export function updateMeeting(
  {
    domain,
    id,
    updateMeeting,
  }: {
    domain: string;
    id: string;
    updateMeeting: UpdateMeeting;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Meeting;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-op' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'meeting-not-found';
          message: string;
        };
      }
  >(
    `/meetings/${encodeURIComponent(domain)}/${encodeURIComponent(id)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: updateMeeting,
    }),
  );
}
/**
 * Post a MLS CommitBundle
 */
export function mlsCommitBundle(
  {
    commitBundle,
  }: {
    commitBundle: CommitBundle;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: MlsMessageSendingStatus;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label:
            | 'mls-invalid-leaf-node-signature'
            | 'mls-group-id-not-supported'
            | 'mls-welcome-mismatch'
            | 'mls-self-removal-not-allowed'
            | 'mls-protocol-error'
            | 'mls-not-enabled'
            | 'mls-invalid-leaf-node-index'
            | 'mls-group-conversation-mismatch'
            | 'mls-commit-missing-references'
            | 'mls-client-sender-user-mismatch';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'mls-identity-mismatch'
            | 'mls-subconv-join-parent-missing'
            | 'missing-legalhold-consent'
            | 'legalhold-not-enabled'
            | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'mls-proposal-not-found' | 'no-conversation' | 'no-conversation-member';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          missing_users: QualifiedUserId[];
        };
      }
    | {
        status: 422;
        data: {
          code: 422;
          label: 'mls-unsupported-proposal' | 'mls-unsupported-message';
          message: string;
        };
      }
    | {
        status: 533;
        data: {
          unreachable_backends: Domain[];
        };
      }
  >('/mls/commit-bundles', {
    ...opts,
    method: 'POST',
    body: commitBundle,
  });
}
/**
 * Claim one key package for each client of the given user
 */
export function mlsKeyPackagesClaim(
  {
    userDomain,
    user,
    ciphersuite,
  }: {
    userDomain: string;
    user: string;
    ciphersuite: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: KeyPackageBundle;
  }>(
    `/mls/key-packages/claim/${encodeURIComponent(userDomain)}/${encodeURIComponent(user)}${QS.query(
      QS.explode({
        ciphersuite,
      }),
    )}`,
    {
      ...opts,
      method: 'POST',
    },
  );
}
/**
 * Delete all key packages for a given ciphersuite and client
 */
export function mlsKeyPackagesDelete(
  {
    client,
    ciphersuite,
    deleteKeyPackages,
  }: {
    client: string;
    ciphersuite: number;
    deleteKeyPackages: DeleteKeyPackages;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/mls/key-packages/self/${encodeURIComponent(client)}${QS.query(
      QS.explode({
        ciphersuite,
      }),
    )}`,
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: deleteKeyPackages,
    }),
  );
}
/**
 * Upload a fresh batch of key packages
 */
export function mlsKeyPackagesUpload(
  {
    client,
    keyPackageUpload,
  }: {
    client: string;
    keyPackageUpload: KeyPackageUpload;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-protocol-error';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'mls-identity-mismatch';
          message: string;
        };
      }
  >(
    `/mls/key-packages/self/${encodeURIComponent(client)}`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: keyPackageUpload,
    }),
  );
}
/**
 * Upload a fresh batch of key packages and replace the old ones
 */
export function mlsKeyPackagesReplace(
  {
    client,
    ciphersuites,
    keyPackageUpload,
  }: {
    client: string;
    ciphersuites: string;
    keyPackageUpload: KeyPackageUpload;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-protocol-error';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'mls-identity-mismatch';
          message: string;
        };
      }
  >(
    `/mls/key-packages/self/${encodeURIComponent(client)}${QS.query(
      QS.explode({
        ciphersuites,
      }),
    )}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: keyPackageUpload,
    }),
  );
}
/**
 * Return the number of unclaimed key packages for a given ciphersuite and client
 */
export function mlsKeyPackagesCount(
  {
    client,
    ciphersuite,
  }: {
    client: string;
    ciphersuite: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: OwnKeyPackages;
  }>(
    `/mls/key-packages/self/${encodeURIComponent(client)}/count${QS.query(
      QS.explode({
        ciphersuite,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Post an MLS message
 */
export function mlsMessage(
  {
    mlsMessage,
  }: {
    mlsMessage: MlsMessage;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: MlsMessageSendingStatus;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label:
            | 'mls-invalid-leaf-node-signature'
            | 'mls-self-removal-not-allowed'
            | 'mls-protocol-error'
            | 'mls-not-enabled'
            | 'mls-invalid-leaf-node-index'
            | 'mls-group-conversation-mismatch'
            | 'mls-commit-missing-references'
            | 'mls-client-sender-user-mismatch';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'mls-subconv-join-parent-missing'
            | 'missing-legalhold-consent'
            | 'legalhold-not-enabled'
            | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'mls-proposal-not-found' | 'no-conversation' | 'no-conversation-member';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          missing_users: QualifiedUserId[];
        };
      }
    | {
        status: 422;
        data: {
          code: 422;
          label: 'mls-unsupported-proposal' | 'mls-unsupported-message';
          message: string;
        };
      }
    | {
        status: 533;
        data: {
          unreachable_backends: Domain[];
        };
      }
  >('/mls/messages', {
    ...opts,
    method: 'POST',
    body: mlsMessage,
  });
}
/**
 * Get public keys used by the backend to sign external proposals
 */
export function mlsPublicKeys(
  {
    format,
  }: {
    format?: 'raw' | 'jwk';
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MlsKeysByPurpose;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-not-enabled';
          message: string;
        };
      }
  >(
    `/mls/public-keys${QS.query(
      QS.explode({
        format,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Reset an MLS conversation to epoch 0
 */
export function mlsResetConversation(
  {
    mlsReset,
  }: {
    mlsReset: MlsReset;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label:
            | 'mls-protocol-error'
            | 'mls-group-id-not-supported'
            | 'mls-federated-reset-not-supported'
            | 'mls-not-enabled';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'action-denied' | 'invalid-op' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'mls-stale-message';
          message: string;
        };
      }
  >(
    '/mls/reset-conversation',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: mlsReset,
    }),
  );
}
/**
 * Fetch notifications
 */
export function getNotifications(
  {
    since,
    client,
    size,
  }: {
    since?: string;
    client?: string;
    size?: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: QueuedNotificationList;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    `/notifications${QS.query(
      QS.explode({
        since,
        client,
        size,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Fetch the last notification
 */
export function getLastNotification(
  {
    client,
  }: {
    client?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: QueuedNotification;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    `/notifications/last${QS.query(
      QS.explode({
        client,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Fetch a notification by ID
 */
export function getNotificationById(
  {
    id,
    client,
  }: {
    id: string;
    client?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: QueuedNotification;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    `/notifications/${encodeURIComponent(id)}${QS.query(
      QS.explode({
        client,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Get OAuth applications with account access
 */
export function getOauthApplications(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: OAuthApplication[];
  }>('/oauth/applications', {
    ...opts,
  });
}
/**
 * Revoke account access from an OAuth application
 */
export function revokeOauthAccountAccess(
  {
    oAuthClientId,
    passwordReqBody,
  }: {
    oAuthClientId: string;
    passwordReqBody: PasswordReqBody;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
  >(
    `/oauth/applications/${encodeURIComponent(oAuthClientId)}/sessions`,
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: passwordReqBody,
    }),
  );
}
/**
 * Revoke an active OAuth session
 */
export function deleteOauthRefreshToken(
  {
    oAuthClientId,
    refreshTokenId,
    passwordReqBody,
  }: {
    oAuthClientId: string;
    refreshTokenId: string;
    passwordReqBody: PasswordReqBody;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: unknown[];
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    `/oauth/applications/${encodeURIComponent(oAuthClientId)}/sessions/${encodeURIComponent(refreshTokenId)}`,
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: passwordReqBody,
    }),
  );
}
/**
 * Create an OAuth authorization code
 */
export function createOauthAuthCode(
  {
    createOAuthAuthorizationCodeRequest,
  }: {
    createOAuthAuthorizationCodeRequest: CreateOAuthAuthorizationCodeRequest;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'redirect-url-miss-match';
          message: string;
        };
      }
    | {
        status: 403;
      }
    | {
        status: 404;
      }
  >(
    '/oauth/authorization/codes',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: createOAuthAuthorizationCodeRequest,
    }),
  );
}
/**
 * Get OAuth client information
 */
export function getOauthClient(
  {
    oAuthClientId,
  }: {
    oAuthClientId: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: OAuthClient;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'forbidden';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/oauth/clients/${encodeURIComponent(oAuthClientId)}`, {
    ...opts,
  });
}
/**
 * Revoke an OAuth refresh token
 */
export function revokeOauthRefreshToken(
  {
    oAuthRevokeRefreshTokenRequest,
  }: {
    oAuthRevokeRefreshTokenRequest: OAuthRevokeRefreshTokenRequest;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: unknown[];
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'forbidden';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
    | {
        status: 500;
        data: {
          code: 500;
          label: 'jwt-error';
          message: string;
        };
      }
  >(
    '/oauth/revoke',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: oAuthRevokeRefreshTokenRequest,
    }),
  );
}
/**
 * Create an OAuth access token
 */
export function createOauthAccessToken(
  {
    eitherOAuthAccessTokenRequestOAuthRefreshAccessTokenRequest,
  }: {
    eitherOAuthAccessTokenRequestOAuthRefreshAccessTokenRequest: EitherOAuthAccessTokenRequestOAuthRefreshAccessTokenRequest;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: OAuthAccessTokenResponse;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid_grant' | 'forbidden';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
    | {
        status: 500;
        data: {
          code: 500;
          label: 'jwt-error';
          message: string;
        };
      }
  >(
    '/oauth/token',
    oazapfts.form({
      ...opts,
      method: 'POST',
      body: eitherOAuthAccessTokenRequestOAuthRefreshAccessTokenRequest,
    }),
  );
}
/**
 * Create a 1:1 conversation
 */
export function createOneToOneConversation(
  {
    newOne2OneConv,
  }: {
    newOne2OneConv: NewOne2OneConv;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: OwnConversationV3;
      }
    | {
        status: 201;
        data: OwnConversationV3;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'missing-legalhold-consent'
            | 'operation-denied'
            | 'not-connected'
            | 'no-team-member'
            | 'non-binding-team-members'
            | 'invalid-op'
            | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team' | 'non-binding-team';
          message: string;
        };
      }
    | {
        status: 533;
        data: {
          unreachable_backends: Domain[];
        };
      }
  >(
    '/one2one-conversations',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newOne2OneConv,
    }),
  );
}
/**
 * Get an MLS 1:1 conversation
 */
export function getOneToOneMlsConversation(
  {
    usrDomain,
    usr,
    format,
  }: {
    usrDomain: string;
    usr: string;
    format?: 'raw' | 'jwk';
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MlsOne2OneConversationSomeKey;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'mls-not-enabled';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'not-connected';
          message: string;
        };
      }
  >(
    `/one2one-conversations/${encodeURIComponent(usrDomain)}/${encodeURIComponent(usr)}${QS.query(
      QS.explode({
        format,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Initiate a password reset.
 */
export function postPasswordReset(
  {
    newPasswordReset,
  }: {
    newPasswordReset: NewPasswordReset;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    '/password-reset',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newPasswordReset,
    }),
  );
}
/**
 * Complete a password reset.
 */
export function postPasswordResetComplete(
  {
    completePasswordReset,
  }: {
    completePasswordReset: CompletePasswordReset;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-code';
          message: string;
        };
      }
  >(
    '/password-reset/complete',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: completePasswordReset,
    }),
  );
}
/**
 * Clear all properties
 */
export function clearProperties(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchText('/properties', {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * List all property keys
 */
export function listPropertyKeys(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: Ascii[];
  }>('/properties', {
    ...opts,
  });
}
/**
 * List all properties with key and value
 */
export function listProperties(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: PropertyKeysAndValues;
  }>('/properties-values', {
    ...opts,
  });
}
/**
 * Delete a property
 */
export function deleteProperty(
  {
    key,
  }: {
    key: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(`/properties/${encodeURIComponent(key)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Get a property value
 */
export function getProperty(
  {
    key,
  }: {
    key: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: PropertyValue;
      }
    | {
        status: 404;
      }
  >(`/properties/${encodeURIComponent(key)}`, {
    ...opts,
  });
}
/**
 * Set a user property
 */
export function setProperty(
  {
    key,
    propertyValue,
  }: {
    key: string;
    propertyValue: PropertyValue;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/properties/${encodeURIComponent(key)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: propertyValue,
    }),
  );
}
/**
 * Delete a provider
 */
export function providerDelete(
  {
    deleteProvider,
  }: {
    deleteProvider: DeleteProvider;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials' | 'invalid-provider' | 'access-denied';
          message: string;
        };
      }
  >(
    '/provider',
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: deleteProvider,
    }),
  );
}
/**
 * Get account
 */
export function providerGetAccount(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Provider;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >('/provider', {
    ...opts,
  });
}
/**
 * Update a provider
 */
export function providerUpdate(
  {
    updateProvider,
  }: {
    updateProvider: UpdateProvider;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-provider' | 'access-denied';
          message: string;
        };
      }
  >(
    '/provider',
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: updateProvider,
    }),
  );
}
/**
 * Activate a provider
 */
export function providerActivate(
  {
    key,
    code,
  }: {
    key: string;
    code: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ProviderActivationResponse;
      }
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-code' | 'access-denied';
          message: string;
        };
      }
  >(
    `/provider/activate${QS.query(
      QS.explode({
        key,
        code,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Upload an asset
 */
export function assetsUploadV3Provider(
  {
    assetSource,
  }: {
    assetSource?: AssetSource;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: Asset;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'incomplete-body' | 'invalid-length';
          message: string;
        };
      }
    | {
        status: 413;
        data: {
          code: 413;
          label: 'client-error';
          message: string;
        };
      }
  >('/provider/assets', {
    ...opts,
    method: 'POST',
    body: assetSource,
  });
}
/**
 * Delete an asset
 */
export function assetsDeleteV3Provider(
  {
    key,
  }: {
    key: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'unauthorised';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/provider/assets/${encodeURIComponent(key)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Download an asset
 */
export function assetsDownloadV3Provider(
  {
    key,
    assetToken,
    assetTokenQuery,
  }: {
    key: string;
    assetToken?: string;
    assetTokenQuery?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 302;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    `/provider/assets/${encodeURIComponent(key)}${QS.query(
      QS.explode({
        asset_token: assetTokenQuery,
      }),
    )}`,
    {
      ...opts,
      headers: oazapfts.mergeHeaders(opts?.headers, {
        'Asset-Token': assetToken,
      }),
    },
  );
}
/**
 * Update a provider email
 */
export function providerUpdateEmail(
  {
    emailUpdate,
  }: {
    emailUpdate: EmailUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 202;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-email';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-provider' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 429;
        data: {
          code: 429;
          label: 'too-many-requests';
          message: string;
        };
      }
  >(
    '/provider/email',
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: emailUpdate,
    }),
  );
}
/**
 * Login as a provider
 */
export function providerLogin(
  {
    providerLogin,
  }: {
    providerLogin: ProviderLogin;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials' | 'access-denied';
          message: string;
        };
      }
  >(
    '/provider/login',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: providerLogin,
    }),
  );
}
/**
 * Update a provider password
 */
export function providerUpdatePassword(
  {
    passwordChange,
  }: {
    passwordChange: PasswordChange;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'password-must-differ';
          message: string;
        };
      }
  >(
    '/provider/password',
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: passwordChange,
    }),
  );
}
/**
 * Begin a password reset
 */
export function providerPasswordReset(
  {
    passwordReset,
  }: {
    passwordReset: PasswordReset;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-code' | 'invalid-key';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'password-must-differ' | 'code-exists';
          message: string;
        };
      }
    | {
        status: 429;
        data: {
          code: 429;
          label: 'too-many-requests';
          message: string;
        };
      }
  >(
    '/provider/password-reset',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: passwordReset,
    }),
  );
}
/**
 * Complete a password reset
 */
export function providerPasswordResetComplete(
  {
    completePasswordReset,
  }: {
    completePasswordReset: CompletePasswordReset;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-code';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials' | 'invalid-code' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'password-must-differ';
          message: string;
        };
      }
  >(
    '/provider/password-reset/complete',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: completePasswordReset,
    }),
  );
}
/**
 * Register a new provider
 */
export function providerRegister(
  {
    xForwardedFor,
    newProvider,
  }: {
    xForwardedFor: string;
    newProvider: NewProvider;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: NewProviderResponse;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-email';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 429;
        data: {
          code: 429;
          label: 'too-many-requests';
          message: string;
        };
      }
  >(
    '/provider/register',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newProvider,
      headers: oazapfts.mergeHeaders(opts?.headers, {
        'X-Forwarded-For': xForwardedFor,
      }),
    }),
  );
}
/**
 * List provider services
 */
export function getProviderServices(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Service[];
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
  >('/provider/services', {
    ...opts,
  });
}
/**
 * Create a new service
 */
export function postProviderServices(
  {
    newService,
  }: {
    newService: NewService;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: NewServiceResponse;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-service-key';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
  >(
    '/provider/services',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newService,
    }),
  );
}
/**
 * Delete service
 */
export function deleteProviderServicesByServiceId(
  {
    serviceId,
    deleteService,
  }: {
    serviceId: string;
    deleteService: DeleteService;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 202;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    `/provider/services/${encodeURIComponent(serviceId)}`,
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: deleteService,
    }),
  );
}
/**
 * Get provider service by service id
 */
export function getProviderServicesByServiceId(
  {
    serviceId,
  }: {
    serviceId: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Service;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/provider/services/${encodeURIComponent(serviceId)}`, {
    ...opts,
  });
}
/**
 * Update provider service
 */
export function putProviderServicesByServiceId(
  {
    serviceId,
    updateService,
  }: {
    serviceId: string;
    updateService: UpdateService;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    `/provider/services/${encodeURIComponent(serviceId)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: updateService,
    }),
  );
}
/**
 * Update provider service connection
 */
export function putProviderServicesConnectionByServiceId(
  {
    serviceId,
    updateServiceConn,
  }: {
    serviceId: string;
    updateServiceConn: UpdateServiceConn;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-service-key';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials' | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    `/provider/services/${encodeURIComponent(serviceId)}/connection`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: updateServiceConn,
    }),
  );
}
/**
 * Get profile
 */
export function providerGetProfile(
  {
    pid,
  }: {
    pid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Provider;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/providers/${encodeURIComponent(pid)}`, {
    ...opts,
  });
}
/**
 * Get provider services by provider id
 */
export function getProviderServicesByProviderId(
  {
    providerId,
  }: {
    providerId: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ServiceProfile[];
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
  >(`/providers/${encodeURIComponent(providerId)}/services`, {
    ...opts,
  });
}
/**
 * Get provider service by provider id and service id
 */
export function getProviderServicesByProviderIdAndServiceId(
  {
    providerId,
    serviceId,
  }: {
    providerId: string;
    serviceId: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ServiceProfile;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/providers/${encodeURIComponent(providerId)}/services/${encodeURIComponent(serviceId)}`, {
    ...opts,
  });
}
/**
 * List the user's registered push tokens
 */
export function getPushTokens(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: PushTokenList;
  }>('/push/tokens', {
    ...opts,
  });
}
/**
 * Register a native push token
 */
export function registerPushToken(
  {
    pushToken,
  }: {
    pushToken: PushToken;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: PushToken;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'apns-voip-not-supported';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'app-not-found' | 'invalid-token';
          message: string;
        };
      }
    | {
        status: 413;
        data: {
          code: 413;
          label: 'sns-thread-budget-reached' | 'token-too-long' | 'metadata-too-long';
          message: string;
        };
      }
  >(
    '/push/tokens',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: pushToken,
    }),
  );
}
/**
 * Unregister a native push token
 */
export function deletePushToken(
  {
    pid,
  }: {
    pid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 204;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/push/tokens/${encodeURIComponent(pid)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Register a new user.
 */
export function register(
  {
    xForwardedFor,
    newUser,
  }: {
    xForwardedFor: string;
    newUser: NewUser;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: User;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-invitation-code' | 'invalid-email' | 'invalid-phone';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'unauthorized'
            | 'missing-identity'
            | 'blacklisted-email'
            | 'too-many-team-members'
            | 'user-creation-restricted'
            | 'ephemeral-user-creation-disabled';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'invalid-code';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'key-exists';
          message: string;
        };
      }
  >(
    '/register',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newUser,
      headers: oazapfts.mergeHeaders(opts?.headers, {
        'X-Forwarded-For': xForwardedFor,
      }),
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "auth-tokens-delete"]
 *
 *
 */
export function authTokensDelete(
  {
    id,
  }: {
    id: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'code-authentication-required' | 'code-authentication-failed';
          message: string;
        };
      }
  >(
    `/scim/auth-tokens${QS.query(
      QS.explode({
        id,
      }),
    )}`,
    {
      ...opts,
      method: 'DELETE',
    },
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "auth-tokens-list"]
 *
 *
 */
export function authTokensList(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ScimTokenList;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'code-authentication-required' | 'code-authentication-failed';
          message: string;
        };
      }
  >('/scim/auth-tokens', {
    ...opts,
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "auth-tokens-create"]
 *
 *
 */
export function authTokensCreate(
  {
    createScimToken,
  }: {
    createScimToken: CreateScimToken;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: CreateScimTokenResponse;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'code-authentication-required' | 'code-authentication-failed';
          message: string;
        };
      }
  >(
    '/scim/auth-tokens',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: createScimToken,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "auth-tokens-put-name"]
 *
 *
 */
export function authTokensPutName(
  {
    id,
    scimTokenName,
  }: {
    id: string;
    scimTokenName: ScimTokenName;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: unknown[];
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'code-authentication-required' | 'code-authentication-failed';
          message: string;
        };
      }
  >(
    `/scim/auth-tokens/${encodeURIComponent(id)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: scimTokenName,
    }),
  );
}
/**
 * Search for users
 */
export function searchContacts(
  {
    q,
    domain,
    size,
    $type,
  }: {
    q: string;
    domain?: string;
    size?: number;
    $type?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SearchResultContact;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'insufficient-permissions';
          message: string;
        };
      }
  >(
    `/search/contacts${QS.query(
      QS.explode({
        q,
        domain,
        size,
        type: $type,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Initiate account deletion.
 */
export function deleteSelf(
  {
    deleteUser,
  }: {
    deleteUser: DeleteUser;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 202;
        data: DeletionCodeTimeout;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-user';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'no-self-delete-for-team-owner'
            | 'pending-delete'
            | 'missing-auth'
            | 'invalid-credentials'
            | 'invalid-code';
          message: string;
        };
      }
  >(
    '/self',
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: deleteUser,
    }),
  );
}
/**
 * Get your own profile
 */
export function getSelf(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: User;
  }>('/self', {
    ...opts,
  });
}
/**
 * Update your profile.
 */
export function putSelf(
  {
    userUpdate,
  }: {
    userUpdate: UserUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    '/self',
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: userUpdate,
    }),
  );
}
/**
 * Remove your email address.
 */
export function removeEmail(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'last-identity' | 'no-identity';
          message: string;
        };
      }
  >('/self/email', {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Change your handle.
 */
export function changeHandle(
  {
    handleUpdate,
  }: {
    handleUpdate: HandleUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    '/self/handle',
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: handleUpdate,
    }),
  );
}
/**
 * Change your locale.
 */
export function changeLocale(
  {
    localeUpdate,
  }: {
    localeUpdate: LocaleUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    '/self/locale',
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: localeUpdate,
    }),
  );
}
/**
 * Check that your password is set.
 */
export function checkPasswordExists(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchText('/self/password', {
    ...opts,
    method: 'HEAD',
  });
}
/**
 * Change your password.
 */
export function changePassword(
  {
    passwordChange,
  }: {
    passwordChange: PasswordChange;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-credentials' | 'no-identity';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'password-must-differ';
          message: string;
        };
      }
  >(
    '/self/password',
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: passwordChange,
    }),
  );
}
/**
 * Change your supported protocols
 */
export function changeSupportedProtocols(
  {
    supportedProtocolUpdate,
  }: {
    supportedProtocolUpdate: SupportedProtocolUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'mls-protocol-error';
          message: string;
        };
      }
  >(
    '/self/supported-protocols',
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: supportedProtocolUpdate,
    }),
  );
}
/**
 * List services
 */
export function getServices(
  {
    tags,
    start,
    size,
  }: {
    tags?:
      | 'audio'
      | 'books'
      | 'business'
      | 'design'
      | 'education'
      | 'entertainment'
      | 'finance'
      | 'fitness'
      | 'food-drink'
      | 'games'
      | 'graphics'
      | 'health'
      | 'integration'
      | 'lifestyle'
      | 'media'
      | 'medical'
      | 'movies'
      | 'music'
      | 'news'
      | 'photography'
      | 'poll'
      | 'productivity'
      | 'quiz'
      | 'rating'
      | 'shopping'
      | 'social'
      | 'sports'
      | 'travel'
      | 'tutorial'
      | 'video'
      | 'weather';
    start?: string;
    size?: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ServiceProfilePage;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
  >(
    `/services${QS.query(
      QS.explode({
        tags,
        start,
        size,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Get services tags
 */
export function getServicesTags(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ServiceTagList;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
  >('/services/tags', {
    ...opts,
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "auth-resp-legacy"]
 *
 * DEPRECATED!  use /sso/metadata/:tid instead!  Details: https://docs.wire.com/understand/single-sign-on/trouble-shooting.html#can-i-use-the-same-sso-login-code-for-multiple-teams
 */
export function authRespLegacy(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchText('/sso/finalize-login', {
    ...opts,
    method: 'POST',
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "auth-resp"]
 *
 *
 */
export function authResp(
  {
    team,
  }: {
    team: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(`/sso/finalize-login/${encodeURIComponent(team)}`, {
    ...opts,
    method: 'POST',
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "sso-get-by-email"]
 *
 *
 */
export function ssoGetByEmail(
  {
    getByEmailReq,
  }: {
    getByEmailReq: GetByEmailReq;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: GetByEmailResp;
      }
    | {
        status: 404;
        data: GetByEmailResp;
      }
  >(
    '/sso/get-by-email',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: getByEmailReq,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "auth-req"]
 *
 *
 */
export function authReq(
  {
    successRedirect,
    errorRedirect,
    label,
    idp,
  }: {
    successRedirect?: string;
    errorRedirect?: string;
    label?: string;
    idp: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/sso/initiate-login/${encodeURIComponent(idp)}${QS.query(
      QS.explode({
        success_redirect: successRedirect,
        error_redirect: errorRedirect,
        label,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "auth-req-precheck"]
 *
 *
 */
export function authReqPrecheck(
  {
    successRedirect,
    errorRedirect,
    label,
    idp,
  }: {
    successRedirect?: string;
    errorRedirect?: string;
    label?: string;
    idp: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/sso/initiate-login/${encodeURIComponent(idp)}${QS.query(
      QS.explode({
        success_redirect: successRedirect,
        error_redirect: errorRedirect,
        label,
      }),
    )}`,
    {
      ...opts,
      method: 'HEAD',
    },
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "sso-metadata"]
 *
 * DEPRECATED!  use /sso/metadata/:tid instead!  Details: https://docs.wire.com/understand/single-sign-on/trouble-shooting.html#can-i-use-the-same-sso-login-code-for-multiple-teams
 */
export function ssoMetadata(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchBlob<{
    status: 200;
    data: string;
  }>('/sso/metadata', {
    ...opts,
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "sso-team-metadata"]
 *
 *
 */
export function ssoTeamMetadata(
  {
    team,
  }: {
    team: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchBlob<{
    status: 200;
    data: string;
  }>(`/sso/metadata/${encodeURIComponent(team)}`, {
    ...opts,
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "sso-settings"]
 *
 *
 */
export function ssoSettings(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: SsoSettings;
  }>('/sso/settings', {
    ...opts,
  });
}
/**
 * Returns a curated set of system configuration settings for authorized users.
 */
export function getSystemSettings(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: SystemSettings;
  }>('/system/settings', {
    ...opts,
  });
}
/**
 * Returns a curated set of system configuration settings.
 */
export function getSystemSettingsUnauthorized(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: SystemSettingsPublic;
  }>('/system/settings/unauthorized', {
    ...opts,
  });
}
/**
 * Accept a team invitation, changing a personal account into a team member account.
 */
export function acceptTeamInvitation(
  {
    acceptTeamInvitation,
  }: {
    acceptTeamInvitation: AcceptTeamInvitation;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'missing-auth' | 'invalid-credentials' | 'missing-identity' | 'too-many-team-members';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'invalid-code' | 'not-found';
          message: string;
        };
      }
  >(
    '/teams/invitations/accept',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: acceptTeamInvitation,
    }),
  );
}
/**
 * Check if there is an invitation pending given an email address.
 */
export function headTeamInvitations(
  {
    email,
  }: {
    email: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'conflicting-invitations';
          message: string;
        };
      }
  >(
    `/teams/invitations/by-email${QS.query(
      QS.explode({
        email,
      }),
    )}`,
    {
      ...opts,
      method: 'HEAD',
    },
  );
}
/**
 * Get invitation info given a code.
 */
export function getTeamInvitationInfo(
  {
    code,
  }: {
    code: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: InvitationUserView;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-invitation-code';
          message: string;
        };
      }
  >(
    `/teams/invitations/info${QS.query(
      QS.explode({
        code,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Read recently added team members from team queue
 */
export function getTeamNotifications(
  {
    since,
    size,
  }: {
    since?: string;
    size?: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: QueuedNotificationList;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-notification-id';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/notifications${QS.query(
      QS.explode({
        since,
        size,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Update service whitelist
 */
export function postTeamWhitelistByTeamId(
  {
    teamId,
    updateServiceWhitelist,
  }: {
    teamId: string;
    updateServiceWhitelist: UpdateServiceWhitelist;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/teams/${encodeURIComponent(teamId)}/services/whitelist`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: updateServiceWhitelist,
    }),
  );
}
/**
 * Get whitelisted services by team id
 */
export function getWhitelistedServicesByTeamId(
  {
    teamId,
    prefix,
    filterDisabled,
    size,
  }: {
    teamId: string;
    prefix?: string;
    filterDisabled?: boolean;
    size?: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: ServiceProfilePage;
  }>(
    `/teams/${encodeURIComponent(teamId)}/services/whitelisted${QS.query(
      QS.explode({
        prefix,
        filter_disabled: filterDisabled,
        size,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Get all registered domains
 */
export function getAllRegisteredDomains(
  {
    teamId,
  }: {
    teamId: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: RegisteredDomains;
  }>(`/teams/${encodeURIComponent(teamId)}/registered-domains`, {
    ...opts,
  });
}
/**
 * Delete a registered domain
 */
export function deleteRegisteredDomain(
  {
    teamId,
    domain,
  }: {
    teamId: string;
    domain: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 204;
      }
    | {
        status: 402;
        data: {
          code: 402;
          label: 'domain-registration-update-payment-required';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-forbidden-for-domain-registration-state';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(teamId)}/registered-domains/${encodeURIComponent(domain)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Delete a team
 */
export function deleteTeam(
  {
    tid,
    teamDeleteData,
  }: {
    tid: string;
    teamDeleteData: TeamDeleteData;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 202;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'code-authentication-required'
            | 'code-authentication-failed'
            | 'access-denied'
            | 'operation-denied'
            | 'no-team-member';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
    | {
        status: 429;
        data: {
          code: 429;
          label: 'too-many-requests';
          message: string;
        };
      }
    | {
        status: 503;
        data: {
          code: 503;
          label: 'queue-full';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}`,
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: teamDeleteData,
    }),
  );
}
/**
 * Get a team by ID
 */
export function getTeam(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Team;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}`, {
    ...opts,
  });
}
/**
 * Update team properties
 */
export function updateTeam(
  {
    tid,
    teamUpdateData,
  }: {
    tid: string;
    teamUpdateData: TeamUpdateData;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-denied' | 'no-team-member';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: teamUpdateData,
    }),
  );
}
/**
 * Get all apps owned by the given team (not including collaborators)
 */
export function getApps(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: UserProfile[];
  }>(`/teams/${encodeURIComponent(tid)}/apps`, {
    ...opts,
  });
}
/**
 * Create a new app
 */
export function createApp(
  {
    tid,
    newApp,
  }: {
    tid: string;
    newApp: NewApp;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: CreatedApp;
  }>(
    `/teams/${encodeURIComponent(tid)}/apps`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newApp,
    }),
  );
}
/**
 * Update metadata of an existing app
 */
export function putApp(
  {
    tid,
    app,
    putApp,
  }: {
    tid: string;
    app: string;
    putApp: PutApp;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: unknown[];
  }>(
    `/teams/${encodeURIComponent(tid)}/apps/${encodeURIComponent(app)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: putApp,
    }),
  );
}
/**
 * Get a new app authentication token
 */
export function refreshAppCookie(
  {
    tid,
    app,
  }: {
    tid: string;
    app: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: RefreshAppCookieResponse;
  }>(`/teams/${encodeURIComponent(tid)}/apps/${encodeURIComponent(app)}/cookies`, {
    ...opts,
    method: 'POST',
  });
}
/**
 * Get app
 */
export function getApp(
  {
    tid,
    uid,
  }: {
    tid: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: UserProfile;
  }>(`/teams/${encodeURIComponent(tid)}/apps/${encodeURIComponent(uid)}`, {
    ...opts,
  });
}
/**
 * Search channels
 */
export function searchChannels(
  {
    tid,
    q,
    sortOrder,
    pageSize,
    lastSeenName,
    lastSeenId,
    discoverable,
  }: {
    tid: string;
    q?: string;
    sortOrder?: 'asc' | 'desc';
    pageSize?: number;
    lastSeenName?: string;
    lastSeenId?: string;
    discoverable?: boolean;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: ConversationPage;
  }>(
    `/teams/${encodeURIComponent(tid)}/channels/search${QS.query(
      QS.explode({
        q,
        sort_order: sortOrder,
        page_size: pageSize,
        last_seen_name: lastSeenName,
        last_seen_id: lastSeenId,
        discoverable,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Get all collaborators of the team.
 */
export function getTeamCollaborators(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: TeamCollaborator[];
  }>(`/teams/${encodeURIComponent(tid)}/collaborators`, {
    ...opts,
  });
}
/**
 * Add a collaborator to the team.
 */
export function addTeamCollaborator(
  {
    tid,
    newTeamCollaborator,
  }: {
    tid: string;
    newTeamCollaborator: NewTeamCollaborator;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/teams/${encodeURIComponent(tid)}/collaborators`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newTeamCollaborator,
    }),
  );
}
/**
 * Remove a collaborator from the team.
 */
export function removeTeamCollaborator(
  {
    tid,
    uid,
  }: {
    tid: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/collaborators/${encodeURIComponent(uid)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Update a collaborator permissions from the team.
 */
export function updateTeamCollaborator(
  {
    tid,
    uid,
    body,
  }: {
    tid: string;
    uid: string;
    body: CollaboratorPermission[];
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/teams/${encodeURIComponent(tid)}/collaborators/${encodeURIComponent(uid)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body,
    }),
  );
}
/**
 * Get team conversations
 */
export function getTeamConversations(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: TeamConversationList;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/conversations`, {
    ...opts,
  });
}
/**
 * Get existing roles available for the given team
 */
export function getTeamConversationRoles(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ConversationRolesList;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/conversations/roles`, {
    ...opts,
  });
}
/**
 * Remove a team conversation
 */
export function deleteTeamConversation(
  {
    tid,
    cid,
  }: {
    tid: string;
    cid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'invalid-op' | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/conversations/${encodeURIComponent(cid)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Get one team conversation
 */
export function getTeamConversation(
  {
    tid,
    cid,
  }: {
    tid: string;
    cid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: TeamConversation;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-conversation';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/conversations/${encodeURIComponent(cid)}`, {
    ...opts,
  });
}
/**
 * Gets feature configs for a team
 */
export function getAllFeatureConfigsForTeam(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: AllTeamFeatures;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-denied' | 'no-team-member';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features`, {
    ...opts,
  });
}
/**
 * Get config for allowedGlobalOperations
 */
export function getAllowedGlobalOperationsConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: AllowedGlobalOperationsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/allowedGlobalOperations`, {
    ...opts,
  });
}
/**
 * Get config for appLock
 */
export function getAppLockConfigB(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: AppLockConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/appLock`, {
    ...opts,
  });
}
/**
 * Put config for appLock
 */
export function putAppLockConfigB(
  {
    tid,
    appLockConfigFeature,
  }: {
    tid: string;
    appLockConfigFeature: AppLockConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: AppLockConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/appLock`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: appLockConfigFeature,
    }),
  );
}
/**
 * Get config for apps
 */
export function getAppsConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: AppsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/apps`, {
    ...opts,
  });
}
/**
 * Get config for assetAuditLog
 */
export function getAssetAuditLogConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: AssetAuditLogConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/assetAuditLog`, {
    ...opts,
  });
}
/**
 * Get config for cells
 */
export function getCellsConfigB(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: CellsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/cells`, {
    ...opts,
  });
}
/**
 * Put config for cells
 */
export function putCellsConfigB(
  {
    tid,
    cellsConfigFeature,
  }: {
    tid: string;
    cellsConfigFeature: CellsConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: CellsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/cells`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: cellsConfigFeature,
    }),
  );
}
/**
 * Get config for cellsInternal
 */
export function getCellsInternalConfigB(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: CellsInternalConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/cellsInternal`, {
    ...opts,
  });
}
/**
 * Get config for channels
 */
export function getChannelsConfigB(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ChannelsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/channels`, {
    ...opts,
  });
}
/**
 * Put config for channels
 */
export function putChannelsConfigB(
  {
    tid,
    channelsConfigFeature,
  }: {
    tid: string;
    channelsConfigFeature: ChannelsConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ChannelsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/channels`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: channelsConfigFeature,
    }),
  );
}
/**
 * Get config for chatBubbles
 */
export function getChatBubblesConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ChatBubblesConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/chatBubbles`, {
    ...opts,
  });
}
/**
 * Get config for classifiedDomains
 */
export function getClassifiedDomainsConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ClassifiedDomainsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/classifiedDomains`, {
    ...opts,
  });
}
/**
 * Get config for conferenceCalling
 */
export function getConferenceCallingConfigB(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ConferenceCallingConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/conferenceCalling`, {
    ...opts,
  });
}
/**
 * Put config for conferenceCalling
 */
export function putConferenceCallingConfigB(
  {
    tid,
    conferenceCallingConfigFeature,
  }: {
    tid: string;
    conferenceCallingConfigFeature: ConferenceCallingConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ConferenceCallingConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/conferenceCalling`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: conferenceCallingConfigFeature,
    }),
  );
}
/**
 * Get config for consumableNotifications
 */
export function getConsumableNotificationsConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ConsumableNotificationsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/consumableNotifications`, {
    ...opts,
  });
}
/**
 * Get config for conversationGuestLinks
 */
export function getGuestLinksConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: GuestLinksConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/conversationGuestLinks`, {
    ...opts,
  });
}
/**
 * Put config for conversationGuestLinks
 */
export function putGuestLinksConfig(
  {
    tid,
    guestLinksConfigFeature,
  }: {
    tid: string;
    guestLinksConfigFeature: GuestLinksConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: GuestLinksConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/conversationGuestLinks`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: guestLinksConfigFeature,
    }),
  );
}
/**
 * Get config for digitalSignatures
 */
export function getDigitalSignaturesConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: DigitalSignaturesConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/digitalSignatures`, {
    ...opts,
  });
}
/**
 * Get config for domainRegistration
 */
export function getDomainRegistrationConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: DomainRegistrationConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/domainRegistration`, {
    ...opts,
  });
}
/**
 * Get config for enforceFileDownloadLocation
 */
export function getEnforceFileDownloadLocationConfigB(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: EnforceFileDownloadLocationLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/enforceFileDownloadLocation`, {
    ...opts,
  });
}
/**
 * Put config for enforceFileDownloadLocation
 */
export function putEnforceFileDownloadLocationConfigB(
  {
    tid,
    enforceFileDownloadLocationFeature,
  }: {
    tid: string;
    enforceFileDownloadLocationFeature: EnforceFileDownloadLocationFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: EnforceFileDownloadLocationLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/enforceFileDownloadLocation`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: enforceFileDownloadLocationFeature,
    }),
  );
}
/**
 * Get config for exposeInvitationURLsToTeamAdmin
 */
export function getExposeInvitationUrLsToTeamAdminConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ExposeInvitationUrLsToTeamAdminConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/exposeInvitationURLsToTeamAdmin`, {
    ...opts,
  });
}
/**
 * Put config for exposeInvitationURLsToTeamAdmin
 */
export function putExposeInvitationUrLsToTeamAdminConfig(
  {
    tid,
    exposeInvitationUrLsToTeamAdminConfigFeature,
  }: {
    tid: string;
    exposeInvitationUrLsToTeamAdminConfigFeature: ExposeInvitationUrLsToTeamAdminConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ExposeInvitationUrLsToTeamAdminConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/exposeInvitationURLsToTeamAdmin`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: exposeInvitationUrLsToTeamAdminConfigFeature,
    }),
  );
}
/**
 * Get config for fileSharing
 */
export function getFileSharingConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: FileSharingConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/fileSharing`, {
    ...opts,
  });
}
/**
 * Put config for fileSharing
 */
export function putFileSharingConfig(
  {
    tid,
    fileSharingConfigFeature,
  }: {
    tid: string;
    fileSharingConfigFeature: FileSharingConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: FileSharingConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/fileSharing`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: fileSharingConfigFeature,
    }),
  );
}
/**
 * Get config for legalhold
 */
export function getLegalholdConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: LegalholdConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/legalhold`, {
    ...opts,
  });
}
/**
 * Put config for legalhold
 */
export function putLegalholdConfig(
  {
    tid,
    legalholdConfigFeature,
  }: {
    tid: string;
    legalholdConfigFeature: LegalholdConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: LegalholdConfigLockableFeature;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'legalhold-not-registered';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'legalhold-disable-unimplemented'
            | 'legalhold-not-enabled'
            | 'too-large-team-for-legalhold'
            | 'action-denied'
            | 'no-team-member'
            | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
    | {
        status: 500;
        data: {
          code: 500;
          label: 'legalhold-internal' | 'legalhold-illegal-op';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/legalhold`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: legalholdConfigFeature,
    }),
  );
}
/**
 * Get config for limitedEventFanout
 */
export function getLimitedEventFanoutConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: LimitedEventFanoutConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/limitedEventFanout`, {
    ...opts,
  });
}
/**
 * Get config for meetings
 */
export function getMeetingsConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MeetingsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/meetings`, {
    ...opts,
  });
}
/**
 * Put config for meetings
 */
export function putMeetingsConfig(
  {
    tid,
    meetingsConfigFeature,
  }: {
    tid: string;
    meetingsConfigFeature: MeetingsConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MeetingsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/meetings`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: meetingsConfigFeature,
    }),
  );
}
/**
 * Get config for meetingsPremium
 */
export function getMeetingsPremiumConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MeetingsPremiumConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/meetingsPremium`, {
    ...opts,
  });
}
/**
 * Put config for meetingsPremium
 */
export function putMeetingsPremiumConfig(
  {
    tid,
    meetingsPremiumConfigFeature,
  }: {
    tid: string;
    meetingsPremiumConfigFeature: MeetingsPremiumConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MeetingsPremiumConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/meetingsPremium`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: meetingsPremiumConfigFeature,
    }),
  );
}
/**
 * Get config for mls
 */
export function getMlsConfigB(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MlsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/mls`, {
    ...opts,
  });
}
/**
 * Put config for mls
 */
export function putMlsConfigB(
  {
    tid,
    mlsConfigFeature,
  }: {
    tid: string;
    mlsConfigFeature: MlsConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MlsConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/mls`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: mlsConfigFeature,
    }),
  );
}
/**
 * Get config for mlsE2EId
 */
export function getMlsE2EIdConfigB(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MlsE2EIdConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/mlsE2EId`, {
    ...opts,
  });
}
/**
 * Put config for mlsE2EId
 */
export function putMlsE2EIdConfigB(
  {
    tid,
    mlsE2EIdConfigFeature,
  }: {
    tid: string;
    mlsE2EIdConfigFeature: MlsE2EIdConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MlsE2EIdConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/mlsE2EId`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: mlsE2EIdConfigFeature,
    }),
  );
}
/**
 * Get config for mlsMigration
 */
export function getMlsMigrationConfigB(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MlsMigrationLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/mlsMigration`, {
    ...opts,
  });
}
/**
 * Put config for mlsMigration
 */
export function putMlsMigrationConfigB(
  {
    tid,
    mlsMigrationFeature,
  }: {
    tid: string;
    mlsMigrationFeature: MlsMigrationFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: MlsMigrationLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/mlsMigration`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: mlsMigrationFeature,
    }),
  );
}
/**
 * Get config for outlookCalIntegration
 */
export function getOutlookCalIntegrationConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: OutlookCalIntegrationConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/outlookCalIntegration`, {
    ...opts,
  });
}
/**
 * Put config for outlookCalIntegration
 */
export function putOutlookCalIntegrationConfig(
  {
    tid,
    outlookCalIntegrationConfigFeature,
  }: {
    tid: string;
    outlookCalIntegrationConfigFeature: OutlookCalIntegrationConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: OutlookCalIntegrationConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/outlookCalIntegration`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: outlookCalIntegrationConfigFeature,
    }),
  );
}
/**
 * Get config for searchVisibility
 */
export function getSearchVisibilityAvailableConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SearchVisibilityAvailableConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/searchVisibility`, {
    ...opts,
  });
}
/**
 * Put config for searchVisibility
 */
export function putSearchVisibilityAvailableConfig(
  {
    tid,
    searchVisibilityAvailableConfigFeature,
  }: {
    tid: string;
    searchVisibilityAvailableConfigFeature: SearchVisibilityAvailableConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SearchVisibilityAvailableConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/searchVisibility`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: searchVisibilityAvailableConfigFeature,
    }),
  );
}
/**
 * Get config for searchVisibilityInbound
 */
export function getSearchVisibilityInboundConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SearchVisibilityInboundConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/searchVisibilityInbound`, {
    ...opts,
  });
}
/**
 * Put config for searchVisibilityInbound
 */
export function putSearchVisibilityInboundConfig(
  {
    tid,
    searchVisibilityInboundConfigFeature,
  }: {
    tid: string;
    searchVisibilityInboundConfigFeature: SearchVisibilityInboundConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SearchVisibilityInboundConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/searchVisibilityInbound`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: searchVisibilityInboundConfigFeature,
    }),
  );
}
/**
 * Get config for selfDeletingMessages
 */
export function getSelfDeletingMessagesConfigB(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SelfDeletingMessagesConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/selfDeletingMessages`, {
    ...opts,
  });
}
/**
 * Put config for selfDeletingMessages
 */
export function putSelfDeletingMessagesConfigB(
  {
    tid,
    selfDeletingMessagesConfigFeature,
  }: {
    tid: string;
    selfDeletingMessagesConfigFeature: SelfDeletingMessagesConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SelfDeletingMessagesConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/selfDeletingMessages`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: selfDeletingMessagesConfigFeature,
    }),
  );
}
/**
 * Get config for simplifiedUserConnectionRequestQRCode
 */
export function getSimplifiedUserConnectionRequestQrCodeConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SimplifiedUserConnectionRequestQrCodeLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/simplifiedUserConnectionRequestQRCode`, {
    ...opts,
  });
}
/**
 * Get config for sndFactorPasswordChallenge
 */
export function getSndFactorPasswordChallengeConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SndFactorPasswordChallengeConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/sndFactorPasswordChallenge`, {
    ...opts,
  });
}
/**
 * Put config for sndFactorPasswordChallenge
 */
export function putSndFactorPasswordChallengeConfig(
  {
    tid,
    sndFactorPasswordChallengeConfigFeature,
  }: {
    tid: string;
    sndFactorPasswordChallengeConfigFeature: SndFactorPasswordChallengeConfigFeature;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SndFactorPasswordChallengeConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/features/sndFactorPasswordChallenge`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: sndFactorPasswordChallengeConfigFeature,
    }),
  );
}
/**
 * Get config for sso
 */
export function getSsoConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: SsoConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/sso`, {
    ...opts,
  });
}
/**
 * Get config for stealthUsers
 */
export function getStealthUsersConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: StealthUsersConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/stealthUsers`, {
    ...opts,
  });
}
/**
 * Get config for validateSAMLemails
 */
export function getRequireExternalEmailVerificationConfig(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: RequireExternalEmailVerificationConfigLockableFeature;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member' | 'operation-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/features/validateSAMLemails`, {
    ...opts,
  });
}
/**
 * Get team members by user id list
 */
export function getTeamMembersByIds(
  {
    tid,
    maxResults,
    userIdList,
  }: {
    tid: string;
    maxResults?: number;
    userIdList: UserIdList;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: TeamMemberList;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'too-many-uids';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/get-members-by-ids-using-post${QS.query(
      QS.explode({
        maxResults,
      }),
    )}`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: userIdList,
    }),
  );
}
/**
 * List the sent team invitations
 */
export function getTeamInvitations(
  {
    tid,
    start,
    size,
  }: {
    tid: string;
    start?: string;
    size?: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: InvitationList;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'insufficient-permissions';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/invitations${QS.query(
      QS.explode({
        start,
        size,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Create and send a new team invitation.
 */
export function sendTeamInvitation(
  {
    tid,
    invitationRequest,
  }: {
    tid: string;
    invitationRequest: InvitationRequest;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: Invitation;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-invitation-code' | 'invalid-email';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'insufficient-permissions'
            | 'too-many-team-invitations'
            | 'blacklisted-email'
            | 'no-identity'
            | 'no-email';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/invitations`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: invitationRequest,
    }),
  );
}
/**
 * Delete a pending team invitation by ID.
 */
export function deleteTeamInvitation(
  {
    tid,
    iid,
  }: {
    tid: string;
    iid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'insufficient-permissions';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/invitations/${encodeURIComponent(iid)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Get a pending team invitation by ID.
 */
export function getTeamInvitation(
  {
    tid,
    iid,
  }: {
    tid: string;
    iid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: Invitation;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'insufficient-permissions';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'duplicate-entry';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/invitations/${encodeURIComponent(iid)}`, {
    ...opts,
  });
}
/**
 * Consent to legal hold
 */
export function consentToLegalHold(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
      }
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'invalid-op' | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team-member';
          message: string;
        };
      }
    | {
        status: 500;
        data: {
          code: 500;
          label: 'legalhold-internal' | 'legalhold-illegal-op';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/legalhold/consent`, {
    ...opts,
    method: 'POST',
  });
}
/**
 * Delete legal hold service settings
 */
export function deleteLegalHoldSettings(
  {
    tid,
    removeLegalHoldSettingsRequest,
  }: {
    tid: string;
    removeLegalHoldSettingsRequest: RemoveLegalHoldSettingsRequest;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'legalhold-not-registered';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'legalhold-disable-unimplemented'
            | 'legalhold-not-enabled'
            | 'invalid-op'
            | 'action-denied'
            | 'no-team-member'
            | 'operation-denied'
            | 'code-authentication-required'
            | 'code-authentication-failed'
            | 'access-denied';
          message: string;
        };
      }
    | {
        status: 429;
        data: {
          code: 429;
          label: 'too-many-requests';
          message: string;
        };
      }
    | {
        status: 500;
        data: {
          code: 500;
          label: 'legalhold-internal' | 'legalhold-illegal-op';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/legalhold/settings`,
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: removeLegalHoldSettingsRequest,
    }),
  );
}
/**
 * Get legal hold service settings
 */
export function getLegalHoldSettings(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: ViewLegalHoldService;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-denied' | 'no-team-member';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/legalhold/settings`, {
    ...opts,
  });
}
/**
 * Create legal hold service settings
 */
export function createLegalHoldSettings(
  {
    tid,
    newLegalHoldService,
  }: {
    tid: string;
    newLegalHoldService: NewLegalHoldService;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
        data: ViewLegalHoldService;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'legalhold-status-bad' | 'legalhold-invalid-key';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'legalhold-not-enabled' | 'operation-denied' | 'no-team-member';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/legalhold/settings`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newLegalHoldService,
    }),
  );
}
/**
 * Disable legal hold for user
 */
export function disableLegalHoldForUser(
  {
    tid,
    uid,
    disableLegalHoldForUserRequest,
  }: {
    tid: string;
    uid: string;
    disableLegalHoldForUserRequest: DisableLegalHoldForUserRequest;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'legalhold-not-registered';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'operation-denied'
            | 'no-team-member'
            | 'action-denied'
            | 'code-authentication-required'
            | 'code-authentication-failed'
            | 'access-denied';
          message: string;
        };
      }
    | {
        status: 429;
        data: {
          code: 429;
          label: 'too-many-requests';
          message: string;
        };
      }
    | {
        status: 500;
        data: {
          code: 500;
          label: 'legalhold-internal' | 'legalhold-illegal-op';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/legalhold/${encodeURIComponent(uid)}`,
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: disableLegalHoldForUserRequest,
    }),
  );
}
/**
 * Get legal hold status
 */
export function getLegalHold(
  {
    tid,
    uid,
  }: {
    tid: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: UserLegalHoldStatusResponse;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team-member';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/legalhold/${encodeURIComponent(uid)}`, {
    ...opts,
  });
}
/**
 * Request legal hold device
 */
export function requestLegalHoldDevice(
  {
    tid,
    uid,
  }: {
    tid: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 201;
      }
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'legalhold-not-registered' | 'legalhold-status-bad';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'legalhold-not-enabled' | 'operation-denied' | 'no-team-member' | 'action-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team-member';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'mls-legal-hold-not-allowed' | 'legalhold-no-consent' | 'legalhold-already-enabled';
          message: string;
        };
      }
    | {
        status: 500;
        data: {
          code: 500;
          label: 'legalhold-illegal-op' | 'legalhold-internal';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/legalhold/${encodeURIComponent(uid)}`, {
    ...opts,
    method: 'POST',
  });
}
/**
 * Approve legal hold device
 */
export function approveLegalHoldDevice(
  {
    tid,
    uid,
    approveLegalHoldForUserRequest,
  }: {
    tid: string;
    uid: string;
    approveLegalHoldForUserRequest: ApproveLegalHoldForUserRequest;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'legalhold-not-registered';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'legalhold-not-enabled'
            | 'no-team-member'
            | 'action-denied'
            | 'access-denied'
            | 'code-authentication-required'
            | 'code-authentication-failed';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'legalhold-no-device-allocated';
          message: string;
        };
      }
    | {
        status: 409;
        data: {
          code: 409;
          label: 'legalhold-already-enabled';
          message: string;
        };
      }
    | {
        status: 412;
        data: {
          code: 412;
          label: 'legalhold-not-pending';
          message: string;
        };
      }
    | {
        status: 429;
        data: {
          code: 429;
          label: 'too-many-requests';
          message: string;
        };
      }
    | {
        status: 500;
        data: {
          code: 500;
          label: 'legalhold-internal' | 'legalhold-illegal-op';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/legalhold/${encodeURIComponent(uid)}/approve`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: approveLegalHoldForUserRequest,
    }),
  );
}
/**
 * Get team members
 */
export function getTeamMembers(
  {
    tid,
    maxResults,
    pagingState,
  }: {
    tid: string;
    maxResults?: number;
    pagingState?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: TeamMembersPage;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/members${QS.query(
      QS.explode({
        maxResults,
        pagingState,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Update an existing team member
 */
export function updateTeamMember(
  {
    tid,
    newTeamMember,
  }: {
    tid: string;
    newTeamMember: NewTeamMember;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'operation-denied'
            | 'no-team-member'
            | 'too-many-team-admins'
            | 'invalid-permissions'
            | 'access-denied';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team-member' | 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/members`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: newTeamMember,
    }),
  );
}
/**
 * Get all members of the team as a CSV file
 */
export function getTeamMembersCsv(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: string;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'access-denied';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/members/csv`, {
    ...opts,
  });
}
/**
 * Remove an existing team member
 */
export function deleteTeamMember(
  {
    tid,
    uid,
    teamMemberDeleteData,
  }: {
    tid: string;
    uid: string;
    teamMemberDeleteData: TeamMemberDeleteData;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 202;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label:
            | 'operation-denied'
            | 'no-team-member'
            | 'access-denied'
            | 'code-authentication-required'
            | 'code-authentication-failed';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team' | 'no-team-member';
          message: string;
        };
      }
    | {
        status: 429;
        data: {
          code: 429;
          label: 'too-many-requests';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/members/${encodeURIComponent(uid)}`,
    oazapfts.json({
      ...opts,
      method: 'DELETE',
      body: teamMemberDeleteData,
    }),
  );
}
/**
 * Get single team member
 */
export function getTeamMember(
  {
    tid,
    uid,
  }: {
    tid: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: TeamMember;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'no-team-member';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team-member';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/members/${encodeURIComponent(uid)}`, {
    ...opts,
  });
}
/**
 * Browse team for members (requires add-user permission)
 */
export function browseTeam(
  {
    tid,
    q,
    frole,
    sortby,
    sortorder,
    size,
    pagingState,
    email,
    searchable,
  }: {
    tid: string;
    q?: string;
    frole?: ('owner' | 'admin' | 'member' | 'partner')[];
    sortby?: 'name' | 'handle' | 'email' | 'saml_idp' | 'managed_by' | 'role' | 'created_at';
    sortorder?: 'asc' | 'desc';
    size?: number;
    pagingState?: string;
    email?: 'unverified' | 'verified';
    searchable?: boolean;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: SearchResultTeamContact;
  }>(
    `/teams/${encodeURIComponent(tid)}/search${QS.query(
      QS.explode({
        q,
        frole,
        sortby,
        sortorder,
        size,
        pagingState,
        email,
        searchable,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 * Shows the value for search visibility
 */
export function getSearchVisibility(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: TeamSearchVisibilityView;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'operation-denied' | 'no-team-member';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/search-visibility`, {
    ...opts,
  });
}
/**
 * Sets the search visibility for the whole team
 */
export function setSearchVisibility(
  {
    tid,
    teamSearchVisibilityView,
  }: {
    tid: string;
    teamSearchVisibilityView: TeamSearchVisibilityView;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'team-search-visibility-not-enabled' | 'operation-denied' | 'no-team-member';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'no-team';
          message: string;
        };
      }
  >(
    `/teams/${encodeURIComponent(tid)}/search-visibility`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: teamSearchVisibilityView,
    }),
  );
}
/**
 * Get the number of team members as an integer
 */
export function getTeamSize(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: TeamSize;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'invalid-invitation-code';
          message: string;
        };
      }
  >(`/teams/${encodeURIComponent(tid)}/size`, {
    ...opts,
  });
}
/**
 * Get the current server time
 */
export function getServerTime(opts?: Oazapfts.RequestOpts) {
  return oazapfts.fetchJson<{
    status: 200;
    data: ServerTime;
  }>('/time', {
    ...opts,
  });
}
/**
 * Upgrade personal user to team owner
 */
export function upgradePersonalToTeam(
  {
    bindingNewTeamUser,
  }: {
    bindingNewTeamUser: BindingNewTeamUser;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: CreateUserTeam;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'user-already-in-a-team';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(
    '/upgrade-personal-to-team',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: bindingNewTeamUser,
    }),
  );
}
/**
 * Fetch groups accessible to the logged-in user
 */
export function getUserGroups(
  {
    q,
    sortBy,
    sortOrder,
    pageSize,
    lastSeenName,
    lastSeenCreatedAt,
    lastSeenId,
    includeChannels,
    includeMemberCount,
  }: {
    q?: string;
    sortBy?: 'name' | 'created_at';
    sortOrder?: 'asc' | 'desc';
    pageSize?: number;
    lastSeenName?: string;
    lastSeenCreatedAt?: string;
    lastSeenId?: string;
    includeChannels?: boolean;
    includeMemberCount?: boolean;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: UserGroupPage;
  }>(
    `/user-groups${QS.query(
      QS.explode({
        q,
        sort_by: sortBy,
        sort_order: sortOrder,
        page_size: pageSize,
        last_seen_name: lastSeenName,
        last_seen_created_at: lastSeenCreatedAt,
        last_seen_id: lastSeenId,
        include_channels: includeChannels,
        include_member_count: includeMemberCount,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "create-user-group"]
 *
 *
 */
export function createUserGroup(
  {
    newUserGroup,
  }: {
    newUserGroup: NewUserGroup;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: UserGroup;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'user-group-invalid';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'user-group-write-forbidden';
          message: string;
        };
      }
  >(
    '/user-groups',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: newUserGroup,
    }),
  );
}
/**
 * [STUB] Check if a user group name is available
 */
export function checkUserGroupNameAvailable(
  {
    checkUserGroupName,
  }: {
    checkUserGroupName: CheckUserGroupName;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: UserGroupNameAvailability;
  }>(
    '/user-groups/check-name',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: checkUserGroupName,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "delete-user-group"]
 *
 *
 */
export function deleteUserGroup(
  {
    gid,
  }: {
    gid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 204;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'user-group-write-forbidden';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'user-group-not-found';
          message: string;
        };
      }
  >(`/user-groups/${encodeURIComponent(gid)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 * Fetch a group accessible to the logged-in user
 */
export function getUserGroup(
  {
    gid,
    includeChannels,
  }: {
    gid: string;
    includeChannels?: boolean;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: UserGroup;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'user-group-not-found';
          message: string;
        };
      }
  >(
    `/user-groups/${encodeURIComponent(gid)}${QS.query(
      QS.explode({
        include_channels: includeChannels,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "update-user-group"]
 *
 *
 */
export function updateUserGroup(
  {
    gid,
    userGroupUpdate,
  }: {
    gid: string;
    userGroupUpdate: UserGroupUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'user-group-write-forbidden';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'user-group-not-found';
          message: string;
        };
      }
  >(
    `/user-groups/${encodeURIComponent(gid)}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: userGroupUpdate,
    }),
  );
}
/**
 * Replaces the channels with the given list.
 */
export function updateUserGroupChannels(
  {
    gid,
    appendOnly,
    updateUserGroupChannels,
  }: {
    gid: string;
    appendOnly?: boolean;
    updateUserGroupChannels: UpdateUserGroupChannels;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'user-group-write-forbidden';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'user-group-not-found';
          message: string;
        };
      }
  >(
    `/user-groups/${encodeURIComponent(gid)}/channels${QS.query(
      QS.explode({
        append_only: appendOnly,
      }),
    )}`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: updateUserGroupChannels,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "add-users-to-group-bulk"]
 *
 *
 */
export function addUsersToGroupBulk(
  {
    gid,
    userGroupAddUsers,
  }: {
    gid: string;
    userGroupAddUsers: UserGroupAddUsers;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'user-group-invalid';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'user-group-write-forbidden';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'user-group-not-found';
          message: string;
        };
      }
  >(
    `/user-groups/${encodeURIComponent(gid)}/users`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: userGroupAddUsers,
    }),
  );
}
/**
 * [STUB] Update user group members. Replaces the users with the given list.
 */
export function updateUserGroupMembers(
  {
    gid,
    updateUserGroupMembers,
  }: {
    gid: string;
    updateUserGroupMembers: UpdateUserGroupMembers;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/user-groups/${encodeURIComponent(gid)}/users`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: updateUserGroupMembers,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "remove-user-from-group"]
 *
 *
 */
export function removeUserFromGroup(
  {
    gid,
    uid,
  }: {
    gid: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'user-group-invalid';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'user-group-write-forbidden';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'user-group-not-found';
          message: string;
        };
      }
  >(`/user-groups/${encodeURIComponent(gid)}/users/${encodeURIComponent(uid)}`, {
    ...opts,
    method: 'DELETE',
  });
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "add-user-to-group"]
 *
 *
 */
export function addUserToGroup(
  {
    gid,
    uid,
  }: {
    gid: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 204;
      }
    | {
        status: 400;
        data: {
          code: 400;
          label: 'user-group-invalid';
          message: string;
        };
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'user-group-write-forbidden';
          message: string;
        };
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'user-group-not-found';
          message: string;
        };
      }
  >(`/user-groups/${encodeURIComponent(gid)}/users/${encodeURIComponent(uid)}`, {
    ...opts,
    method: 'POST',
  });
}
/**
 * List all clients for a set of user ids
 */
export function listClientsBulkV2(
  {
    limitedQualifiedUserIdList500,
  }: {
    limitedQualifiedUserIdList500: LimitedQualifiedUserIdList500;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: {
      qualified_user_map?: QualifiedUserMapSetPubClient;
    };
  }>(
    '/users/list-clients',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: limitedQualifiedUserIdList500,
    }),
  );
}
/**
 * (deprecated)  Given a map of user IDs to client IDs return a prekey for each one.
 */
export function getMultiUserPrekeyBundleQualified(
  {
    qualifiedUserClients,
  }: {
    qualifiedUserClients: QualifiedUserClients;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: QualifiedUserClientPrekeyMapV4;
  }>(
    '/users/list-prekeys',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: qualifiedUserClients,
    }),
  );
}
/**
 * Get a user by Domain and UserId
 */
export function getUserQualified(
  {
    uidDomain,
    uid,
  }: {
    uidDomain: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: UserProfile;
      }
    | {
        status: 404;
        data: {
          code: 404;
          label: 'not-found';
          message: string;
        };
      }
  >(`/users/${encodeURIComponent(uidDomain)}/${encodeURIComponent(uid)}`, {
    ...opts,
  });
}
/**
 * Get all of a user's clients
 */
export function getUserClientsQualified(
  {
    uidDomain,
    uid,
  }: {
    uidDomain: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: PubClient[];
  }>(`/users/${encodeURIComponent(uidDomain)}/${encodeURIComponent(uid)}/clients`, {
    ...opts,
  });
}
/**
 * Get a specific client of a user
 */
export function getUserClientQualified(
  {
    uidDomain,
    uid,
    client,
  }: {
    uidDomain: string;
    uid: string;
    client: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: PubClient;
  }>(`/users/${encodeURIComponent(uidDomain)}/${encodeURIComponent(uid)}/clients/${encodeURIComponent(client)}`, {
    ...opts,
  });
}
/**
 * Get a prekey for each client of a user.
 */
export function getUsersPrekeyBundleQualified(
  {
    uidDomain,
    uid,
  }: {
    uidDomain: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: PrekeyBundle;
  }>(`/users/${encodeURIComponent(uidDomain)}/${encodeURIComponent(uid)}/prekeys`, {
    ...opts,
  });
}
/**
 * Get a prekey for a specific client of a user.
 */
export function getUsersPrekeysClientQualified(
  {
    uidDomain,
    uid,
    client,
  }: {
    uidDomain: string;
    uid: string;
    client: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: ClientPrekey;
  }>(`/users/${encodeURIComponent(uidDomain)}/${encodeURIComponent(uid)}/prekeys/${encodeURIComponent(client)}`, {
    ...opts,
  });
}
/**
 * Get a user's supported protocols
 */
export function getSupportedProtocols(
  {
    uidDomain,
    uid,
  }: {
    uidDomain: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: BaseProtocol[];
  }>(`/users/${encodeURIComponent(uidDomain)}/${encodeURIComponent(uid)}/supported-protocols`, {
    ...opts,
  });
}
/**
 * Resend email address validation email.
 */
export function updateUserEmail(
  {
    uid,
    emailUpdate,
  }: {
    uid: string;
    emailUpdate: EmailUpdate;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: unknown[];
  }>(
    `/users/${encodeURIComponent(uid)}/email`,
    oazapfts.json({
      ...opts,
      method: 'PUT',
      body: emailUpdate,
    }),
  );
}
/**
 * Get a user's rich info
 */
export function getRichInfo(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<
    | {
        status: 200;
        data: RichInfoAssocList;
      }
    | {
        status: 403;
        data: {
          code: 403;
          label: 'insufficient-permissions';
          message: string;
        };
      }
  >(`/users/${encodeURIComponent(uid)}/rich-info`, {
    ...opts,
  });
}
/**
 * Set user's visibility in search
 */
export function setUserSearchable(
  {
    uid,
    setSearchable,
  }: {
    uid: string;
    setSearchable: SetSearchable;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchJson<{
    status: 200;
    data: unknown[];
  }>(
    `/users/${encodeURIComponent(uid)}/searchable`,
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: setSearchable,
    }),
  );
}
/**
 * Send a verification code to a given email address.
 */
export function sendVerificationCode(
  {
    sendVerificationCode,
  }: {
    sendVerificationCode: SendVerificationCode;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    '/verification-code/send',
    oazapfts.json({
      ...opts,
      method: 'POST',
      body: sendVerificationCode,
    }),
  );
}
/**
 * Establish websocket connection
 */
export function websocket(
  {
    client,
  }: {
    client?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.fetchText(
    `/websocket${QS.query(
      QS.explode({
        client,
      }),
    )}`,
    {
      ...opts,
    },
  );
}
