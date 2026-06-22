/**
 * Stern API
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from "@oazapfts/runtime";
import * as QS from "@oazapfts/runtime/query";
export const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders> = {
    headers: {},
    baseUrl: "/"
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {};
export type Uuid = string;
export type HttpsUrl = string;
export type HttpsUrlMaybeHttpsUrlLtq1MDkyMzY2 = {
    config_url: HttpsUrl;
    webapp_url?: HttpsUrl;
};
export type Ascii = string;
export type Domain = string;
export type DomainRedirectTagLty3NjU1MdEy = "none" | "locked" | "sso" | "backend" | "no-registration" | "pre-authorized";
export type TeamInviteTagLtQyNtMyNzA0 = "allowed" | "not-allowed" | "team";
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
export type QualifiedIdIdTagConversationLtq5NdQwNjc5 = {
    domain: Domain;
    id: Uuid;
};
export type EjpdConvInfoNDgwMdIyMdAw = {
    conv_id: QualifiedIdIdTagConversationLtq5NdQwNjc5;
    conv_name: string;
};
export type Email = string;
export type Handle = string;
export type PhoneNumber = string;
export type QualifiedIdIdTagUserLtq1NtIwNdm1 = {
    domain: Domain;
    id: Uuid;
};
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
export type RelationLte4Otu5MTk4 = "accepted" | "blocked" | "pending" | "ignored" | "sent" | "cancelled" | "missing-legalhold-consent";
export type EjpdContactLTgwNde1NdAy = {
    contact_item: EjpdResponseItemLeafLtEyNTcxMjAx;
    contact_relation: RelationLte4Otu5MTk4;
};
export type NewListTypeODkwNzA4Mtm3 = "list_complete" | "list_truncated";
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
export type ConsentLogAndMarketo = object;
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
export type UserMetaInfo = object;
export type CustomBackendLtQxOdi0MjQ0 = {
    config_json_url: HttpsUrl;
    webapp_welcome_url: HttpsUrl;
};
export type TeamStatusOdYyMtUyMzE1 = "active" | "pending_delete" | "deleted" | "suspended" | "pending_active";
export type UtcTime = string;
export type TeamBindingLte4Ntm5MTc0 = true | false;
export type Icon = string;
export type TeamNDg4MjQwOtIw = {
    binding?: TeamBindingLte4Ntm5MTc0;
    creator: Uuid;
    icon: Icon;
    icon_key?: string;
    id: Uuid;
    name: string;
    splash_screen?: Icon;
};
export type TeamDataODgyNzY3Otq3 = {
    status: TeamStatusOdYyMtUyMzE1;
    status_time?: UtcTime;
    team: TeamNDg4MjQwOtIw;
};
export type UtcTimeMillis = string;
export type UserLegalHoldStatusLtq2Oda2Ntu5 = "enabled" | "pending" | "disabled" | "no_consent";
export type PermissionsNde0Odm5NdUx = {
    /** Permissions that this user is able to grant others */
    copy: number;
    /** Permissions that the user has */
    self: number;
};
export type TeamMemberInfoLTkxMde2Nti2 = {
    can_update_billing: boolean;
    can_view_billing: boolean;
    created_at?: UtcTimeMillis;
    created_by?: Uuid;
    legalhold_status?: UserLegalHoldStatusLtq2Oda2Ntu5;
    permissions: PermissionsNde0Odm5NdUx;
    user: Uuid;
};
export type TeamInfoLTgxMjI3MjYx = {
    info: TeamDataODgyNzY3Otq3;
    members: TeamMemberInfoLTkxMde2Nti2[];
};
export type TeamAdminInfoMtu4MdQxNjk5 = {
    admins: TeamMemberInfoLTkxMde2Nti2[];
    data: TeamDataODgyNzY3Otq3;
    owners: TeamMemberInfoLTkxMde2Nti2[];
    total_members: number;
};
export type TeamBillingInfoLtm3Otu2MjYy = {
    city: string;
    company?: string;
    country: string;
    firstname: string;
    lastname: string;
    state?: string;
    street: string;
    zip: string;
};
export type TeamBillingInfoUpdateMzM5Ode1Nzk3 = {
    city?: string;
    company?: string;
    country?: string;
    firstname?: string;
    lastname?: string;
    state?: string;
    street?: string;
    zip?: string;
};
export type AppLockConfigBCoveredIdentityNdIxOTc2Njkz = {
    enforceAppLock: boolean;
    inactivityTimeoutSecs: number;
};
export type LockStatusLtIyMtu5OTkw = "locked" | "unlocked";
export type FeatureStatusLtMzMtUwOdEw = "enabled" | "disabled";
export type LockableFeatureAppLockConfigBBareIdentityODgzNdi0Otu5 = {
    config: AppLockConfigBCoveredIdentityNdIxOTc2Njkz;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureAppLockConfigBBareIdentityMtAzMjI5NdYy = {
    config: AppLockConfigBCoveredIdentityNdIxOTc2Njkz;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureAppsConfigMzQyNtMxNTk5 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureBackgroundEffectsConfigMTg1MTk3Ntm5 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type CellsPropertyStatusMtq5NjE2MzQ4 = "enabled" | "disabled" | "enforced";
export type CellsPropertyNzcxMdIzMzk0 = {
    "default": CellsPropertyStatusMtq5NjE2MzQ4;
    enabled: boolean;
};
export type CellsCollaboraStatusMTgzNtQyNzUz = {
    enabled: boolean;
};
export type CellsUserMetaTagsLTc4Njk4Nty0 = {
    allowFreeValues: boolean;
    defaultValues: string[];
};
export type CellsNamespacesMzUxMjEzOtQw = {
    usermetaTags: CellsUserMetaTagsLTc4Njk4Nty0;
};
export type CellsMetadataLty1Otm5Mtm0 = {
    namespaces: CellsNamespacesMzUxMjEzOtQw;
};
export type CellsPublicLinksMjgxMzQ3Mzk4 = {
    enableFiles: boolean;
    enableFolders: boolean;
    enforceExpirationDefault: number;
    enforceExpirationMax: number;
    enforcePassword: boolean;
};
export type CellsRecycleLtQxMTg3NTkx = {
    allowSkip: boolean;
    autoPurgeDays: number;
    disable: boolean;
};
export type CellsConfigStorageLtm0NdMwOdm4 = {
    perFileQuotaBytes: string;
    recycle: CellsRecycleLtQxMTg3NTkx;
};
export type CellsUsersLtq4NtEyOda1 = {
    externals: boolean;
    guests: boolean;
};
export type CellsConfigBCoveredIdentityLte1NzkwOTcz = {
    channels: CellsPropertyNzcxMdIzMzk0;
    collabora: CellsCollaboraStatusMTgzNtQyNzUz;
    groups: CellsPropertyNzcxMdIzMzk0;
    metadata: CellsMetadataLty1Otm5Mtm0;
    one2one: CellsPropertyNzcxMdIzMzk0;
    publicLinks: CellsPublicLinksMjgxMzQ3Mzk4;
    storage: CellsConfigStorageLtm0NdMwOdm4;
    users: CellsUsersLtq4NtEyOda1;
};
export type LockableFeatureCellsConfigBBareIdentityLTgzMda1NjI3 = {
    config: CellsConfigBCoveredIdentityLte1NzkwOTcz;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureCellsConfigBBareIdentityNzU2NjgxNzEw = {
    config: CellsConfigBCoveredIdentityLte1NzkwOTcz;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type CellsBackendLte1Nzg3NzQ2 = {
    url: HttpsUrl;
};
export type CollaboraEditionLTg2Nda1Ndq4 = "NO" | "CODE" | "COOL";
export type CellsCollaboraLtMzNda5MdIz = {
    edition: CollaboraEditionLTg2Nda1Ndq4;
};
export type CellsStorageLty2Mzc5NzY1 = {
    perUserQuotaBytes: string;
};
export type CellsInternalConfigBCoveredIdentityLtUzMDkwOtAz = {
    backend: CellsBackendLte1Nzg3NzQ2;
    collabora: CellsCollaboraLtMzNda5MdIz;
    storage: CellsStorageLty2Mzc5NzY1;
};
export type LockableFturCsInfigBdyLtq3Mtu3Mjg0 = {
    config: CellsInternalConfigBCoveredIdentityLtUzMDkwOtAz;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureCellsInternalConfigBBareIdentityOdm1Mjg1Mtq2 = {
    config: CellsInternalConfigBCoveredIdentityLtUzMDkwOtAz;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type ChannelPermissionsMzc1Mtm3NTg2 = "team-members" | "everyone" | "admins";
export type ChannelsConfigBCoveredIdentityODk2MTk3Ndq4 = {
    allowed_to_create_channels: ChannelPermissionsMzc1Mtm3NTg2;
    allowed_to_open_channels: ChannelPermissionsMzc1Mtm3NTg2;
};
export type LockableFeatureChannelsConfigBBareIdentityNzA2NdEyMdEw = {
    config: ChannelsConfigBCoveredIdentityODk2MTk3Ndq4;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureChannelsConfigBBareIdentityLtu4Nte4MTgx = {
    config: ChannelsConfigBCoveredIdentityODk2MTk3Ndq4;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureChatBubblesConfigNDgwMtQzNjI2 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type ClassifiedDomainsConfigLTg4MDcwMDg2 = {
    domains: Domain[];
};
export type LockableFeatureClassifiedDomainsConfigLty1OdQwODg1 = {
    config: ClassifiedDomainsConfigLTg4MDcwMDg2;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type ConferenceCallingConfigBCoveredIdentityNdMwMjcyMzM1 = {
    useSFTForOneToOneCalls?: boolean;
};
export type LockableFturCnfigBIdyNzY1Ndu5MdAy = {
    config?: ConferenceCallingConfigBCoveredIdentityNdMwMjcyMzM1;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureConsumableNotificationsConfigMjUxMjczMjM0 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureGuestLinksConfigLTcwNjU0NdMw = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureDigitalSignaturesConfigOdm2Mda2Ndu4 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureDomainRegistrationConfigNzU0NjczNte0 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type EnforceFilDwadLtCgBVIyLtq2NjU1Nzcx = {
    enforcedDownloadLocation?: string;
};
export type LockableFturEnfiDwdCgBIyOda5Ota5Mtq4 = {
    config: EnforceFilDwadLtCgBVIyLtq2NjU1Nzcx;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeaturEnfocilDwdLCgBIyMjcxMzc1Nda5 = {
    config: EnforceFilDwadLtCgBVIyLtq2NjU1Nzcx;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureFileSharingConfigMjgwNjIzOdEz = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureLegalholdConfigLTc5MTk5OtIw = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureLimitedEventFanoutConfigMTg3Odm0NzU0 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureMeetingsConfigLte0Otq5Nzcw = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureMeetingsPremiumConfigNDg1OdEyNta1 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type CipherSuiteTag = number;
export type ProtocolTagODg1Mte5NjEw = "proteus" | "mls" | "mixed";
export type MlsConfigBCoveredIdentityLtEzNTk3MzM5 = {
    allowedCipherSuites: CipherSuiteTag[];
    defaultCipherSuite: CipherSuiteTag;
    defaultProtocol: ProtocolTagODg1Mte5NjEw;
    groupInfoDiagnostics?: boolean;
    protocolToggleUsers: Uuid[];
    supportedProtocols: ProtocolTagODg1Mte5NjEw[];
};
export type LockableFeatureMlsConfigBBareIdentityMTg1MTc0NtEw = {
    config: MlsConfigBCoveredIdentityLtEzNTk3MzM5;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureMlsConfigBBareIdentityLti5MjA3MdYy = {
    config: MlsConfigBCoveredIdentityLtEzNTk3MzM5;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureOutlookCalIntegrationConfigNjQ0MzMyMzY0 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type PreventAdminlessGroupsPromotionStrategyMjc1Oda2Mdu1 = "alphabetical" | "random" | "all";
export type PreventAdminlessGroupsConfigBCoveredIdentityMjQ2NdYwMTk2 = {
    deletionTimeout: number;
    promotionStrategy: PreventAdminlessGroupsPromotionStrategyMjc1Oda2Mdu1;
    reminderTimeouts: number[];
};
export type LockableFturPvnAdmisGpCfgBIyMtQxOtu4Mzgw = {
    config: PreventAdminlessGroupsConfigBCoveredIdentityMjQ2NdYwMTk2;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeaturPvnAdmilsGopCfgBIyLte2NzM3ODkx = {
    config: PreventAdminlessGroupsConfigBCoveredIdentityMjQ2NdYwMTk2;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureSearchVisibilityAvailableConfigLTkxMta5ODk5 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type SelfDeletingMessagesConfigBCoveredIdentityLty0NzQ4MzU1 = {
    enforcedTimeoutSeconds: number;
};
export type LockableFturSfDingMsCbIdyLTg5MtEwNta2 = {
    config: SelfDeletingMessagesConfigBCoveredIdentityLty0NzQ4MzU1;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureSndFactorPasswordChallengeConfigMjQ3NzQ2ODgx = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureSsoConfigNjcyMjU4Mdy2 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureStealthUsersConfigLte1MTk2NzIz = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFturRqiExnmVfCgNjUyMzgzNzY5 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type TeamSearchVisibilityLtIzOde2Njk3 = "standard" | "no-name-outside-team";
export type TeamSearchVisibilityViewMzg3MzMzMTk3 = {
    search_visibility: TeamSearchVisibilityLtIzOde2Njk3;
};
export type AssetKey = string;
export type AssetSizeOtAwMda3Ody2 = "preview" | "complete";
export type MtYxOti3NjM3 = "image";
export type AssetLtIyMjc1NdEz = {
    key: AssetKey;
    size?: AssetSizeOtAwMda3Ody2;
    "type": MtYxOti3NjM3;
};
export type Locale = string;
export type ManagedByNti0ODc0NtQx = "wire" | "scim";
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
export type AccountStatusNzkzNdu1Odu5 = "active" | "suspended" | "deleted" | "ephemeral" | "pending-invitation";
export type BaseProtocolTagLtm0Mde1NtEx = "proteus" | "mls";
export type UserTypeLtu1Otu4Otm5 = "regular" | "app" | "bot";
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
    "type": UserTypeLtu1Otu4Otm5;
};
export type ConnectionStatusLte5MzQ3MTcw = {
    "from": Uuid;
    status: RelationLte4Otu5MTk4;
    to: Uuid;
};
export type UserConnectionGroupsLTg5OdMwMda5 = {
    ucgAccepted: number;
    ucgBlocked: number;
    ucgIgnored: number;
    ucgMissingLegalholdConsent: number;
    ucgPending: number;
    ucgSent: number;
    ucgTotal: number;
};
export type EmailUpdateNjQ5MDg1Oty0 = {
    email: Email;
};
export type ContactLTcwOde3Mjc5 = {
    accent_id?: number;
    handle?: string;
    id?: Uuid;
    name: string;
    qualified_id: QualifiedIdIdTagUserLtq1NtIwNdm1;
    team?: Uuid;
    "type": UserTypeLtu1Otu4Otm5;
};
export type PagingState = string;
export type FederatedUserSearchPolicyMzkwOda4Mtm3 = "no_search" | "exact_handle_search" | "full_search";
export type SearchResultContactOtExNzg4Mte0 = {
    /** List of contacts found */
    documents: ContactLTcwOde3Mjc5[];
    /** Total number of hits */
    found: number;
    /** Indicates whether there are more results to be fetched */
    has_more?: boolean;
    paging_state?: PagingState;
    /** Total number of hits returned */
    returned: number;
    search_policy: FederatedUserSearchPolicyMzkwOda4Mtm3;
    /** Search time in ms */
    took: number;
};
/**
 * Deletes a domain
 */
export function domainRegistrationDelete({ domain }: {
    domain: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/domain-registration/${encodeURIComponent(domain)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Returns the current entry in the domain table for that domain
 */
export function domainRegistrationGet({ domain }: {
    domain: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: DomainRegistrationResponseV10MjE0NDkxOdy4;
    }>(`/domain-registration/${encodeURIComponent(domain)}`, {
        ...opts
    }));
}
/**
 * Updates a domain
 */
export function domainRegistrationUpdate({ domain, domainRegistrationUpdateLtQzNjU4Oda2 }: {
    domain: string;
    domainRegistrationUpdateLtQzNjU4Oda2: DomainRegistrationUpdateLtQzNjU4Oda2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/domain-registration/${encodeURIComponent(domain)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: domainRegistrationUpdateLtQzNjU4Oda2
    })));
}
/**
 * Adds a domain to the Deny-list
 */
export function domainRegistrationLock({ domain }: {
    domain: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/domain-registration/${encodeURIComponent(domain)}/lock`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Pre-authorizes a domain
 */
export function domainRegistrationPreAuthorize({ domain }: {
    domain: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/domain-registration/${encodeURIComponent(domain)}/preauthorize`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Un-authorizes a domain
 */
export function domainRegistrationUnauthorize({ domain }: {
    domain: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/domain-registration/${encodeURIComponent(domain)}/unauthorize`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Unlocks a domain
 */
export function domainRegistrationUnlock({ domain }: {
    domain: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/domain-registration/${encodeURIComponent(domain)}/unlock`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * internal wire.com process: https://wearezeta.atlassian.net/wiki/spaces/~463749889/pages/256738296/EJPD+official+requests+process
 */
export function ejpdInfo({ includeContacts, handles }: {
    includeContacts?: boolean;
    handles: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: EjpdResponseBodyNzc0MzMxNDc3;
    }>(`/ejpd-info${QS.query(QS.explode({
        include_contacts: includeContacts,
        handles
    }))}`, {
        ...opts
    }));
}
/**
 * Fetch the consent log given an email address of a non-user
 */
export function getConsentLog({ email }: {
    email: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ConsentLogAndMarketo;
    }>(`/i/consent${QS.query(QS.explode({
        email
    }))}`, {
        ...opts
    }));
}
/**
 * Register an OAuth client
 */
export function registerOauthClient({ oAuthClientConfigLTgzOtAwNjU1 }: {
    oAuthClientConfigLTgzOtAwNjU1: OAuthClientConfigLTgzOtAwNjU1;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: OAuthClientCredentialsNTg1NDc5MjE2;
    }>("/i/oauth/clients", oazapfts.json({
        ...opts,
        method: "POST",
        body: oAuthClientConfigLTgzOtAwNjU1
    })));
}
/**
 * Delete OAuth client
 */
export function deleteOauthClient({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: unknown[];
    }>(`/i/oauth/clients/${encodeURIComponent(id)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Get OAuth client by id
 */
export function sternGetOauthClient({ id }: {
    id: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: OAuthClientNzExMti5NtIy;
    }>(`/i/oauth/clients/${encodeURIComponent(id)}`, {
        ...opts
    }));
}
/**
 * Update OAuth client
 */
export function updateOauthClient({ id, oAuthClientConfigLTgzOtAwNjU1 }: {
    id: string;
    oAuthClientConfigLTgzOtAwNjU1: OAuthClientConfigLTgzOtAwNjU1;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: OAuthClientNzExMti5NtIy;
    }>(`/i/oauth/clients/${encodeURIComponent(id)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: oAuthClientConfigLTgzOtAwNjU1
    })));
}
/**
 * Fetch a user's meta info given a user id: TEMPORARY!
 */
export function getUserMetaInfo({ id, maxConversations, maxNotifications }: {
    id: string;
    maxConversations?: number;
    maxNotifications?: number;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserMetaInfo;
    }>(`/i/user/meta-info${QS.query(QS.explode({
        id,
        max_conversations: maxConversations,
        max_notifications: maxNotifications
    }))}`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * read, update, delete domain login redirects custom backends (see https://docs.wire.com/understand/associate/custom-backend-for-desktop-client.html)
 */
export function deleteSsoDomainRedirect({ domain }: {
    domain: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: unknown[];
    }>(`/sso-domain-redirect${QS.query(QS.explode({
        domain
    }))}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * read, update, delete domain login redirects custom backends (see https://docs.wire.com/understand/associate/custom-backend-for-desktop-client.html)
 */
export function getSsoDomainRedirect({ domain }: {
    domain: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: CustomBackendLtQxOdi0MjQ0;
    }>(`/sso-domain-redirect${QS.query(QS.explode({
        domain
    }))}`, {
        ...opts
    }));
}
/**
 * read, update, delete domain login redirects custom backends (see https://docs.wire.com/understand/associate/custom-backend-for-desktop-client.html)
 */
export function putSsoDomainRedirect({ domain, configurl, welcomeurl }: {
    domain: string;
    configurl: string;
    welcomeurl: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: unknown[];
    }>(`/sso-domain-redirect${QS.query(QS.explode({
        domain,
        configurl,
        welcomeurl
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Fetch a team information given a member's email
 */
export function getTeamInfoByMemberEmail({ email }: {
    email: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamInfoLTgxMjI3MjYx;
    }>(`/teams${QS.query(QS.explode({
        email
    }))}`, {
        ...opts
    }));
}
/**
 * Delete a team (irrevocable!). You can only delete teams with 1 user unless you use the 'force' query flag
 */
export function deleteTeam({ tid, force, email }: {
    tid: string;
    force?: boolean;
    email?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}${QS.query(QS.explode({
        force,
        email
    }))}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Gets information about a team
 */
export function getTeamInfo({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamInfoLTgxMjI3MjYx;
    }>(`/teams/${encodeURIComponent(tid)}`, {
        ...opts
    }));
}
/**
 * Gets information about a team's members, owners, and admins
 */
export function getTeamAdminInfo({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamAdminInfoMtu4MdQxNjk5;
    }>(`/teams/${encodeURIComponent(tid)}/admins`, {
        ...opts
    }));
}
/**
 * Gets billing information about a team
 */
export function getTeamBillingInfo({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamBillingInfoLtm3Otu2MjYy;
    }>(`/teams/${encodeURIComponent(tid)}/billing`, {
        ...opts
    }));
}
/**
 * Sets billing information about a team. Can only be used on teams that do NOT have any billing information set. To update team billing info, use the update endpoint
 */
export function postTeamBillingInfo({ tid, teamBillingInfoLtm3Otu2MjYy }: {
    tid: string;
    teamBillingInfoLtm3Otu2MjYy: TeamBillingInfoLtm3Otu2MjYy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamBillingInfoLtm3Otu2MjYy;
    }>(`/teams/${encodeURIComponent(tid)}/billing`, oazapfts.json({
        ...opts,
        method: "POST",
        body: teamBillingInfoLtm3Otu2MjYy
    })));
}
/**
 * Updates billing information about a team. Non specified fields will NOT be updated
 */
export function putTeamBillingInfo({ tid, teamBillingInfoUpdateMzM5Ode1Nzk3 }: {
    tid: string;
    teamBillingInfoUpdateMzM5Ode1Nzk3: TeamBillingInfoUpdateMzM5Ode1Nzk3;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamBillingInfoLtm3Otu2MjYy;
    }>(`/teams/${encodeURIComponent(tid)}/billing`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: teamBillingInfoUpdateMzM5Ode1Nzk3
    })));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteApplockConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureAppLockConfigBBareIdentityODgzNdi0Otu5;
    }>(`/teams/${encodeURIComponent(tid)}/features/appLock`, {
        ...opts
    }));
}
/**
 * Disable / enable feature flag for a given team
 */
export function putRouteApplockConfig({ tid, featureAppLockConfigBBareIdentityMtAzMjI5NdYy }: {
    tid: string;
    featureAppLockConfigBBareIdentityMtAzMjI5NdYy: FeatureAppLockConfigBBareIdentityMtAzMjI5NdYy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/appLock`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureAppLockConfigBBareIdentityMtAzMjI5NdYy
    })));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteApplockConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/appLock/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteAppsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureAppsConfigMzQyNtMxNTk5;
    }>(`/teams/${encodeURIComponent(tid)}/features/apps`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteAppsConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/apps${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteAppsConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/apps/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteBackgroundEffectsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureBackgroundEffectsConfigMTg1MTk3Ntm5;
    }>(`/teams/${encodeURIComponent(tid)}/features/backgroundEffects`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteBackgroundEffectsConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/backgroundEffects${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteBackgroundEffectsConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/backgroundEffects/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteCells({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureCellsConfigBBareIdentityLTgzMda1NjI3;
    }>(`/teams/${encodeURIComponent(tid)}/features/cells`, {
        ...opts
    }));
}
/**
 * Disable / enable feature flag for a given team
 */
export function putRouteCells({ tid, featureCellsConfigBBareIdentityNzU2NjgxNzEw }: {
    tid: string;
    featureCellsConfigBBareIdentityNzU2NjgxNzEw: FeatureCellsConfigBBareIdentityNzU2NjgxNzEw;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/cells`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureCellsConfigBBareIdentityNzU2NjgxNzEw
    })));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteCellsConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/cells/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteCellsInternal({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturCsInfigBdyLtq3Mtu3Mjg0;
    }>(`/teams/${encodeURIComponent(tid)}/features/cellsInternal`, {
        ...opts
    }));
}
/**
 * Disable / enable feature flag for a given team
 */
export function putRouteCellsInternal({ tid, featureCellsInternalConfigBBareIdentityOdm1Mjg1Mtq2 }: {
    tid: string;
    featureCellsInternalConfigBBareIdentityOdm1Mjg1Mtq2: FeatureCellsInternalConfigBBareIdentityOdm1Mjg1Mtq2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/cellsInternal`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureCellsInternalConfigBBareIdentityOdm1Mjg1Mtq2
    })));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function channelsGet({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureChannelsConfigBBareIdentityNzA2NdEyMdEw;
    }>(`/teams/${encodeURIComponent(tid)}/features/channels`, {
        ...opts
    }));
}
/**
 * Disable / enable feature flag for a given team
 */
export function channelsPut({ tid, featureChannelsConfigBBareIdentityLtu4Nte4MTgx }: {
    tid: string;
    featureChannelsConfigBBareIdentityLtu4Nte4MTgx: FeatureChannelsConfigBBareIdentityLtu4Nte4MTgx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/channels`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureChannelsConfigBBareIdentityLtu4Nte4MTgx
    })));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function channelsLock({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/channels/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteChatBubblesConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureChatBubblesConfigNDgwMtQzNjI2;
    }>(`/teams/${encodeURIComponent(tid)}/features/chatBubbles`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteChatBubblesConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/chatBubbles${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteChatBubblesConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/chatBubbles/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteClassifiedDomainsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureClassifiedDomainsConfigLty1OdQwODg1;
    }>(`/teams/${encodeURIComponent(tid)}/features/classifiedDomains`, {
        ...opts
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteConferenceCallingConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturCnfigBIdyNzY1Ndu5MdAy;
    }>(`/teams/${encodeURIComponent(tid)}/features/conferenceCalling`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteConferenceCallingConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/conferenceCalling${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteConferenceCallingConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/conferenceCalling/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteConsumableNotifications({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureConsumableNotificationsConfigMjUxMjczMjM0;
    }>(`/teams/${encodeURIComponent(tid)}/features/consumableNotifications`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteConsumableNotifications({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/consumableNotifications${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteConsumableNotificationsConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/consumableNotifications/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteGuestLinks({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureGuestLinksConfigLTcwNjU0NdMw;
    }>(`/teams/${encodeURIComponent(tid)}/features/conversationGuestLinks`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteGuestLinks({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/conversationGuestLinks${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteGuestLinksConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/conversationGuestLinks/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteDigitalSignaturesConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureDigitalSignaturesConfigOdm2Mda2Ndu4;
    }>(`/teams/${encodeURIComponent(tid)}/features/digitalSignatures`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteDigitalSignaturesConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/digitalSignatures${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteDigitalSignaturesConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/digitalSignatures/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function domainRegistrationGet2({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureDomainRegistrationConfigNzU0NjczNte0;
    }>(`/teams/${encodeURIComponent(tid)}/features/domainRegistration`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function domainRegistrationPut({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/domainRegistration${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function domainRegistrationLock2({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/domainRegistration/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteEnforceFileDownloadLocation({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturEnfiDwdCgBIyOda5Ota5Mtq4;
    }>(`/teams/${encodeURIComponent(tid)}/features/enforceFileDownloadLocation`, {
        ...opts
    }));
}
/**
 * Disable / enable feature flag for a given team
 */
export function putRouteEnforceFileDownloadLocation({ tid, featurEnfocilDwdLCgBIyMjcxMzc1Nda5 }: {
    tid: string;
    featurEnfocilDwdLCgBIyMjcxMzc1Nda5: FeaturEnfocilDwdLCgBIyMjcxMzc1Nda5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/enforceFileDownloadLocation`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featurEnfocilDwdLCgBIyMjcxMzc1Nda5
    })));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteEnforceFileDownloadLocation({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/enforceFileDownloadLocation/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteFileSharingConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureFileSharingConfigMjgwNjIzOdEz;
    }>(`/teams/${encodeURIComponent(tid)}/features/fileSharing`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteFileSharingConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/fileSharing${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteFileSharingConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/fileSharing/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteLegalholdConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureLegalholdConfigLTc5MTk5OtIw;
    }>(`/teams/${encodeURIComponent(tid)}/features/legalhold`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteLegalholdConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/legalhold${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteLimitedEventFanout({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureLimitedEventFanoutConfigMTg3Odm0NzU0;
    }>(`/teams/${encodeURIComponent(tid)}/features/limitedEventFanout`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteLimitedEventFanout({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/limitedEventFanout${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteLimitedEventFanoutConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/limitedEventFanout/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteMeetingsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMeetingsConfigLte0Otq5Nzcw;
    }>(`/teams/${encodeURIComponent(tid)}/features/meetings`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteMeetingsConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/meetings${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteMeetingsConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/meetings/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteMeetingsPremiumConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMeetingsPremiumConfigNDg1OdEyNta1;
    }>(`/teams/${encodeURIComponent(tid)}/features/meetingsPremium`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteMeetingsPremiumConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/meetingsPremium${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteMeetingsPremiumConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/meetingsPremium/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteMlsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMlsConfigBBareIdentityMTg1MTc0NtEw;
    }>(`/teams/${encodeURIComponent(tid)}/features/mls`, {
        ...opts
    }));
}
/**
 * Disable / enable feature flag for a given team
 */
export function putRouteMlsConfig({ tid, featureMlsConfigBBareIdentityLti5MjA3MdYy }: {
    tid: string;
    featureMlsConfigBBareIdentityLti5MjA3MdYy: FeatureMlsConfigBBareIdentityLti5MjA3MdYy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/mls`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureMlsConfigBBareIdentityLti5MjA3MdYy
    })));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteOutlookCalConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureOutlookCalIntegrationConfigNjQ0MzMyMzY0;
    }>(`/teams/${encodeURIComponent(tid)}/features/outlookCalIntegration`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteOutlookCalConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/outlookCalIntegration${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteOutlookCalConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/outlookCalIntegration/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function preventAdminlessGroupsGet({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturPvnAdmisGpCfgBIyMtQxOtu4Mzgw;
    }>(`/teams/${encodeURIComponent(tid)}/features/preventAdminlessGroups`, {
        ...opts
    }));
}
/**
 * Disable / enable feature flag for a given team
 */
export function preventAdminlessGroupsPut({ tid, featurPvnAdmilsGopCfgBIyLte2NzM3ODkx }: {
    tid: string;
    featurPvnAdmilsGopCfgBIyLte2NzM3ODkx: FeaturPvnAdmilsGopCfgBIyLte2NzM3ODkx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/preventAdminlessGroups`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featurPvnAdmilsGopCfgBIyLte2NzM3ODkx
    })));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function preventAdminlessGroupsLock({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/preventAdminlessGroups/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteSearchVisibilityAvailableConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSearchVisibilityAvailableConfigLTkxMta5ODk5;
    }>(`/teams/${encodeURIComponent(tid)}/features/searchVisibility`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteSearchVisibilityAvailableConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/searchVisibility${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteSelfDeletingMessages({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturSfDingMsCbIdyLTg5MtEwNta2;
    }>(`/teams/${encodeURIComponent(tid)}/features/selfDeletingMessages`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteSelfDeletingMessages({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/selfDeletingMessages${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteSelfDeletingMessagesConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/selfDeletingMessages/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteSndFactorPasswordChallenge({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSndFactorPasswordChallengeConfigMjQ3NzQ2ODgx;
    }>(`/teams/${encodeURIComponent(tid)}/features/sndFactorPasswordChallenge`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteSndFactorPasswordChallenge({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/sndFactorPasswordChallenge${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Lock / unlock status for a given feature / team (en-/disable should happen in team settings)
 */
export function lockUnlockRouteSndFactorPasswordChallengeConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/sndFactorPasswordChallenge/lockOrUnlock${QS.query(QS.explode({
        "lock-status": lockStatus
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteSsoConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSsoConfigNjcyMjU4Mdy2;
    }>(`/teams/${encodeURIComponent(tid)}/features/sso`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteSsoConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/sso${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteStealthUsersConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureStealthUsersConfigLte1MTk2NzIz;
    }>(`/teams/${encodeURIComponent(tid)}/features/stealthUsers`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteStealthUsersConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/stealthUsers${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Shows whether a feature flag is enabled or not for a given team.
 */
export function getRouteValidateSamlEmailsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturRqiExnmVfCgNjUyMzgzNzY5;
    }>(`/teams/${encodeURIComponent(tid)}/features/validateSAMLemails`, {
        ...opts
    }));
}
/**
 * Disable / enable status for a given feature / team
 */
export function putRouteValidateSamlEmailsConfig({ tid, status }: {
    tid: string;
    status: "enabled" | "disabled";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/features/validateSAMLemails${QS.query(QS.explode({
        status
    }))}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get a specific invoice by Number
 */
export function getTeamInvoice({ tid, inr }: {
    tid: string;
    inr: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: string;
    }>(`/teams/${encodeURIComponent(tid)}/invoice/${encodeURIComponent(inr)}`, {
        ...opts
    }));
}
/**
 * Shows the current TeamSearchVisibility value for the given team
 */
export function getSearchVisibility({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamSearchVisibilityViewMzg3MzMzMTk3;
    }>(`/teams/${encodeURIComponent(tid)}/search-visibility`, {
        ...opts
    }));
}
/**
 * Shows the current TeamSearchVisibility value for the given team
 */
export function putSearchVisibility({ tid, teamSearchVisibilityLtIzOde2Njk3 }: {
    tid: string;
    teamSearchVisibilityLtIzOde2Njk3: TeamSearchVisibilityLtIzOde2Njk3;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/search-visibility`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: teamSearchVisibilityLtIzOde2Njk3
    })));
}
/**
 * Suspend a team.
 */
export function suspendTeam({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/suspend`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Set a team status to 'Active', independently on previous status.  (Cannot be used to un-delete teams, though.)
 */
export function unsuspendTeam({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/teams/${encodeURIComponent(tid)}/unsuspend`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Remove the email from our blacklist
 */
export function deleteUserBlacklist({ email }: {
    email: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/users/blacklist${QS.query(QS.explode({
        email
    }))}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Fetch blacklist information on a email (200: blacklisted; 404: not blacklisted)
 */
export function headUserBlacklist({ email }: {
    email: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/users/blacklist${QS.query(QS.explode({
        email
    }))}`, {
        ...opts
    }));
}
/**
 * Add the email to our blacklist
 */
export function postUserBlacklist({ email }: {
    email: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/users/blacklist${QS.query(QS.explode({
        email
    }))}`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Displays user's info given an email address
 */
export function getUsersByEmail({ email }: {
    email: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserNjA4OtQwMtq4[];
    }>(`/users/by-email${QS.query(QS.explode({
        email
    }))}`, {
        ...opts
    }));
}
/**
 * Displays active users info given a list of handles
 */
export function getUsersByHandles({ handles }: {
    handles: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserNjA4OtQwMtq4[];
    }>(`/users/by-handles${QS.query(QS.explode({
        handles
    }))}`, {
        ...opts
    }));
}
/**
 * Displays active users info given a list of ids
 */
export function getUsersByIds({ ids }: {
    ids: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserNjA4OtQwMtq4[];
    }>(`/users/by-ids${QS.query(QS.explode({
        ids
    }))}`, {
        ...opts
    }));
}
/**
 * Displays connections of many users given a list of ids
 */
export function getUsersConnections({ ids }: {
    ids: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ConnectionStatusLte5MzQ3MTcw[];
    }>(`/users/connections${QS.query(QS.explode({
        ids
    }))}`, {
        ...opts
    }));
}
/**
 * Revoke a verified user identity.  Specify email.
 */
export function revokeIdentity({ email }: {
    email: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/users/revoke-identity${QS.query(QS.explode({
        email
    }))}`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Delete a user (irrevocable!)
 */
export function deleteUser({ uid, email }: {
    uid: string;
    email: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/users/${encodeURIComponent(uid)}${QS.query(QS.explode({
        email
    }))}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 * Displays user's connections
 */
export function getUserConnections({ uid }: {
    uid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserConnectionGroupsLTg5OdMwMda5;
    }>(`/users/${encodeURIComponent(uid)}/connections`, {
        ...opts
    }));
}
/**
 * Change a user's email address.
 */
export function putEmail({ uid, emailUpdateNjQ5MDg1Oty0 }: {
    uid: string;
    emailUpdateNjQ5MDg1Oty0: EmailUpdateNjQ5MDg1Oty0;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/users/${encodeURIComponent(uid)}/email`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: emailUpdateNjQ5MDg1Oty0
    })));
}
/**
 * Search for users on behalf of
 */
export function searchUsers({ uid, q, size }: {
    uid: string;
    q?: string;
    size?: number;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: SearchResultContactOtExNzg4Mte0;
    }>(`/users/${encodeURIComponent(uid)}/search${QS.query(QS.explode({
        q,
        size
    }))}`, {
        ...opts
    }));
}
/**
 * Suspends user with this ID
 */
export function suspendUser({ uid }: {
    uid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/users/${encodeURIComponent(uid)}/suspend`, {
        ...opts,
        method: "POST"
    }));
}
/**
 * Unsuspends user with this ID
 */
export function unsuspendUser({ uid }: {
    uid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Blob;
    }>(`/users/${encodeURIComponent(uid)}/unsuspend`, {
        ...opts,
        method: "POST"
    }));
}
