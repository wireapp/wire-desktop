/**
 * Wire-Server Internal API (brig)
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from '@oazapfts/runtime';
import * as QS from '@oazapfts/runtime/query';
export const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders> = {
  headers: {},
  baseUrl: 'http://localhost:9082',
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
  server1: 'http://localhost:9082',
};
export type Uuid = string;
export type UserSetMjQ1Nde3Nzc5 = {
  users: Uuid[];
};
export type UserClients = {
  [key: string]: string[];
};
export type UserClientsFull = object;
export type UncheckedPrekeyBundleLtu1MzQzOTgy = {
  id: number;
  key: string;
};
export type LegalHoldClientRequestOdy0NjEwNjEw = {
  last_prekey: UncheckedPrekeyBundleLtu1MzQzOTgy;
  requester: Uuid;
};
export type ClientCapabilityMty2NdAzMjM3 = 'legalhold-implicit-consent' | 'consumable-notifications';
export type ClientCapabilityList = ClientCapabilityMty2NdAzMjM3[];
export type ClientClassNjE3MDgwNzcx = 'phone' | 'tablet' | 'desktop' | 'legalhold';
export type MlsPublicKeys = {
  [key: string]: string;
};
export type ClientTypeMjQ0OtQwMzcw = 'temporary' | 'permanent' | 'legalhold';
export type Ascii = string;
export type NewClientODg1NjY4Njgy = {
  capabilities?: ClientCapabilityList;
  class?: ClientClassNjE3MDgwNzcx;
  /** The cookie label, i.e. the label used when logging in. */
  cookie?: string;
  label?: string;
  lastkey: UncheckedPrekeyBundleLtu1MzQzOTgy;
  mls_public_keys?: MlsPublicKeys;
  model?: string;
  /** The password of the authenticated user for verification. Note: Required for registration of the 2nd, 3rd, ... client. */
  password?: string;
  /** Prekeys for other clients to establish OTR sessions. */
  prekeys: UncheckedPrekeyBundleLtu1MzQzOTgy[];
  type: ClientTypeMjQ0OtQwMzcw;
  verification_code?: Ascii;
};
export type UtcTime = string;
export type UtcTimeMillis = string;
export type ClientMtm1OTcwOtq1 = {
  capabilities?: ClientCapabilityList;
  class?: ClientClassNjE3MDgwNzcx;
  cookie?: string;
  /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
  id: string;
  label?: string;
  last_active?: UtcTime;
  mls_public_keys?: MlsPublicKeys;
  model?: string;
  time: UtcTimeMillis;
  type: ClientTypeMjQ0OtQwMzcw;
};
export type Domain = string;
export type QualifiedIdIdTagUserLtq1NtIwNdm1 = {
  domain: Domain;
  id: Uuid;
};
export type UpdateConnectionsInternalTagMjY3OTg2Mda0 =
  | 'BlockForMissingLHConsent'
  | 'RemoveLHBlocksInvolving'
  | 'CreateConnectionForTest';
export type UpdateConnectionsInternalOdm2NjkxOde2 = {
  other: QualifiedIdIdTagUserLtq1NtIwNdm1;
  others: Uuid[];
  tag: UpdateConnectionsInternalTagMjY3OTg2Mda0;
  user: Uuid;
};
export type HttpsUrl = string;
export type HttpsUrlMaybeHttpsUrlLtq1MDkyMzY2 = {
  config_url: HttpsUrl;
  webapp_url?: HttpsUrl;
};
export type DomainRedirectTagLty3NjU1MdEy =
  | 'none'
  | 'locked'
  | 'sso'
  | 'backend'
  | 'no-registration'
  | 'pre-authorized';
export type TeamInviteTagLtQyNtMyNzA0 = 'allowed' | 'not-allowed' | 'team';
export type DomainRegistrationResponseV10MjE0NDkxOdy4 = {
  authorized_team?: Uuid;
  backend: HttpsUrlMaybeHttpsUrlLtq1MDkyMzY2;
  dns_verification_token?: Ascii;
  domain: Domain;
  domain_redirect: DomainRedirectTagLty3NjU1MdEy;
  sso_code: Uuid;
  team: Uuid;
  team_invite: TeamInviteTagLtQyNtMyNzA0;
};
export type DomainRegistrationUpdateLtQzNjU4Oda2 = {
  backend: HttpsUrlMaybeHttpsUrlLtq1MDkyMzY2;
  domain_redirect: DomainRedirectTagLty3NjU1MdEy;
  sso_code: Uuid;
  team: Uuid;
  team_invite: TeamInviteTagLtQyNtMyNzA0;
};
export type Handle = string;
export type EjpdRequestBodyMjc1Mde0NdAx = {
  EJPDRequest: Handle[];
};
export type QualifiedIdIdTagConversationLtq5NdQwNjc5 = {
  domain: Domain;
  id: Uuid;
};
export type EjpdConvInfoNDgwMdIyMdAw = {
  conv_id: QualifiedIdIdTagConversationLtq5NdQwNjc5;
  conv_name: string;
};
export type Email = string;
export type PhoneNumber = string;
export type EjpdResponseItemLeafLtEyNTcxMjAx = {
  Assets?: string[];
  Conversations?: EjpdConvInfoNDgwMdIyMdAw[];
  Email?: Email;
  Handle?: Handle;
  Name: string;
  Phone?: PhoneNumber;
  PushTokens: string[];
  TeamId?: Uuid;
  UserId: QualifiedIdIdTagUserLtq1NtIwNdm1;
};
export type RelationLte4Otu5MTk4 =
  | 'accepted'
  | 'blocked'
  | 'pending'
  | 'ignored'
  | 'sent'
  | 'cancelled'
  | 'missing-legalhold-consent';
export type EjpdContactLTgwNde1NdAy = {
  contact_item: EjpdResponseItemLeafLtEyNTcxMjAx;
  contact_relation: RelationLte4Otu5MTk4;
};
export type NewListTypeODkwNzA4Mtm3 = 'list_complete' | 'list_truncated';
export type EjpdTeamContactsLti3MjE0NzY3 = {
  ListType: NewListTypeODkwNzA4Mtm3;
  TeamContacts: EjpdResponseItemLeafLtEyNTcxMjAx[];
};
export type EjpdResponseItemRootNzU2Mjg1MdIx = {
  Assets?: string[];
  Contacts?: EjpdContactLTgwNde1NdAy[];
  Conversations?: EjpdConvInfoNDgwMdIyMdAw[];
  Email?: Email;
  Handle?: Handle;
  Name: string;
  Phone?: PhoneNumber;
  PushTokens: string[];
  TeamContacts?: EjpdTeamContactsLti3MjE0NzY3;
  TeamId?: Uuid;
  UserId: QualifiedIdIdTagUserLtq1NtIwNdm1;
};
export type EjpdResponseBodyNzc0MzMxNDc3 = {
  EJPDResponse: EjpdResponseItemRootNzU2Mjg1MdIx[];
};
export type FederationRestrictionTagLty4NtIxNjkx = 'allow_all' | 'restrict_by_team';
export type FederationRestrictionMjA4Otq1Oda4 = {
  tag: FederationRestrictionTagLty4NtIxNjkx;
  value: Uuid[];
};
export type FederatedUserSearchPolicyMzkwOda4Mtm3 = 'no_search' | 'exact_handle_search' | 'full_search';
export type FederationDomainConfigNjEwMtYyMTc0 = {
  domain: Domain;
  restriction: FederationRestrictionMjA4Otq1Oda4;
  search_policy: FederatedUserSearchPolicyMzkwOda4Mtm3;
};
export type FederationStrategyLtq4MjIxNTc5 = 'allowNone' | 'allowAll' | 'allowDynamic';
export type FederationDomainConfigsMjMzMtYzMzQ1 = {
  remotes: FederationDomainConfigNjEwMtYyMTc0[];
  strategy: FederationStrategyLtq4MjIxNTc5;
  update_interval: number;
};
export type FederationRemoteTeamLTcyMzQ1Njgx = {
  team_id: Uuid;
};
export type IdpChangedNotificationTagNTcwNjc4MzY3 = 'created' | 'deleted' | 'updated';
export type Uri = string;
export type WireIdPOdMzOtExMzYw = {
  apiVersion: 'WireIdPAPIV1' | 'WireIdPAPIV2';
  domain: string;
  handle: string;
  oldIssuers: Uri[];
  replacedBy: string;
  team: Uuid;
};
export type SignedCertificate = string;
export type IdPMetadataMti3NzE4Mta0 = {
  certAuthnResponse: SignedCertificate[];
  issuer: Uri;
  requestURI: string;
};
export type IdPConfigWireIdPNda5Mte4Mjk0 = {
  extraInfo: WireIdPOdMzOtExMzYw;
  id: Uri;
  metadata: IdPMetadataMti3NzE4Mta0;
};
export type IdpChangedNotificationLtu0NjAxMjk0 = {
  tag: IdpChangedNotificationTagNTcwNjc4MzY3;
  value: {
    idp: IdPConfigWireIdPNda5Mte4Mjk0;
    new: IdPConfigWireIdPNda5Mte4Mjk0;
    old: IdPConfigWireIdPNda5Mte4Mjk0;
    user: Uuid;
  };
};
export type LegalHoldLoginODkzMtIzMjEy = {
  label?: string;
  password?: string;
  user: Uuid;
};
export type TokenTypeNTkyMzk4MjIz = 'Bearer';
export type AccessTokenOdIyMTczMjMw = {
  /** The opaque access token string */
  access_token: string;
  /** The number of seconds this token is valid */
  expires_in: number;
  token_type: TokenTypeNTkyMzk4MjIz;
  user: Uuid;
};
export type ClientInfoLti4ODg0Mtq1 = {
  /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
  id: string;
  mls: boolean;
  mls_signature_key?: string;
};
export type RedirectUrl = string;
export type OAuthClientConfigLTgzOtAwNjU1 = {
  /** The name of the application. This will be shown to the user when they are asked to authorize the application. The name must be between 6 and 256 characters long. */
  application_name: string;
  redirect_url: RedirectUrl;
};
export type OAuthClientPlainTextSecret = string;
export type OAuthClientCredentialsNTg1NDc5MjE2 = {
  client_id: Uuid;
  client_secret: OAuthClientPlainTextSecret;
};
export type OAuthClientNzExMti5NtIy = {
  application_name: string;
  client_id: Uuid;
  redirect_url: RedirectUrl;
};
export type KeyValuePairLtUzOdIxMdIw = {
  code: Ascii;
  key: Ascii;
};
export type EmailUpdateNjQ5MDg1Oty0 = {
  email: Email;
};
export type SsoLoginLtQxOtUzODk5 = {
  label?: string;
  user: Uuid;
};
export type FeatureStatusLtMzMtUwOdEw = 'enabled' | 'disabled';
export type TeamStatusSearchVisibilityInboundConfigLti0Ody3Njgx = {
  status: FeatureStatusLtMzMtUwOdEw;
  team: Uuid;
};
export type InvitationCodeMjU5MjY0NzQ0 = {
  code: Ascii;
};
export type RoleLtIzMjAzMjky = 'owner' | 'admin' | 'member' | 'partner';
export type UriRefAbsolute = string;
export type InvitationNTkzMdYwODc1 = {
  created_at: UtcTimeMillis;
  created_by?: Uuid;
  email: Email;
  id: Uuid;
  /** Name of the invitee (1 - 128 characters) */
  name?: string;
  role?: RoleLtIzMjAzMjky;
  team: Uuid;
  url?: UriRefAbsolute;
};
export type Locale = string;
export type NewUserScimInvitationLte4NzY5NTcy = {
  email: Email;
  external_id: string;
  locale?: Locale;
  name: string;
  role: RoleLtIzMjAzMjky;
  team_id: Uuid;
  user_id: Uuid;
};
export type AssetKey = string;
export type AssetSizeOtAwMda3Ody2 = 'preview' | 'complete';
export type MtYxOti3NjM3 = 'image';
export type AssetLtIyMjc1NdEz = {
  key: AssetKey;
  size?: AssetSizeOtAwMda3Ody2;
  type: MtYxOti3NjM3;
};
export type ManagedByNti0ODc0NtQx = 'wire' | 'scim';
export type PictDeprecatedUseAssetsInstead = object[];
export type ServiceRefLTgxMjY3NzAz = {
  id: Uuid;
  provider: Uuid;
};
export type UserSsoId = {
  scim_external_id?: string;
  subject?: string;
  tenant?: string;
};
export type AccountStatusNzkzNdu1Odu5 = 'active' | 'suspended' | 'deleted' | 'ephemeral' | 'pending-invitation';
export type BaseProtocolTagLtm0Mde1NtEx = 'proteus' | 'mls';
export type UserTypeLtu1Otu4Otm5 = 'regular' | 'app' | 'bot';
export type UserNjA4OtQwMtq4 = {
  accent_id: number;
  assets?: AssetLtIyMjc1NdEz[];
  deleted?: boolean;
  email?: Email;
  email_unvalidated?: Email;
  expires_at?: UtcTimeMillis;
  handle?: Handle;
  id?: Uuid;
  locale: Locale;
  managed_by?: ManagedByNti0ODc0NtQx;
  name: string;
  picture?: PictDeprecatedUseAssetsInstead;
  qualified_id: QualifiedIdIdTagUserLtq1NtIwNdm1;
  searchable?: boolean;
  service?: ServiceRefLTgxMjY3NzAz;
  sso_id?: UserSsoId;
  status: AccountStatusNzkzNdu1Odu5;
  supported_protocols?: BaseProtocolTagLtm0Mde1NtEx[];
  team?: Uuid;
  text_status?: string;
  type: UserTypeLtu1Otu4Otm5;
};
export type TeamSizeLtMzMzk2MTk1 = {
  /** Total team members (teamSizeRegulars + teamSizeApps). */
  teamSize?: number;
  /** Number of apps in team. */
  teamSizeApps: number;
  /** Number of regular users in team. */
  teamSizeRegulars: number;
};
export type UpdateGroupInternalRequestNjU3Oda4MTg5 = {
  group_id: Uuid;
  members?: Uuid[];
  name?: string;
  team_id: Uuid;
};
export type NewUserGroupMzYxOdu0Otu1 = {
  members: Uuid[];
  name: string;
};
export type CreateGroupInternalRequestNdYzMdu0Mdu5 = {
  creator_user_id?: Uuid;
  managed_by: ManagedByNti0ODc0NtQx;
  new_group: NewUserGroupMzYxOdu0Otu1;
  team_id: Uuid;
};
export type UserGroupIdentityNTg4Mty1MjEx = {
  channels?: QualifiedIdIdTagConversationLtq5NdQwNjc5[];
  channelsCount?: number;
  createdAt: UtcTimeMillis;
  id: Uuid;
  managedBy: ManagedByNti0ODc0NtQx;
  members: Uuid[];
  membersCount?: number;
  name: string;
};
export type UserGroupPageUserGroupIdentityNtm4OTc3MDky = {
  page: UserGroupIdentityNTg4Mty1MjEx[];
  total: number;
};
export type AlphaLte4NdUxNdq4 =
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
export type BindingNewTeamUserLty0MdQxMdEw = {
  currency?: AlphaLte4NdUxNdq4;
  icon: Icon;
  /** The decryption key for the team icon S3 asset */
  icon_key?: string;
  /** team name */
  name: string;
};
export type NewUserPlainTextPassword8Lti4MzI5NzQx = {
  accent_id?: number;
  assets?: AssetLtIyMjc1NdEz[];
  email?: Email;
  email_code?: Ascii;
  expires_in?: number;
  invitation_code?: Ascii;
  label?: string;
  locale?: Locale;
  managed_by?: ManagedByNti0ODc0NtQx;
  name: string;
  password?: string;
  picture?: PictDeprecatedUseAssetsInstead;
  sso_id?: UserSsoId;
  supported_protocols?: BaseProtocolTagLtm0Mde1NtEx[];
  team?: BindingNewTeamUserLty0MdQxMdEw;
  team_code?: Ascii;
  team_id?: Uuid;
  uuid?: Uuid;
};
export type HavePendingInvitationsOte3MtYyNtAw = true | false;
export type GetByNzE2ndG3Njcx = {
  handles: Handle[];
  ids: Uuid[];
  include_pending_invitations: HavePendingInvitationsOte3MtYyNtAw;
  include_users_with_expired_invitations: boolean;
  include_users_without_identity: boolean;
};
export type GetActivationCodeRespLtm5OTcwODkw = {
  code: Ascii;
  key: Ascii;
};
export type ConnectionsStatusRequestODg2NtYwMdQw = {
  from: Uuid[];
  to?: Uuid[];
};
export type ConnectionStatusLte5MzQ3MTcw = {
  from: Uuid;
  status: RelationLte4Otu5MTk4;
  to: Uuid;
};
export type ConnectionsStatusRequestV2NzUzNzg2Nta1 = {
  from: Uuid[];
  relation?: RelationLte4Otu5MTk4;
  to?: QualifiedIdIdTagUserLtq1NtIwNdm1[];
};
export type ConnectionStatusV2Nda4NDk3NdEw = {
  from: Uuid;
  qualified_to: QualifiedIdIdTagUserLtq1NtIwNdm1;
  status: RelationLte4Otu5MTk4;
};
export type LocaleUpdateLTgzNjgyOtEw = {
  locale: Locale;
};
export type LoginCode = string;
export type PendingLoginCodeLTk3Oti3MtYw = {
  code: LoginCode;
  expires_in: number;
};
export type GetPasswordResetCodeRespNdq4Mtu1Njc5 = {
  code: Ascii;
  key: Ascii;
};
export type GetRichInfoMultiResponse = unknown;
export type RichFieldLTgwMzc0MTg2 = {
  type: string;
  value: string;
};
export type RichInfoAssocList = {
  fields: RichFieldLTgwMzc0MTg2[];
  version: number;
};
export type RichInfo = {
  'urn:ietf:params:scim:schemas:extension:wire:1.0:User': {
    [key: string]: string;
  };
  'urn:wire:scim:schemas:profile:1.0': RichInfoAssocList;
};
export type NewUserSparMzk5Mti0OTgx = {
  newUserSparDisplayName: string;
  newUserSparHandle?: Handle;
  newUserSparLocale?: Locale;
  newUserSparManagedBy: ManagedByNti0ODc0NtQx;
  newUserSparRichInfo?: RichInfo;
  newUserSparRole: RoleLtIzMjAzMjky;
  newUserSparSSOId: UserSsoId;
  newUserSparTeamId: Uuid;
  newUserSparUUID: Uuid;
};
export type UserIdsNtm1MzkyNtq2 = {
  ids: Uuid[];
};
export type TeamExportUserLTgyMjAxMzg2 = {
  created_on?: UtcTimeMillis;
  display_name: string;
  email?: Email;
  handle?: Handle;
  idp_issuer?: HttpsUrl;
  invited_by?: Handle;
  last_active?: UtcTime;
  managed_by: ManagedByNti0ODc0NtQx;
  num_devices: number;
  role?: RoleLtIzMjAzMjky;
  saml_name_id: string;
  scim_external_id: string;
  scim_rich_info?: RichInfo;
  status?: AccountStatusNzkzNdu1Odu5;
  user_id: Uuid;
};
export type ConferenceCallingConfigBCoveredIdentityNdMwMjcyMzM1 = {
  useSFTForOneToOneCalls?: boolean;
};
export type FeatureConferenceCallingConfigBBareIdentityNjc2NTcxNti3 = {
  config?: ConferenceCallingConfigBCoveredIdentityNdMwMjcyMzM1;
  status: FeatureStatusLtMzMtUwOdEw;
  ttl?: number;
};
export type HandleUpdateNti4NDk1OtAx = {
  handle: string;
};
export type ManagedByUpdateLtu3Odm2ndG2 = {
  managed_by: ManagedByNti0ODc0NtQx;
};
export type NameUpdateOdAzNzI5Nty1 = {
  name: string;
};
export type VerificationActionLtu0MzYxNzUz = 'create_scim_token' | 'login' | 'delete_team';
export type ReAuthUserNzk5Ndu0Njc4 = {
  action?: VerificationActionLtu0MzYxNzUz;
  password?: string;
  verification_code?: Ascii;
};
export type RichInfoUpdateNti5MjI1MTgy = {
  rich_info: RichInfoAssocList;
};
export type AccountStatusRespLTg2Mte1OdAz = {
  status: AccountStatusNzkzNdu1Odu5;
};
export type AccountStatusUpdateNte4Mzc0Mtm3 = {
  status: AccountStatusNzkzNdu1Odu5;
};
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iListClients"]
 *
 *
 */
export function iListClients(
  {
    userSetMjQ1Nde3Nzc5,
  }: {
    userSetMjQ1Nde3Nzc5: UserSetMjQ1Nde3Nzc5;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: UserClients;
    }>(
      '/i/clients',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: userSetMjQ1Nde3Nzc5,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iListClientsFull"]
 *
 *
 */
export function iListClientsFull(
  {
    userSetMjQ1Nde3Nzc5,
  }: {
    userSetMjQ1Nde3Nzc5: UserSetMjQ1Nde3Nzc5;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: UserClientsFull;
    }>(
      '/i/clients/full',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: userSetMjQ1Nde3Nzc5,
      }),
    ),
  );
}
/**
 * This endpoint can lead to the following events being sent: ClientRemoved event to the user; UserLegalHoldDisabled event to contacts of the user
 */
export function iLegalholdDeleteClient(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(`/i/clients/legalhold/${encodeURIComponent(uid)}`, {
      ...opts,
      method: 'DELETE',
    }),
  );
}
/**
 * This endpoint can lead to the following events being sent: LegalHoldClientRequested event to contacts of the user
 */
export function iLegalholdAddClient(
  {
    uid,
    legalHoldClientRequestOdy0NjEwNjEw,
  }: {
    uid: string;
    legalHoldClientRequestOdy0NjEwNjEw: LegalHoldClientRequestOdy0NjEwNjEw;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/clients/legalhold/${encodeURIComponent(uid)}/request`,
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: legalHoldClientRequestOdy0NjEwNjEw,
      }),
    ),
  );
}
/**
 * This endpoint can lead to the following events being sent: ClientAdded event to the user; ClientRemoved event to the user, if removing old clients due to max number of clients; UserLegalHoldEnabled event to contacts of the user, if client type is legalhold.
 */
export function iAddClient(
  {
    uid,
    skipReauth,
    zConnection,
    newClientODg1NjY4Njgy,
  }: {
    uid: string;
    skipReauth?: boolean;
    zConnection?: string;
    newClientODg1NjY4Njgy: NewClientODg1NjY4Njgy;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 201;
      data: ClientMtm1OTcwOtq1;
    }>(
      `/i/clients/${encodeURIComponent(uid)}${QS.query(
        QS.explode({
          skip_reauth: skipReauth,
        }),
      )}`,
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: newClientODg1NjY4Njgy,
        headers: oazapfts.mergeHeaders(opts?.headers, {
          'Z-Connection': zConnection,
        }),
      }),
    ),
  );
}
/**
 * Update last_active field of a client
 */
export function updateClientLastActive(
  {
    uid,
    client,
  }: {
    uid: string;
    client: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchText(`/i/clients/${encodeURIComponent(uid)}/${encodeURIComponent(client)}/activity`, {
      ...opts,
      method: 'POST',
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iConnectionUpdate"]
 *
 *
 */
export function iConnectionUpdate(
  {
    updateConnectionsInternalOdm2NjkxOde2,
  }: {
    updateConnectionsInternalOdm2NjkxOde2: UpdateConnectionsInternalOdm2NjkxOde2;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      '/i/connections/connection-update',
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: updateConnectionsInternalOdm2NjkxOde2,
      }),
    ),
  );
}
/**
 * Deletes a domain
 */
export function domainRegistrationDelete(
  {
    domain,
  }: {
    domain: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchText(`/i/domain-registration/${encodeURIComponent(domain)}`, {
      ...opts,
      method: 'DELETE',
    }),
  );
}
/**
 * Returns the current entry in the domain table for that domain
 */
export function domainRegistrationGet(
  {
    domain,
  }: {
    domain: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: DomainRegistrationResponseV10MjE0NDkxOdy4;
    }>(`/i/domain-registration/${encodeURIComponent(domain)}`, {
      ...opts,
    }),
  );
}
/**
 * Updates a domain
 */
export function domainRegistrationUpdate(
  {
    domain,
    domainRegistrationUpdateLtQzNjU4Oda2,
  }: {
    domain: string;
    domainRegistrationUpdateLtQzNjU4Oda2: DomainRegistrationUpdateLtQzNjU4Oda2;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchText(
      `/i/domain-registration/${encodeURIComponent(domain)}`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: domainRegistrationUpdateLtQzNjU4Oda2,
      }),
    ),
  );
}
/**
 * Adds a domain to the Deny-list
 */
export function domainRegistrationLock(
  {
    domain,
  }: {
    domain: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchText(`/i/domain-registration/${encodeURIComponent(domain)}/lock`, {
      ...opts,
      method: 'POST',
    }),
  );
}
/**
 * Pre-authorizes a domain
 */
export function domainRegistrationPreAuthorize(
  {
    domain,
  }: {
    domain: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchText(`/i/domain-registration/${encodeURIComponent(domain)}/preauthorize`, {
      ...opts,
      method: 'POST',
    }),
  );
}
/**
 * Un-authorizes a domain
 */
export function domainRegistrationUnauthorize(
  {
    domain,
  }: {
    domain: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchText(`/i/domain-registration/${encodeURIComponent(domain)}/unauthorize`, {
      ...opts,
      method: 'POST',
    }),
  );
}
/**
 * Unlocks a domain
 */
export function domainRegistrationUnlock(
  {
    domain,
  }: {
    domain: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchText(`/i/domain-registration/${encodeURIComponent(domain)}/unlock`, {
      ...opts,
      method: 'POST',
    }),
  );
}
/**
 * Identify users for law enforcement.  Wire has legal requirements to cooperate with the authorities.  The wire backend operations team uses this to answer identification requests manually.  It is our best-effort representation of the minimum required information we need to hand over about targets and (in some cases) their communication peers.  For more information, consult ejpd.admin.ch.
 */
export function ejpdRequest(
  {
    includeContacts,
    ejpdRequestBodyMjc1Mde0NdAx,
  }: {
    includeContacts?: boolean;
    ejpdRequestBodyMjc1Mde0NdAx: EjpdRequestBodyMjc1Mde0NdAx;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: EjpdResponseBodyNzc0MzMxNDc3;
    }>(
      `/i/ejpd-request${QS.query(
        QS.explode({
          include_contacts: includeContacts,
        }),
      )}`,
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: ejpdRequestBodyMjc1Mde0NdAx,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-federation-remotes"]
 *
 * See https://docs.wire.com/understand/federation/backend-communication.html#configuring-remote-connections for background.
 */
export function getFederationRemotes(opts?: Oazapfts.RequestOpts) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: FederationDomainConfigsMjMzMtYzMzQ1;
    }>('/i/federation/remotes', {
      ...opts,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "add-federation-remotes"]
 *
 * See https://docs.wire.com/understand/federation/backend-communication.html#configuring-remote-connections for background.
 */
export function addFederationRemotes(
  {
    federationDomainConfigNjEwMtYyMTc0,
  }: {
    federationDomainConfigNjEwMtYyMTc0: FederationDomainConfigNjEwMtYyMTc0;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: unknown[];
    }>(
      '/i/federation/remotes',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: federationDomainConfigNjEwMtYyMTc0,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "update-federation-remotes"]
 *
 * See https://docs.wire.com/understand/federation/backend-communication.html#configuring-remote-connections for background.
 */
export function updateFederationRemotes(
  {
    domain,
    federationDomainConfigNjEwMtYyMTc0,
  }: {
    domain: string;
    federationDomainConfigNjEwMtYyMTc0: FederationDomainConfigNjEwMtYyMTc0;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: unknown[];
    }>(
      `/i/federation/remotes/${encodeURIComponent(domain)}`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: federationDomainConfigNjEwMtYyMTc0,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-federation-remote-teams"]
 *
 * Get a list of teams from a remote domain that our backend is allowed to federate with.
 */
export function getFederationRemoteTeams(
  {
    domain,
  }: {
    domain: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: FederationRemoteTeamLTcyMzQ1Njgx[];
    }>(`/i/federation/remotes/${encodeURIComponent(domain)}/teams`, {
      ...opts,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "add-federation-remote-team"]
 *
 * Add a remote team to the list of teams that are allowed to federate with our domain
 */
export function addFederationRemoteTeam(
  {
    domain,
    federationRemoteTeamLTcyMzQ1Njgx,
  }: {
    domain: string;
    federationRemoteTeamLTcyMzQ1Njgx: FederationRemoteTeamLTcyMzQ1Njgx;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: unknown[];
    }>(
      `/i/federation/remotes/${encodeURIComponent(domain)}/teams`,
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: federationRemoteTeamLTcyMzQ1Njgx,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "delete-federation-remote-team"]
 *
 * Remove a remote team from the list of teams that are allowed to federate with our domain
 */
export function deleteFederationRemoteTeam(
  {
    domain,
    team,
  }: {
    domain: string;
    team: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: unknown[];
    }>(`/i/federation/remotes/${encodeURIComponent(domain)}/teams/${encodeURIComponent(team)}`, {
      ...opts,
      method: 'DELETE',
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iHeadHandle"]
 *
 *
 */
export function iHeadHandle(
  {
    handle,
  }: {
    handle: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 200;
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
        }
    >(`/i/handles/${encodeURIComponent(handle)}`, {
      ...opts,
      method: 'HEAD',
    }),
  );
}
/**
 * Send an email about IdP creation, deletion or update to all team admins and owners
 */
export function sendIdpChangedEmail(
  {
    idpChangedNotificationLtu0NjAxMjk0,
  }: {
    idpChangedNotificationLtu0NjAxMjk0: IdpChangedNotificationLtu0NjAxMjk0;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: unknown[];
    }>(
      '/i/idp/send-idp-changed-email',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: idpChangedNotificationLtu0NjAxMjk0,
      }),
    ),
  );
}
/**
 * make index updates visible (e.g. for integration testing)
 */
export function indexRefresh(opts?: Oazapfts.RequestOpts) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>('/i/index/refresh', {
      ...opts,
      method: 'POST',
    }),
  );
}
/**
 * updates the search index for a single user
 */
export function updateSearchIndex(
  {
    userId,
  }: {
    userId: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(`/i/index/update/${encodeURIComponent(userId)}`, {
      ...opts,
      method: 'POST',
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "legalhold-login"]
 *
 *
 */
export function legalholdLogin(
  {
    legalHoldLoginODkzMtIzMjEy,
  }: {
    legalHoldLoginODkzMtIzMjEy: LegalHoldLoginODkzMtIzMjEy;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: AccessTokenOdIyMTczMjMw;
    }>(
      '/i/legalhold-login',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: legalHoldLoginODkzMtIzMjEy,
      }),
    ),
  );
}
/**
 * Return information on a single MLS client
 */
export function getMlsClient(
  {
    user,
    client,
    ciphersuite,
  }: {
    user: string;
    client: string;
    ciphersuite: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 200;
          data: ClientInfoLti4ODg0Mtq1;
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
      `/i/mls/client/${encodeURIComponent(user)}/${encodeURIComponent(client)}${QS.query(
        QS.explode({
          ciphersuite,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 * Return all clients and all MLS-capable clients of a user
 */
export function getMlsClients(
  {
    user,
    ciphersuite,
  }: {
    user: string;
    ciphersuite: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 200;
          data: ClientInfoLti4ODg0Mtq1[];
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
      `/i/mls/clients/${encodeURIComponent(user)}${QS.query(
        QS.explode({
          ciphersuite,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 * Register an OAuth client
 */
export function createOauthClient(
  {
    oAuthClientConfigLTgzOtAwNjU1,
  }: {
    oAuthClientConfigLTgzOtAwNjU1: OAuthClientConfigLTgzOtAwNjU1;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 200;
          data: OAuthClientCredentialsNTg1NDc5MjE2;
        }
      | {
          status: 403;
          data: {
            code: 403;
            label: 'forbidden';
            message: string;
          };
        }
    >(
      '/i/oauth/clients',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: oAuthClientConfigLTgzOtAwNjU1,
      }),
    ),
  );
}
/**
 * Delete OAuth client
 */
export function deleteOauthClient(
  {
    id,
  }: {
    id: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
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
    >(`/i/oauth/clients/${encodeURIComponent(id)}`, {
      ...opts,
      method: 'DELETE',
    }),
  );
}
/**
 * Get OAuth client by id
 */
export function iGetOauthClient(
  {
    id,
  }: {
    id: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 200;
          data: OAuthClientNzExMti5NtIy;
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
    >(`/i/oauth/clients/${encodeURIComponent(id)}`, {
      ...opts,
    }),
  );
}
/**
 * Update OAuth client
 */
export function updateOauthClient(
  {
    id,
    oAuthClientConfigLTgzOtAwNjU1,
  }: {
    id: string;
    oAuthClientConfigLTgzOtAwNjU1: OAuthClientConfigLTgzOtAwNjU1;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 200;
          data: OAuthClientNzExMti5NtIy;
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
    >(
      `/i/oauth/clients/${encodeURIComponent(id)}`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: oAuthClientConfigLTgzOtAwNjU1,
      }),
    ),
  );
}
/**
 * Retrieve activation code via api instead of email (for testing only)
 */
export function getProviderActivationCode(
  {
    email,
  }: {
    email: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: KeyValuePairLtUzOdIxMdIw;
    }>(
      `/i/provider/activation-code${QS.query(
        QS.explode({
          email,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 * Retrieve password-reset code via api instead of email (for testing only)
 */
export function getProviderPasswordResetCode(
  {
    email,
  }: {
    email: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: KeyValuePairLtUzOdIxMdIw;
    }>(
      `/i/provider/password-reset-code${QS.query(
        QS.explode({
          email,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 * Internal email update and activation. Used in tests and in spar for validating emails obtained via scim or saml implicit user creation. If the `validate` query parameter is false or missing, only update the email and do not activate.
 */
export function putSelfEmail(
  {
    emailActivation,
    validate,
    activate,
    emailUpdateNjQ5MDg1Oty0,
  }: {
    emailActivation?: 'send_activation_email' | 'auto_activate';
    validate?: boolean;
    activate?: boolean;
    emailUpdateNjQ5MDg1Oty0: EmailUpdateNjQ5MDg1Oty0;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 202;
          data: unknown[];
        }
      | {
          status: 204;
          data: unknown[];
        }
    >(
      `/i/self/email${QS.query(
        QS.explode({
          email_activation: emailActivation,
          validate,
          activate,
        }),
      )}`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: emailUpdateNjQ5MDg1Oty0,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "sso-login"]
 *
 *
 */
export function ssoLogin(
  {
    persist,
    ssoLoginLtQxOtUzODk5,
  }: {
    persist?: boolean;
    ssoLoginLtQxOtUzODk5: SsoLoginLtQxOtUzODk5;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: AccessTokenOdIyMTczMjMw;
    }>(
      `/i/sso-login${QS.query(
        QS.explode({
          persist,
        }),
      )}`,
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: ssoLoginLtQxOtUzODk5,
      }),
    ),
  );
}
/**
 * do nothing, just check liveness (NB: this works for both get, head)
 */
export function getStatus(opts?: Oazapfts.RequestOpts) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>('/i/status', {
      ...opts,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "updateSearchVisibilityInbound"]
 *
 *
 */
export function updateSearchVisibilityInbound(
  {
    teamStatusSearchVisibilityInboundConfigLti0Ody3Njgx,
  }: {
    teamStatusSearchVisibilityInboundConfigLti0Ody3Njgx: TeamStatusSearchVisibilityInboundConfigLti0Ody3Njgx;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: unknown[];
    }>(
      '/i/teams',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: teamStatusSearchVisibilityInboundConfigLti0Ody3Njgx,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-invitation-code"]
 *
 *
 */
export function getInvitationCode(
  {
    team,
    invitationId,
  }: {
    team: string;
    invitationId: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: InvitationCodeMjU5MjY0NzQ0;
    }>(
      `/i/teams/invitation-code${QS.query(
        QS.explode({
          team,
          invitation_id: invitationId,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-invitation-by-email"]
 *
 *
 */
export function getInvitationByEmail(
  {
    email,
  }: {
    email: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: InvitationNTkzMdYwODc1;
    }>(
      `/i/teams/invitations/by-email${QS.query(
        QS.explode({
          email,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "i-get-app-ids"]
 *
 *
 */
export function iGetAppIds(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Uuid[];
    }>(`/i/teams/${encodeURIComponent(tid)}/apps`, {
      ...opts,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "i-delete-app"]
 *
 *
 */
export function iDeleteApp(
  {
    tid,
    uid,
  }: {
    tid: string;
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(`/i/teams/${encodeURIComponent(tid)}/apps/${encodeURIComponent(uid)}`, {
      ...opts,
      method: 'DELETE',
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "create-invitations-via-scim"]
 *
 *
 */
export function createInvitationsViaScim(
  {
    tid,
    newUserScimInvitationLte4NzY5NTcy,
  }: {
    tid: string;
    newUserScimInvitationLte4NzY5NTcy: NewUserScimInvitationLte4NzY5NTcy;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: UserNjA4OtQwMtq4;
    }>(
      `/i/teams/${encodeURIComponent(tid)}/invitations`,
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: newUserScimInvitationLte4NzY5NTcy,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "team-size"]
 *
 *
 */
export function teamSize(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: TeamSizeLtMzMzk2MTk1;
    }>(`/i/teams/${encodeURIComponent(tid)}/size`, {
      ...opts,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "suspend-team"]
 *
 *
 */
export function suspendTeam(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(`/i/teams/${encodeURIComponent(tid)}/suspend`, {
      ...opts,
      method: 'POST',
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "unsuspend-team"]
 *
 *
 */
export function unsuspendTeam(
  {
    tid,
  }: {
    tid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(`/i/teams/${encodeURIComponent(tid)}/unsuspend`, {
      ...opts,
      method: 'POST',
    }),
  );
}
/**
 * Overwrite user group (name and member set) (internal)
 */
export function iUpdateGroup(
  {
    updateGroupInternalRequestNjU3Oda4MTg5,
  }: {
    updateGroupInternalRequestNjU3Oda4MTg5: UpdateGroupInternalRequestNjU3Oda4MTg5;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: unknown[];
    }>(
      '/i/user-groups',
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: updateGroupInternalRequestNjU3Oda4MTg5,
      }),
    ),
  );
}
/**
 * Create user group with full control (internal)
 */
export function iCreateGroupFull(
  {
    createGroupInternalRequestNdYzMdu0Mdu5,
  }: {
    createGroupInternalRequestNdYzMdu0Mdu5: CreateGroupInternalRequestNdYzMdu0Mdu5;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: UserGroupIdentityNTg4Mty1MjEx;
    }>(
      '/i/user-groups/full',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: createGroupInternalRequestNdYzMdu0Mdu5,
      }),
    ),
  );
}
/**
 * Get user groups with filtering (internal)
 */
export function iGetGroups(
  {
    tid,
    nameContains,
    managedBy,
    startIndex,
    count,
  }: {
    tid: string;
    nameContains?: string;
    managedBy?: 'wire' | 'scim';
    startIndex: number;
    count?: number;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: UserGroupPageUserGroupIdentityNtm4OTc3MDky;
    }>(
      `/i/user-groups/${encodeURIComponent(tid)}${QS.query(
        QS.explode({
          nameContains,
          managedBy,
          startIndex,
          count,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 * Delete a managed user group (internal)
 */
export function iDeleteGroupManaged(
  {
    tid,
    gid,
    managedBy,
  }: {
    tid: string;
    gid: string;
    managedBy: 'wire' | 'scim';
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/user-groups/${encodeURIComponent(tid)}/${encodeURIComponent(gid)}/managed/${encodeURIComponent(managedBy)}`,
      {
        ...opts,
        method: 'DELETE',
      },
    ),
  );
}
/**
 * Fetch user group (internal)
 */
export function iGetGroup(
  {
    tid,
    gid,
    includeChannels,
  }: {
    tid: string;
    gid: string;
    includeChannels: boolean;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: UserGroupIdentityNTg4Mty1MjEx;
    }>(`/i/user-groups/${encodeURIComponent(tid)}/${encodeURIComponent(gid)}/${encodeURIComponent(includeChannels)}`, {
      ...opts,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iGetUsersByVariousKeys"]
 *
 *
 */
export function iGetUsersByVariousKeys(
  {
    ids,
    handles,
    email,
    includePendingInvitations,
  }: {
    ids?: string;
    handles?: string;
    email?: string;
    includePendingInvitations?: boolean;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: UserNjA4OtQwMtq4[];
    }>(
      `/i/users${QS.query(
        QS.explode({
          ids,
          handles,
          email,
          includePendingInvitations,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "createUserNoVerify"]
 *
 *
 */
export function createUserNoVerify(
  {
    newUserPlainTextPassword8Lti4MzI5NzQx,
  }: {
    newUserPlainTextPassword8Lti4MzI5NzQx: NewUserPlainTextPassword8Lti4MzI5NzQx;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 201;
          data: UserNjA4OtQwMtq4;
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
      '/i/users',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: newUserPlainTextPassword8Lti4MzI5NzQx,
      }),
    ),
  );
}
/**
 * Get user accounts by various criteria (internal)
 */
export function iGetAccountsBy(
  {
    getByNzE2ndG3Njcx,
  }: {
    getByNzE2ndG3Njcx: GetByNzE2ndG3Njcx;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: UserNjA4OtQwMtq4[];
    }>(
      '/i/users/accounts-by',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: getByNzE2ndG3Njcx,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iGetUserActivationCode"]
 *
 *
 */
export function iGetUserActivationCode(
  {
    email,
  }: {
    email: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: GetActivationCodeRespLtm5OTcwODkw;
    }>(
      `/i/users/activation-code${QS.query(
        QS.explode({
          email,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iDeleteBlacklist"]
 *
 *
 */
export function iDeleteBlacklist(
  {
    email,
  }: {
    email: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/users/blacklist${QS.query(
        QS.explode({
          email,
        }),
      )}`,
      {
        ...opts,
        method: 'DELETE',
      },
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iHeadBlacklist"]
 *
 *
 */
export function iHeadBlacklist(
  {
    email,
  }: {
    email: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 200;
          data: unknown[];
        }
      | {
          status: 404;
          data: unknown[];
        }
    >(
      `/i/users/blacklist${QS.query(
        QS.explode({
          email,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iPostBlacklist"]
 *
 *
 */
export function iPostBlacklist(
  {
    email,
  }: {
    email: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/users/blacklist${QS.query(
        QS.explode({
          email,
        }),
      )}`,
      {
        ...opts,
        method: 'POST',
      },
    ),
  );
}
/**
 * Get all connections of a given user
 */
export function iGetAllConnectionsUnqualified(
  {
    filter,
    connectionsStatusRequestODg2NtYwMdQw,
  }: {
    filter?: string;
    connectionsStatusRequestODg2NtYwMdQw: ConnectionsStatusRequestODg2NtYwMdQw;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: ConnectionStatusLte5MzQ3MTcw[];
    }>(
      `/i/users/connections-status${QS.query(
        QS.explode({
          filter,
        }),
      )}`,
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: connectionsStatusRequestODg2NtYwMdQw,
      }),
    ),
  );
}
/**
 * Get all connections of a given user
 */
export function iGetAllConnections(
  {
    connectionsStatusRequestV2NzUzNzg2Nta1,
  }: {
    connectionsStatusRequestV2NzUzNzg2Nta1: ConnectionsStatusRequestV2NzUzNzg2Nta1;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: ConnectionStatusV2Nda4NDk3NdEw[];
    }>(
      '/i/users/connections-status/v2',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: connectionsStatusRequestV2NzUzNzg2Nta1,
      }),
    ),
  );
}
/**
 * Get the default locale
 */
export function iGetDefaultLocale(opts?: Oazapfts.RequestOpts) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: LocaleUpdateLTgzNjgyOtEw;
    }>('/i/users/locale', {
      ...opts,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "login-code"]
 *
 *
 */
export function loginCode(
  {
    phone,
  }: {
    phone: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: PendingLoginCodeLTk3Oti3MtYw;
    }>(
      `/i/users/login-code${QS.query(
        QS.explode({
          phone,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iGetUserPasswordResetCode"]
 *
 *
 */
export function iGetUserPasswordResetCode(
  {
    email,
  }: {
    email: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: GetPasswordResetCodeRespNdq4Mtu1Njc5;
    }>(
      `/i/users/password-reset-code${QS.query(
        QS.explode({
          email,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 * This endpoint can lead to the following events being sent: UserIdentityRemoved event to target user
 */
export function iRevokeIdentity(
  {
    email,
  }: {
    email: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/users/revoke-identity${QS.query(
        QS.explode({
          email,
        }),
      )}`,
      {
        ...opts,
        method: 'POST',
      },
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iGetRichInfoMulti"]
 *
 *
 */
export function iGetRichInfoMulti(
  {
    ids,
  }: {
    ids?: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: GetRichInfoMultiResponse;
    }>(
      `/i/users/rich-info${QS.query(
        QS.explode({
          ids,
        }),
      )}`,
      {
        ...opts,
      },
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "createUserNoVerifySpar"]
 *
 *
 */
export function createUserNoVerifySpar(
  {
    newUserSparMzk5Mti0OTgx,
  }: {
    newUserSparMzk5Mti0OTgx: NewUserSparMzk5Mti0OTgx;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 201;
          data: UserNjA4OtQwMtq4;
        }
      | {
          status: 400;
          data: {
            code: 400;
            label: 'invalid-invitation-code' | 'invalid-email' | 'invalid-phone' | 'invalid-handle';
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
              | 'ephemeral-user-creation-disabled'
              | 'no-identity'
              | 'managed-by-scim';
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
            label: 'key-exists' | 'handle-exists';
            message: string;
          };
        }
    >(
      '/i/users/spar',
      oazapfts.json({
        ...opts,
        method: 'POST',
        body: newUserSparMzk5Mti0OTgx,
      }),
    ),
  );
}
/**
 * This endpoint will lead to the following events being sent: UserDeleted event to all of its contacts, MemberLeave event to members for all conversations the user was in (via galley)
 */
export function iDeleteUser(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 200;
          data: unknown[];
        }
      | {
          status: 202;
          data: unknown[];
        }
      | {
          status: 404;
          data: {
            code: 404;
            label: 'not-found';
            message: string;
          };
        }
    >(`/i/users/${encodeURIComponent(uid)}`, {
      ...opts,
      method: 'DELETE',
    }),
  );
}
/**
 * Check if user is admin, return team ID
 */
export function iCheckAdminGetTeamId(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Uuid;
    }>(`/i/users/${encodeURIComponent(uid)}/check-admin-get-team-id`, {
      ...opts,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iGetUserContacts"]
 *
 *
 */
export function iGetUserContacts(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: UserIdsNtm1MzkyNtq2;
    }>(`/i/users/${encodeURIComponent(uid)}/contacts`, {
      ...opts,
    }),
  );
}
/**
 * Get user export data
 */
export function getUserExportData(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: TeamExportUserLTgyMjAxMzg2;
    }>(`/i/users/${encodeURIComponent(uid)}/export-data`, {
      ...opts,
    }),
  );
}
/**
 * Reset cassandra field 'brig.user.feature_conference_calling' to 'null'
 */
export function iDeleteAccountConferenceCallingConfig(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(`/i/users/${encodeURIComponent(uid)}/features/conferenceCalling`, {
      ...opts,
      method: 'DELETE',
    }),
  );
}
/**
 * Read cassandra field 'brig.user.feature_conference_calling'
 */
export function getAccountConferenceCallingConfig(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: FeatureConferenceCallingConfigBBareIdentityNjc2NTcxNti3;
    }>(`/i/users/${encodeURIComponent(uid)}/features/conferenceCalling`, {
      ...opts,
    }),
  );
}
/**
 * Write to cassandra field 'brig.user.feature_conference_calling'
 */
export function iPutAccountConferenceCallingConfig(
  {
    uid,
    featureConferenceCallingConfigBBareIdentityNjc2NTcxNti3,
  }: {
    uid: string;
    featureConferenceCallingConfigBBareIdentityNjc2NTcxNti3: FeatureConferenceCallingConfigBBareIdentityNjc2NTcxNti3;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/users/${encodeURIComponent(uid)}/features/conferenceCalling`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: featureConferenceCallingConfigBBareIdentityNjc2NTcxNti3,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iPutHandle"]
 *
 *
 */
export function iPutHandle(
  {
    uid,
    handleUpdateNti4NDk1OtAx,
  }: {
    uid: string;
    handleUpdateNti4NDk1OtAx: HandleUpdateNti4NDk1OtAx;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/users/${encodeURIComponent(uid)}/handle`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: handleUpdateNti4NDk1OtAx,
      }),
    ),
  );
}
/**
 * Delete the user's locale
 */
export function iDeleteUserLocale(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(`/i/users/${encodeURIComponent(uid)}/locale`, {
      ...opts,
      method: 'DELETE',
    }),
  );
}
/**
 * Set the user's locale
 */
export function iUpdateUserLocale(
  {
    uid,
    localeUpdateLTgzNjgyOtEw,
  }: {
    uid: string;
    localeUpdateLTgzNjgyOtEw: LocaleUpdateLTgzNjgyOtEw;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: LocaleUpdateLTgzNjgyOtEw;
    }>(
      `/i/users/${encodeURIComponent(uid)}/locale`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: localeUpdateLTgzNjgyOtEw,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iPutManagedBy"]
 *
 *
 */
export function iPutManagedBy(
  {
    uid,
    managedByUpdateLtu3Odm2ndG2,
  }: {
    uid: string;
    managedByUpdateLtu3Odm2ndG2: ManagedByUpdateLtu3Odm2ndG2;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/users/${encodeURIComponent(uid)}/managed-by`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: managedByUpdateLtu3Odm2ndG2,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iPutUserName"]
 *
 *
 */
export function iPutUserName(
  {
    uid,
    nameUpdateOdAzNzI5Nty1,
  }: {
    uid: string;
    nameUpdateOdAzNzI5Nty1: NameUpdateOdAzNzI5Nty1;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/users/${encodeURIComponent(uid)}/name`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: nameUpdateOdAzNzI5Nty1,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "reauthenticate"]
 *
 *
 */
export function reauthenticate(
  {
    uid,
    reAuthUserNzk5Ndu0Njc4,
  }: {
    uid: string;
    reAuthUserNzk5Ndu0Njc4: ReAuthUserNzk5Ndu0Njc4;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchText(
      `/i/users/${encodeURIComponent(uid)}/reauthenticate`,
      oazapfts.json({
        ...opts,
        body: reAuthUserNzk5Ndu0Njc4,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iGetRichInfo"]
 *
 *
 */
export function iGetRichInfo(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: RichInfo;
    }>(`/i/users/${encodeURIComponent(uid)}/rich-info`, {
      ...opts,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iPutRichInfo"]
 *
 *
 */
export function iPutRichInfo(
  {
    uid,
    richInfoUpdateNti5MjI1MTgy,
  }: {
    uid: string;
    richInfoUpdateNti5MjI1MTgy: RichInfoUpdateNti5MjI1MTgy;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/users/${encodeURIComponent(uid)}/rich-info`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: richInfoUpdateNti5MjI1MTgy,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iDeleteUserSsoId"]
 *
 *
 */
export function iDeleteUserSsoId(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchText(`/i/users/${encodeURIComponent(uid)}/sso-id`, {
      ...opts,
      method: 'DELETE',
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iPutUserSsoId"]
 *
 *
 */
export function iPutUserSsoId(
  {
    uid,
    userSsoId,
  }: {
    uid: string;
    userSsoId: UserSsoId;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchText(
      `/i/users/${encodeURIComponent(uid)}/sso-id`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: userSsoId,
      }),
    ),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iGetUserStatus"]
 *
 *
 */
export function iGetUserStatus(
  {
    uid,
  }: {
    uid: string;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<
      | {
          status: 200;
          data: AccountStatusRespLTg2Mte1OdAz;
        }
      | {
          status: 404;
          data: {
            code: 404;
            label: 'not-found';
            message: string;
          };
        }
    >(`/i/users/${encodeURIComponent(uid)}/status`, {
      ...opts,
    }),
  );
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "iPutUserStatus"]
 *
 *
 */
export function iPutUserStatus(
  {
    uid,
    accountStatusUpdateNte4Mzc0Mtm3,
  }: {
    uid: string;
    accountStatusUpdateNte4Mzc0Mtm3: AccountStatusUpdateNte4Mzc0Mtm3;
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Blob;
    }>(
      `/i/users/${encodeURIComponent(uid)}/status`,
      oazapfts.json({
        ...opts,
        method: 'PUT',
        body: accountStatusUpdateNte4Mzc0Mtm3,
      }),
    ),
  );
}
/**
 * Get verification code for a given email and action
 */
export function getVerificationCode(
  {
    uid,
    action,
  }: {
    uid: string;
    action: 'create_scim_token' | 'login' | 'delete_team';
  },
  opts?: Oazapfts.RequestOpts,
) {
  return oazapfts.ok(
    oazapfts.fetchJson<{
      status: 200;
      data: Ascii;
    }>(`/i/users/${encodeURIComponent(uid)}/verification-code/${encodeURIComponent(action)}`, {
      ...opts,
    }),
  );
}
