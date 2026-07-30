/**
 * Wire-Server Internal API (galley)
 * DO NOT MODIFY - This file has been generated using oazapfts.
 * See https://www.npmjs.com/package/oazapfts
 */
import * as Oazapfts from "@oazapfts/runtime";
import * as QS from "@oazapfts/runtime/query";
export const defaults: Oazapfts.Defaults<Oazapfts.CustomHeaders> = {
    headers: {},
    baseUrl: "http://localhost:9085"
};
const oazapfts = Oazapfts.runtime(defaults);
export const servers = {
    server1: "http://localhost:9085"
};
export type Uuid = string;
export type RemoveBotLTg5Mty2NjMz = {
    bot: Uuid;
    conversation: Uuid;
};
export type AccessNjkyMzE5ODc0 = "private" | "invite" | "link" | "code";
export type AccessRoleLegacyLtYwOtAxMdi1 = "private" | "team" | "activated" | "non_activated";
export type AccessRoleMzk3MdYzMzcw = "team_member" | "non_team_member" | "guest" | "service";
export type AddPermissionLte1MzgzNzE3 = "admins" | "everyone";
export type JoinTypeLty4MDg2MzA5 = "external_add" | "internal_add";
export type CellsStateLTg4MdEwNda5 = "disabled" | "pending" | "ready";
export type CipherSuiteTag = number;
export type Ascii = string;
export type RoleName = string;
export type HistoryDuration = string;
export type EpochTimestamp = string;
export type GroupConvTypeLtu4NjU0Mty5 = "group_conversation" | "channel" | "meeting";
export type GroupId = string;
export type History = {
    depth: HistoryDuration;
};
export type Domain = string;
export type QualifiedIdIdTagUserLtq1NtIwNdm1 = {
    domain: Domain;
    id: Uuid;
};
export type ServiceRefLTgxMjY3NzAz = {
    id: Uuid;
    provider: Uuid;
};
export type OtherMemberLTgzNzE2MTk4 = {
    conversation_role?: RoleName;
    id?: Uuid;
    qualified_id: QualifiedIdIdTagUserLtq1NtIwNdm1;
    service?: ServiceRefLTgxMjY3NzAz;
    /** deprecated */
    status?: number;
};
export type MemberOta5OTgyNzcw = {
    conversation_role?: RoleName;
    hidden?: boolean;
    hidden_ref?: string;
    id?: Uuid;
    otr_archived?: boolean;
    otr_archived_ref?: string;
    otr_muted_ref?: string;
    otr_muted_status?: number;
    qualified_id: QualifiedIdIdTagUserLtq1NtIwNdm1;
    service?: ServiceRefLTgxMjY3NzAz;
    status?: unknown;
    status_ref?: unknown;
    status_time?: unknown;
};
export type OwnConvMembersLtEwMzUzOdMy = {
    /** All other current users of this conversation */
    others: OtherMemberLTgzNzE2MTk4[];
    self: MemberOta5OTgyNzcw;
};
export type ProtocolTagODg1Mte5NjEw = "proteus" | "mls" | "mixed";
export type QualifiedIdIdTagConversationLtq5NdQwNjc5 = {
    domain: Domain;
    id: Uuid;
};
export type EdMemberLeftReasonOtAyMda4NzEw = "left" | "user-deleted" | "removed";
export type TypingStatusLTg5MzcyNdMy = "started" | "stopped";
export type ConvTypeMzM0Nte3Ode5 = 0 | 1 | 2 | 3;
export type HttpsUrl = string;
export type SimpleMemberNty5MTcxMzcx = {
    conversation_role?: RoleName;
    id?: Uuid;
    qualified_id: QualifiedIdIdTagUserLtq1NtIwNdm1;
};
export type UtcTimeMillis = string;
export type EventTypeLtq3NtQyNdYz = "conversation.member-join" | "conversation.member-leave" | "conversation.member-update" | "conversation.rename" | "conversation.access-update" | "conversation.receipt-mode-update" | "conversation.message-timer-update" | "conversation.code-update" | "conversation.code-delete" | "conversation.create" | "conversation.delete" | "conversation.mls-reset" | "conversation.connect-request" | "conversation.typing" | "conversation.otr-message-add" | "conversation.mls-message-add" | "conversation.mls-welcome" | "conversation.protocol-update" | "conversation.add-permission-update" | "conversation.history-update";
export type EventViaMjc4MzcyNzE0 = "scim" | "user";
export type EventLtMwMtMyOdm5 = {
    conversation?: Uuid;
    /** The action of changing the permission to add members to a channel */
    data: {
        access: AccessNjkyMzE5ODc0[];
        access_role?: AccessRoleLegacyLtYwOtAxMdi1;
        access_role_v2?: AccessRoleMzk3MdYzMzcw[];
        add_permission: AddPermissionLte1MzgzNzE3;
        add_type: JoinTypeLty4MDg2MzA5;
        cells_state?: CellsStateLTg4MdEwNda5;
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
        group_conv_type?: GroupConvTypeLtu4NjU0Mty5;
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
        members: OwnConvMembersLtEwMzUzOdMy;
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
        protocol?: ProtocolTagODg1Mte5NjEw;
        qualified_id: QualifiedIdIdTagConversationLtq5NdQwNjc5;
        qualified_recipient: QualifiedIdIdTagUserLtq1NtIwNdm1;
        qualified_target: QualifiedIdIdTagUserLtq1NtIwNdm1;
        qualified_user_ids: QualifiedIdIdTagUserLtq1NtIwNdm1[];
        reason: EdMemberLeftReasonOtAyMda4NzEw;
        /** Conversation receipt mode */
        receipt_mode: number;
        /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
        recipient: string;
        /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
        sender: string;
        status: TypingStatusLTg5MzcyNdMy;
        target?: Uuid;
        team?: Uuid;
        /** The ciphertext for the recipient (Base64 in JSON) */
        text: string;
        "type": ConvTypeMzM0Nte3Ode5;
        uri: HttpsUrl;
        /** Deprecated, use qualified_user_ids */
        user_ids: Uuid[];
        users: SimpleMemberNty5MTcxMzcx[];
    };
    "from"?: Uuid;
    qualified_conversation: QualifiedIdIdTagConversationLtq5NdQwNjc5;
    qualified_from: QualifiedIdIdTagUserLtq1NtIwNdm1;
    subconv?: string;
    team?: Uuid;
    time: UtcTimeMillis;
    "type": EventTypeLtq3NtQyNdYz;
    via: EventViaMjc4MzcyNzE0;
};
export type AddBotNTk4Ndq2NjQ1 = {
    bot: Uuid;
    /** A 64-bit unsigned integer, represented as a hexadecimal numeral. Any valid hexadecimal numeral is accepted, but the backend will only produce representations with lowercase digits and no leading zeros */
    client: string;
    conversation: Uuid;
    service: ServiceRefLTgxMjY3NzAz;
};
export type FeatureDefaults20LegalholdConfig = unknown;
export type KeyPair20EcdsaSecp256R1Sha256 = string;
export type KeyPair20EcdsaSecp384R1Sha384 = string;
export type KeyPair20EcdsaSecp521R1Sha512 = string;
export type KeyPair20Ed25519 = string;
export type MlsPrivateKeysMTg5NzU3Oty1 = {
    ecdsa_secp256r1_sha256: KeyPair20EcdsaSecp256R1Sha256;
    ecdsa_secp384r1_sha384: KeyPair20EcdsaSecp384R1Sha384;
    ecdsa_secp521r1_sha512: KeyPair20EcdsaSecp521R1Sha512;
    ed25519: KeyPair20Ed25519;
};
export type MlsKeysByPurposeMlsPrivateKeysMzQ0NTg1Odm4 = {
    removal: MlsPrivateKeysMTg5NzU3Oty1;
};
export type ConversationSubsystemConfigNDk5MjgxNtQy = {
    federation_protocols?: ProtocolTagODg1Mte5NjEw[];
    legalhold_defaults: FeatureDefaults20LegalholdConfig;
    listClientsUsingBrig: boolean;
    max_conv_size: number;
    mls_keys?: MlsKeysByPurposeMlsPrivateKeysMzQ0NTg1Odm4;
};
export type ConnectOdy3Ote4NtYx = {
    email?: string;
    message?: string;
    name?: string;
    qualified_recipient: QualifiedIdIdTagUserLtq1NtIwNdm1;
    recipient?: Uuid;
};
export type UtcTime = string;
export type V6OwnConversationNdu4NDc3MDgzV6 = {
    access: AccessNjkyMzE5ODc0[];
    access_role: AccessRoleMzk3MdYzMzcw[];
    add_permission?: AddPermissionLte1MzgzNzE3;
    cells_state?: CellsStateLTg4MdEwNda5;
    cipher_suite?: CipherSuiteTag;
    creator?: Uuid;
    /** The epoch number of the corresponding MLS group */
    epoch: number;
    epoch_timestamp?: UtcTime;
    group_conv_type?: GroupConvTypeLtu4NjU0Mty5;
    group_id: GroupId;
    history?: History;
    id?: Uuid;
    last_event?: string;
    last_event_time?: string;
    members: OwnConvMembersLtEwMzUzOdMy;
    /** Per-conversation message timer (can be null) */
    message_timer?: number;
    name?: string;
    parent?: Uuid;
    protocol?: ProtocolTagODg1Mte5NjEw;
    qualified_id: QualifiedIdIdTagConversationLtq5NdQwNjc5;
    /** Conversation receipt mode */
    receipt_mode?: number;
    team?: Uuid;
    "type": ConvTypeMzM0Nte3Ode5;
};
export type ActorLTc2Oti4NzUx = "local_actor" | "remote_actor";
export type DesiredMembershipLTcxMDk2Mzcz = "included" | "excluded";
export type UpsertOne2OneConversationRequestLTg4OTc0OtIx = {
    actor: ActorLTc2Oti4NzUx;
    actor_desired_membership: DesiredMembershipLTcxMDk2Mzcz;
    conversation_id: QualifiedIdIdTagConversationLtq5NdQwNjc5;
    local_user: QualifiedIdIdTagUserLtq1NtIwNdm1;
    remote_user: QualifiedIdIdTagUserLtq1NtIwNdm1;
};
export type ConvMembersLTc2MDg1NDg2 = {
    /** All other current users of this conversation */
    others: OtherMemberLTgzNzE2MTk4[];
    self?: MemberOta5OTgyNzcw;
};
export type ConversationLtu5NTc0Nti2 = {
    access: AccessNjkyMzE5ODc0[];
    access_role: AccessRoleMzk3MdYzMzcw[];
    add_permission?: AddPermissionLte1MzgzNzE3;
    cells_state?: CellsStateLTg4MdEwNda5;
    cipher_suite?: CipherSuiteTag;
    creator?: Uuid;
    /** The epoch number of the corresponding MLS group */
    epoch: number;
    epoch_timestamp?: UtcTime;
    group_conv_type?: GroupConvTypeLtu4NjU0Mty5;
    group_id: GroupId;
    history?: History;
    last_event?: string;
    last_event_time?: string;
    members: ConvMembersLTc2MDg1NDg2;
    /** Per-conversation message timer (can be null) */
    message_timer?: number;
    name?: string;
    parent?: Uuid;
    protocol?: ProtocolTagODg1Mte5NjEw;
    qualified_id: QualifiedIdIdTagConversationLtq5NdQwNjc5;
    /** Conversation receipt mode */
    receipt_mode?: number;
    team?: Uuid;
    "type": ConvTypeMzM0Nte3Ode5;
};
export type V9OwnConversationNdu4NDc3MDgz = {
    access: AccessNjkyMzE5ODc0[];
    access_role: AccessRoleMzk3MdYzMzcw[];
    add_permission?: AddPermissionLte1MzgzNzE3;
    cells_state?: CellsStateLTg4MdEwNda5;
    cipher_suite?: CipherSuiteTag;
    creator?: Uuid;
    /** The epoch number of the corresponding MLS group */
    epoch: number;
    epoch_timestamp?: UtcTime;
    group_conv_type?: GroupConvTypeLtu4NjU0Mty5;
    group_id: GroupId;
    history?: History;
    id?: Uuid;
    last_event?: string;
    last_event_time?: string;
    members: OwnConvMembersLtEwMzUzOdMy;
    /** Per-conversation message timer (can be null) */
    message_timer?: number;
    name?: string;
    parent?: Uuid;
    protocol?: ProtocolTagODg1Mte5NjEw;
    qualified_id: QualifiedIdIdTagConversationLtq5NdQwNjc5;
    /** Conversation receipt mode */
    receipt_mode?: number;
    team?: Uuid;
    "type": ConvTypeMzM0Nte3Ode5;
};
export type ConversationMetadataLTg2Odq3Ody1 = {
    access: AccessNjkyMzE5ODc0[];
    access_role: AccessRoleMzk3MdYzMzcw[];
    add_permission?: AddPermissionLte1MzgzNzE3;
    cells_state?: CellsStateLTg4MdEwNda5;
    creator?: Uuid;
    group_conv_type?: GroupConvTypeLtu4NjU0Mty5;
    history?: History;
    last_event?: string;
    last_event_time?: string;
    /** Per-conversation message timer (can be null) */
    message_timer?: number;
    name?: string;
    parent?: Uuid;
    /** Conversation receipt mode */
    receipt_mode?: number;
    team?: Uuid;
    "type": ConvTypeMzM0Nte3Ode5;
};
export type CustomBackendLtQxOdi0MjQ0 = {
    config_json_url: HttpsUrl;
    webapp_welcome_url: HttpsUrl;
};
export type AllowedGlobalOperationsConfigMzAwOtu1MDkx = {
    mlsConversationReset: boolean;
};
export type LockStatusLtIyMtu5OTkw = "locked" | "unlocked";
export type FeatureStatusLtMzMtUwOdEw = "enabled" | "disabled";
export type LockableFeatureAllowedGlobalOperationsConfigNjQ1MjA5MdYw = {
    config: AllowedGlobalOperationsConfigMzAwOtu1MDkx;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type AppLockConfigBCoveredIdentityNdIxOTc2Njkz = {
    enforceAppLock: boolean;
    inactivityTimeoutSecs: number;
};
export type LockableFeatureAppLockConfigBBareIdentityODgzNdi0Otu5 = {
    config: AppLockConfigBCoveredIdentityNdIxOTc2Njkz;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureAppsConfigMzQyNtMxNTk5 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureAssetAuditLogConfigNdq3MzcyMzk2 = {
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
export type LockableFturExpsInviUrTmAdCfgLtQzMzU2Oty1 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
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
export type MlsE2EIdConfigBCoveredIdentityNdq0NjEwNzA3 = {
    acmeDiscoveryUrl?: HttpsUrl;
    crlProxy?: HttpsUrl;
    useProxyOnMobile?: boolean;
    verificationExpiration: number;
};
export type LockableFeatureMlsE2EIdConfigBBareIdentityMtu2ODkyMDc4 = {
    config: MlsE2EIdConfigBCoveredIdentityNdq0NjEwNzA3;
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type MlsMigrationConfigBCoveredIdentityLtm3Ndq4Mzg4 = {
    finaliseRegardlessAfter?: string;
    startTime?: string;
};
export type LockableFturMsignCfBIdyLte1NjAxNjU2 = {
    config: MlsMigrationConfigBCoveredIdentityLtm3Ndq4Mzg4;
    lockStatus: LockStatusLtIyMtu5OTkw;
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
export type LockableFeatureSearchVisibilityAvailableConfigLTkxMta5ODk5 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeatureSearchVisibilityInboundConfigNzA5NzczNTgy = {
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
export type LockableFturSimpfdUsCnRqQgNjk5NjU4OTgy = {
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
export type NpLockableFturGhdCnfiSoVsyAvIRqExmDpBMGwUt2QLtm1Mzc0ODgy = {
    allowedGlobalOperations: LockableFeatureAllowedGlobalOperationsConfigNjQ1MjA5MdYw;
    appLock: LockableFeatureAppLockConfigBBareIdentityODgzNdi0Otu5;
    apps: LockableFeatureAppsConfigMzQyNtMxNTk5;
    assetAuditLog: LockableFeatureAssetAuditLogConfigNdq3MzcyMzk2;
    backgroundEffects: LockableFeatureBackgroundEffectsConfigMTg1MTk3Ntm5;
    cells: LockableFeatureCellsConfigBBareIdentityLTgzMda1NjI3;
    cellsInternal: LockableFturCsInfigBdyLtq3Mtu3Mjg0;
    channels: LockableFeatureChannelsConfigBBareIdentityNzA2NdEyMdEw;
    chatBubbles: LockableFeatureChatBubblesConfigNDgwMtQzNjI2;
    classifiedDomains: LockableFeatureClassifiedDomainsConfigLty1OdQwODg1;
    conferenceCalling: LockableFturCnfigBIdyNzY1Ndu5MdAy;
    consumableNotifications: LockableFeatureConsumableNotificationsConfigMjUxMjczMjM0;
    conversationGuestLinks: LockableFeatureGuestLinksConfigLTcwNjU0NdMw;
    digitalSignatures: LockableFeatureDigitalSignaturesConfigOdm2Mda2Ndu4;
    domainRegistration: LockableFeatureDomainRegistrationConfigNzU0NjczNte0;
    enforceFileDownloadLocation: LockableFturEnfiDwdCgBIyOda5Ota5Mtq4;
    exposeInvitationURLsToTeamAdmin: LockableFturExpsInviUrTmAdCfgLtQzMzU2Oty1;
    fileSharing: LockableFeatureFileSharingConfigMjgwNjIzOdEz;
    legalhold: LockableFeatureLegalholdConfigLTc5MTk5OtIw;
    limitedEventFanout: LockableFeatureLimitedEventFanoutConfigMTg3Odm0NzU0;
    meetings: LockableFeatureMeetingsConfigLte0Otq5Nzcw;
    meetingsPremium: LockableFeatureMeetingsPremiumConfigNDg1OdEyNta1;
    mls: LockableFeatureMlsConfigBBareIdentityMTg1MTc0NtEw;
    mlsE2EId: LockableFeatureMlsE2EIdConfigBBareIdentityMtu2ODkyMDc4;
    mlsMigration: LockableFturMsignCfBIdyLte1NjAxNjU2;
    outlookCalIntegration: LockableFeatureOutlookCalIntegrationConfigNjQ0MzMyMzY0;
    preventAdminlessGroups: LockableFturPvnAdmisGpCfgBIyMtQxOtu4Mzgw;
    searchVisibility: LockableFeatureSearchVisibilityAvailableConfigLTkxMta5ODk5;
    searchVisibilityInbound: LockableFeatureSearchVisibilityInboundConfigNzA5NzczNTgy;
    selfDeletingMessages: LockableFturSfDingMsCbIdyLTg5MtEwNta2;
    simplifiedUserConnectionRequestQRCode: LockableFturSimpfdUsCnRqQgNjk5NjU4OTgy;
    sndFactorPasswordChallenge: LockableFeatureSndFactorPasswordChallengeConfigMjQ3NzQ2ODgx;
    sso: LockableFeatureSsoConfigNjcyMjU4Mdy2;
    stealthUsers: LockableFeatureStealthUsersConfigLte1MTk2NzIz;
    validateSAMLemails: LockableFturRqiExnmVfCgNjUyMzgzNzY5;
};
export type ConfiguredFeatureFlags = unknown;
export type RemoteDomainsMtUzNtMyMjAw = {
    domains: Domain[];
};
export type ClientListNdIyNjE4NTg3 = {
    client_ids: string[];
};
export type LegalholdProtectee = {
    /** A UserId for ProtectedUser, otherwise empty / null. */
    contents?: string;
    tag?: "ProtectedUser" | "UnprotectedBot" | "LegalholdPlusFederationNotImplemented";
};
export type UserClients = {
    [key: string]: string[];
};
export type GuardLegalholdPolicyConflictsMjAyMjgwNjk5 = {
    glhProtectee: LegalholdProtectee;
    glhUserClients: UserClients;
};
export type Fingerprint = string;
export type ServiceLty5NzY4MtEw = {
    auth_token: Ascii;
    base_url: HttpsUrl;
    enabled: boolean;
    fingerprints: Fingerprint[];
    ref: ServiceRefLTgxMjY3NzAz;
};
export type TeamStatusOdYyMtUyMzE1 = "active" | "pending_delete" | "deleted" | "suspended" | "pending_active";
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
export type NewTeamMtMzOtIwNjM5 = {
    icon: Icon;
    /** The decryption key for the team icon S3 asset */
    icon_key?: string;
    /** team name */
    name: string;
};
export type LockableFturPhApCnfigBIdyLtq0NzQyOdu1 = {
    config?: AppLockConfigBCoveredIdentityNdIxOTc2Njkz;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureAppLockConfigBBareIdentityMtAzMjI5NdYy = {
    config: AppLockConfigBCoveredIdentityNdIxOTc2Njkz;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type AppsConfigMjA3NDg3NzI5 = unknown;
export type LockableFeaturePatchAppsConfigLte0NzQ5NzA0 = {
    config?: AppsConfigMjA3NDg3NzI5;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureAppsConfigNde5Otm3MjM1 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockStatusResponseLtUzNzQzOTc5 = {
    lockStatus: LockStatusLtIyMtu5OTkw;
};
export type BackgroundEffectsConfigOtAyNDc2NzM0 = unknown;
export type LockableFeaturePatchBackgroundEffectsConfigMzI0MtYwOTky = {
    config?: BackgroundEffectsConfigOtAyNDc2NzM0;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureBackgroundEffectsConfigMjQyOTkxMDc4 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeaturePatchCellsConfigBBareIdentityMjQ0MTk4MDg5 = {
    config?: CellsConfigBCoveredIdentityLte1NzkwOTcz;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureCellsConfigBBareIdentityNzU2NjgxNzEw = {
    config: CellsConfigBCoveredIdentityLte1NzkwOTcz;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFturPhCsInfigBdyLTc0NjM1ODky = {
    config?: CellsInternalConfigBCoveredIdentityLtUzMDkwOtAz;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureCellsInternalConfigBBareIdentityOdm1Mjg1Mtq2 = {
    config: CellsInternalConfigBCoveredIdentityLtUzMDkwOtAz;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFturPhCnsfigBIdyLtMxNTg0Ntq5 = {
    config?: ChannelsConfigBCoveredIdentityODk2MTk3Ndq4;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureChannelsConfigBBareIdentityLtu4Nte4MTgx = {
    config: ChannelsConfigBCoveredIdentityODk2MTk3Ndq4;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type ChatBubblesConfigLtm5Ntm1NdUx = unknown;
export type LockableFeaturePatchChatBubblesConfigNDg1NzkwNtu4 = {
    config?: ChatBubblesConfigLtm5Ntm1NdUx;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureChatBubblesConfigLty2ODk1MtIx = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFturPhCnfigBIdyNjkxOtExMTgz = {
    config?: ConferenceCallingConfigBCoveredIdentityNdMwMjcyMzM1;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureConferenceCallingConfigBBareIdentityNjc2NTcxNti3 = {
    config?: ConferenceCallingConfigBCoveredIdentityNdMwMjcyMzM1;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type ConsumableNotificationsConfigNDgxNda5Odq1 = unknown;
export type LockableFeaturePatchConsumableNotificationsConfigLTc1MjkzOtAy = {
    config?: ConsumableNotificationsConfigNDgxNda5Odq1;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureConsumableNotificationsConfigLtMzMzM4Mjkz = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type GuestLinksConfigNdi3Ntm1MtMw = unknown;
export type LockableFeaturePatchGuestLinksConfigNjU5NjAwNDg3 = {
    config?: GuestLinksConfigNdi3Ntm1MtMw;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureGuestLinksConfigNjQyMdMxNjg3 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type DigitalSignaturesConfigLtIyMdu0Ota1 = unknown;
export type LockableFeaturePatchDigitalSignaturesConfigMjAyNjQ0MzI1 = {
    config?: DigitalSignaturesConfigLtIyMdu0Ota1;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureDigitalSignaturesConfigNjUxMjg5Mta2 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type DomainRegistrationConfigNdQwMtQzNzAz = unknown;
export type LockableFeaturePatchDomainRegistrationConfigMjA0NjUxOtEy = {
    config?: DomainRegistrationConfigNdQwMtQzNzAz;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureDomainRegistrationConfigLtUxNti3NjYy = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFturPhEnfiDwdCgBIyLTcwODgxOtQw = {
    config?: EnforceFilDwadLtCgBVIyLtq2NjU1Nzcx;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeaturEnfocilDwdLCgBIyMjcxMzc1Nda5 = {
    config: EnforceFilDwadLtCgBVIyLtq2NjU1Nzcx;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type ExposeInvitationUrLsToTeamAdminConfigNzg3OdAzNTgx = unknown;
export type LockableFturPhExpsInviUrTmAdCfgLTc4MjU5ODk2 = {
    config?: ExposeInvitationUrLsToTeamAdminConfigNzg3OdAzNTgx;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureExposeInvitationUrLsToTeamAdminConfigLty5NzY2Mzg5 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FileSharingConfigNzI0ODc5OTgz = unknown;
export type LockableFeaturePatchFileSharingConfigMjMyNda3MdIz = {
    config?: FileSharingConfigNzI0ODc5OTgz;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureFileSharingConfigLtUyNjkxMzM4 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LegalholdConfigNzMxMjk5NzMw = unknown;
export type LockableFeaturePatchLegalholdConfigLtm4ODc4NDcx = {
    config?: LegalholdConfigNzMxMjk5NzMw;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureLegalholdConfigNjM3MTkxNjYw = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LimitedEventFanoutConfigLty4NzUzOtYy = unknown;
export type LockableFeaturePatchLimitedEventFanoutConfigLtIwNzE3Mtm5 = {
    config?: LimitedEventFanoutConfigLty4NzUzOtYy;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureLimitedEventFanoutConfigLte2MzA5Mtu1 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type MeetingsConfigOtAwOTgzMDg2 = unknown;
export type LockableFeaturePatchMeetingsConfigLtQzMjc2Nty5 = {
    config?: MeetingsConfigOtAwOTgzMDg2;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureMeetingsConfigNDc2MzM0Mde1 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type MeetingsPremiumConfigLtu5Odm5Mjc3 = unknown;
export type LockableFeaturePatchMeetingsPremiumConfigMzE0MjE4Nzcx = {
    config?: MeetingsPremiumConfigLtu5Odm5Mjc3;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureMeetingsPremiumConfigNzE4NjUzMde0 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFeaturePatchMlsConfigBBareIdentityLtq4NjgwNdQx = {
    config?: MlsConfigBCoveredIdentityLtEzNTk3MzM5;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureMlsConfigBBareIdentityLti5MjA3MdYy = {
    config: MlsConfigBCoveredIdentityLtEzNTk3MzM5;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFturPhMsE2IdCnfigByLtm3NTk5MjAz = {
    config?: MlsE2EIdConfigBCoveredIdentityNdq0NjEwNzA3;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureMlsE2EIdConfigBBareIdentityLtUxOdYzOdEx = {
    config: MlsE2EIdConfigBCoveredIdentityNdq0NjEwNzA3;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFturPhMsignCfBIdyNdQxNjA2NtAx = {
    config?: MlsMigrationConfigBCoveredIdentityLtm3Ndq4Mzg4;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureMlsMigrationConfigBBareIdentityLtQyMdAxMTkz = {
    config: MlsMigrationConfigBCoveredIdentityLtm3Ndq4Mzg4;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type OutlookCalIntegrationConfigLtEwNzc2Odi4 = unknown;
export type LockableFeaturePatchOutlookCalIntegrationConfigMtm5Mte4ODkz = {
    config?: OutlookCalIntegrationConfigLtEwNzc2Odi4;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureOutlookCalIntegrationConfigLTg0MjIxNtMx = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFturPhVnAdmisGpCfgBIyLTc3MDg2MjUy = {
    config?: PreventAdminlessGroupsConfigBCoveredIdentityMjQ2NdYwMTk2;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeaturPvnAdmilsGopCfgBIyLte2NzM3ODkx = {
    config: PreventAdminlessGroupsConfigBCoveredIdentityMjQ2NdYwMTk2;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type SearchVisibilityAvailableConfigLTcwMjg4NTg3 = unknown;
export type LockableFturPhSVisyAvCnfgLtExNzU3MdIw = {
    config?: SearchVisibilityAvailableConfigLTcwMjg4NTg3;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureSearchVisibilityAvailableConfigLtMzNTkxOdi1 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type SearchVisibilityInboundConfigLty5MdAwOtIx = unknown;
export type LockableFeaturePatchSearchVisibilityInboundConfigNzE1MdAzNzQy = {
    config?: SearchVisibilityInboundConfigLty5MdAwOtIx;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureSearchVisibilityInboundConfigMti1NzQxOdy2 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type LockableFturPhSfDingMsCbIdyMzQ5MtIzMzc5 = {
    config?: SelfDeletingMessagesConfigBCoveredIdentityLty0NzQ4MzU1;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeaturSlfDingMsCoBIdyLTg2MzYzNjc2 = {
    config: SelfDeletingMessagesConfigBCoveredIdentityLty0NzQ4MzU1;
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type SimplifiedUserConnectionRequestQrCodeConfigMzIwMDg5Ody5 = unknown;
export type LockableFturPhSimpfdUsCnRqQgLtEzNty0NjI1 = {
    config?: SimplifiedUserConnectionRequestQrCodeConfigMzIwMDg5Ody5;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeaturSimplfdUsConcRqQgNzA5NdExNDc0 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type SndFactorPasswordChallengeConfigMjA5Ndm2NzIw = unknown;
export type LockableFturPhSndswCgfiLti4NtQwMjc2 = {
    config?: SndFactorPasswordChallengeConfigMjA5Ndm2NzIw;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureSndFactorPasswordChallengeConfigNDc0MzUyMzQz = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type SsoConfigMtMyNjAxMjY5 = unknown;
export type LockableFeaturePatchSsoConfigMzkxNzA3MdMz = {
    config?: SsoConfigMtMyNjAxMjY5;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureSsoConfigNzYyMjQ3OtAy = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type StealthUsersConfigLTk2NjU3Mtq1 = unknown;
export type LockableFeaturePatchStealthUsersConfigLtIzNTk0MzM5 = {
    config?: StealthUsersConfigLTk2NjU3Mtq1;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureStealthUsersConfigLty5Mty3Mte0 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type RequireExternalEmailVerificationConfigLtUwNdy3ODgw = unknown;
export type LockableFturPhRqiExnmVfCgLtq5Ndi4Ota4 = {
    config?: RequireExternalEmailVerificationConfigLtUwNdy3ODgw;
    lockStatus?: LockStatusLtIyMtu5OTkw;
    status?: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type FeatureRequireExternalEmailVerificationConfigLte3MjU1Odi2 = {
    status: FeatureStatusLtMzMtUwOdEw;
    ttl?: number;
};
export type ListTypeLTkyMdm4MzA1 = true | false;
export type UserLegalHoldStatusLtq2Oda2Ntu5 = "enabled" | "pending" | "disabled" | "no_consent";
export type PermissionsNde0Odm5NdUx = {
    /** Permissions that this user is able to grant others */
    copy: number;
    /** Permissions that the user has */
    self: number;
};
export type TeamMemberRequiredLtm2NjE1Mde3 = {
    created_at?: UtcTimeMillis;
    created_by?: Uuid;
    legalhold_status?: UserLegalHoldStatusLtq2Oda2Ntu5;
    permissions: PermissionsNde0Odm5NdUx;
    user: Uuid;
};
export type TeamMemberListRequiredNzI1MjgxNdq5 = {
    hasMore: ListTypeLTkyMdm4MzA1;
    /** the array of team members */
    members: TeamMemberRequiredLtm2NjE1Mde3[];
};
export type NewTeamMemberRequiredLTg2NjU5Oti2 = {
    /** the team member to add (the legalhold_status field must be null or missing!) */
    member: {
        created_at?: UtcTimeMillis;
        created_by?: Uuid;
        permissions: PermissionsNde0Odm5NdUx;
        user: Uuid;
    };
};
export type UserIdsNtm1MzkyNtq2 = {
    ids: Uuid[];
};
export type TeamMemberInfoNjM3NjEzOtq1 = {
    permissions: PermissionsNde0Odm5NdUx;
    permissionsWriteTime: UtcTimeMillis;
    userId: Uuid;
};
export type TeamMemberInfoListMzUyOtEzMjE2 = {
    members: TeamMemberInfoNjM3NjEzOtq1[];
};
export type TeamNameLtYwMti2MzI4 = {
    name: string;
};
export type TeamSearchVisibilityLtIzOde2Njk3 = "standard" | "no-name-outside-team";
export type TeamSearchVisibilityViewMzg3MzMzMTk3 = {
    search_visibility: TeamSearchVisibilityLtIzOde2Njk3;
};
export type AlphaLte4NdUxNdq4 = "AED" | "AFN" | "ALL" | "AMD" | "ANG" | "AOA" | "ARS" | "AUD" | "AWG" | "AZN" | "BAM" | "BBD" | "BDT" | "BGN" | "BHD" | "BIF" | "BMD" | "BND" | "BOB" | "BOV" | "BRL" | "BSD" | "BTN" | "BWP" | "BYN" | "BZD" | "CAD" | "CDF" | "CHE" | "CHF" | "CHW" | "CLF" | "CLP" | "CNY" | "COP" | "COU" | "CRC" | "CUC" | "CUP" | "CVE" | "CZK" | "DJF" | "DKK" | "DOP" | "DZD" | "EGP" | "ERN" | "ETB" | "EUR" | "FJD" | "FKP" | "GBP" | "GEL" | "GHS" | "GIP" | "GMD" | "GNF" | "GTQ" | "GYD" | "HKD" | "HNL" | "HRK" | "HTG" | "HUF" | "IDR" | "ILS" | "INR" | "IQD" | "IRR" | "ISK" | "JMD" | "JOD" | "JPY" | "KES" | "KGS" | "KHR" | "KMF" | "KPW" | "KRW" | "KWD" | "KYD" | "KZT" | "LAK" | "LBP" | "LKR" | "LRD" | "LSL" | "LYD" | "MAD" | "MDL" | "MGA" | "MKD" | "MMK" | "MNT" | "MOP" | "MRO" | "MUR" | "MVR" | "MWK" | "MXN" | "MXV" | "MYR" | "MZN" | "NAD" | "NGN" | "NIO" | "NOK" | "NPR" | "NZD" | "OMR" | "PAB" | "PEN" | "PGK" | "PHP" | "PKR" | "PLN" | "PYG" | "QAR" | "RON" | "RSD" | "RUB" | "RWF" | "SAR" | "SBD" | "SCR" | "SDG" | "SEK" | "SGD" | "SHP" | "SLL" | "SOS" | "SRD" | "SSP" | "STD" | "SVC" | "SYP" | "SZL" | "THB" | "TJS" | "TMT" | "TND" | "TOP" | "TRY" | "TTD" | "TWD" | "TZS" | "UAH" | "UGX" | "USD" | "USN" | "UYI" | "UYU" | "UZS" | "VEF" | "VND" | "VUV" | "WST" | "XAF" | "XAG" | "XAU" | "XBA" | "XBB" | "XBC" | "XBD" | "XCD" | "XDR" | "XOF" | "XPD" | "XPF" | "XPT" | "XSU" | "XTS" | "XUA" | "XXX" | "YER" | "ZAR" | "ZMW" | "ZWL";
export type TeamStatusUpdateLtEzNTc0NtMz = {
    currency?: AlphaLte4NdUxNdq4;
    status: TeamStatusOdYyMtUyMzE1;
};
export type EjpdConvInfoNDgwMdIyMdAw = {
    conv_id: QualifiedIdIdTagConversationLtq5NdQwNjc5;
    conv_name: string;
};
export type UserLegalHoldStatusEntryNta0MjMyMdIy = {
    status: UserLegalHoldStatusLtq2Oda2Ntu5;
    user: Uuid;
};
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "delete-bot"]
 *
 *
 */
export function deleteBot({ removeBotLTg5Mty2NjMz }: {
    removeBotLTg5Mty2NjMz: RemoveBotLTg5Mty2NjMz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: EventLtMwMtMyOdm5;
    } | {
        status: 204;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "action-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    }>("/i/bots", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: removeBotLTg5Mty2NjMz
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "i-add-bot"]
 *
 *
 */
export function iAddBot({ addBotNTk4Ndq2NjQ1 }: {
    addBotNTk4Ndq2NjQ1: AddBotNTk4Ndq2NjQ1;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: EventLtMwMtMyOdm5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "too-many-members" | "invalid-op" | "action-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    }>("/i/bots", oazapfts.json({
        ...opts,
        method: "POST",
        body: addBotNTk4Ndq2NjQ1
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "remove-client"]
 *
 *
 */
export function removeClient({ cid }: {
    cid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/i/clients/${encodeURIComponent(cid)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "test-add-client"]
 *
 *
 */
export function testAddClient({ cid }: {
    cid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/i/clients/${encodeURIComponent(cid)}`, {
        ...opts,
        method: "POST"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-conversation-config"]
 *
 *
 */
export function getConversationConfig(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ConversationSubsystemConfigNDk5MjgxNtQy;
    }>("/i/conversations/config", {
        ...opts
    }));
}
/**
 * Create a connect conversation (deprecated)
 */
export function connect({ connectOdy3Ote4NtYx }: {
    connectOdy3Ote4NtYx: ConnectOdy3Ote4NtYx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: V6OwnConversationNdu4NDc3MDgzV6;
    } | {
        status: 201;
        data: V6OwnConversationNdu4NDc3MDgzV6;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "not-connected" | "invalid-op";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    } | {
        status: 533;
        data: {
            unreachable_backends: Domain[];
        };
    }>("/i/conversations/connect", oazapfts.json({
        ...opts,
        method: "POST",
        body: connectOdy3Ote4NtYx
    })));
}
/**
 * Create or Update a connect or one2one conversation.
 */
export function upsertOne2One({ upsertOne2OneConversationRequestLTg4OTc0OtIx }: {
    upsertOne2OneConversationRequestLTg4OTc0OtIx: UpsertOne2OneConversationRequestLTg4OTc0OtIx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/i/conversations/one2one/upsert", oazapfts.json({
        ...opts,
        method: "POST",
        body: upsertOne2OneConversationRequestLTg4OTc0OtIx
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "conversation-block"]
 *
 *
 */
export function conversationBlock({ cnvDomain, cnv }: {
    cnvDomain: string;
    cnv: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: unknown[];
    } | {
        status: 403;
        data: {
            code: 403;
            label: "invalid-op";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    }>(`/i/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/block`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "conversation-get-member"]
 *
 *
 */
export function conversationGetMember({ cnvDomain, cnv, usr }: {
    cnvDomain: string;
    cnv: string;
    usr: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: MemberOta5OTgyNzcw;
    }>(`/i/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/members/${encodeURIComponent(usr)}`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "conversation-unblock"]
 *
 *
 */
export function conversationUnblock({ cnvDomain, cnv }: {
    cnvDomain: string;
    cnv: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: unknown[];
    } | {
        status: 403;
        data: {
            code: 403;
            label: "invalid-op";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    }>(`/i/conversations/${encodeURIComponent(cnvDomain)}/${encodeURIComponent(cnv)}/unblock`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-conversation-by-id"]
 *
 *
 */
export function getConversationById({ cnv }: {
    cnv: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ConversationLtu5NTc0Nti2;
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    }>(`/i/conversations/${encodeURIComponent(cnv)}`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "conversation-accept-v2"]
 *
 *
 */
export function conversationAcceptV2({ cnv }: {
    cnv: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: V9OwnConversationNdu4NDc3MDgz;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "invalid-op";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    }>(`/i/conversations/${encodeURIComponent(cnv)}/accept/v2`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "conversation-meta"]
 *
 *
 */
export function conversationMeta({ cnv }: {
    cnv: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ConversationMetadataLTg2Odq3Ody1;
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    }>(`/i/conversations/${encodeURIComponent(cnv)}/meta`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "is-conversation-out-of-sync"]
 *
 *
 */
export function isConversationOutOfSync({ cnv }: {
    cnv: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: boolean;
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    }>(`/i/conversations/${encodeURIComponent(cnv)}/out-of-sync`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "set-cells-state"]
 *
 *
 */
export function setCellsState({ conversation, cellsStateLTg4MdEwNda5 }: {
    conversation: string;
    cellsStateLTg4MdEwNda5: CellsStateLTg4MdEwNda5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "invalid-op";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    }>(`/i/conversations/${encodeURIComponent(conversation)}/cells-state`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: cellsStateLTg4MdEwNda5
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "delete-custom-backend"]
 *
 *
 */
export function deleteCustomBackend({ domain }: {
    domain: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/i/custom-backend/by-domain/${encodeURIComponent(domain)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "put-custom-backend"]
 *
 *
 */
export function putCustomBackend({ domain, customBackendLtQxOdi0MjQ0 }: {
    domain: string;
    customBackendLtQxOdi0MjQ0: CustomBackendLtQxOdi0MjQ0;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/i/custom-backend/by-domain/${encodeURIComponent(domain)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: customBackendLtQxOdi0MjQ0
    })));
}
/**
 * Get all feature configs (for user/team; if n/a fall back to site config).
 */
export function featureConfigsInternal({ userId }: {
    userId?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: NpLockableFturGhdCnfiSoVsyAvIRqExmDpBMGwUt2QLtm1Mzc0ODgy;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/feature-configs${QS.query(QS.explode({
        user_id: userId
    }))}`, {
        ...opts
    }));
}
/**
 * Get the server-wide feature flag defaults (from galley config)
 */
export function getConfiguredFeatureFlags(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ConfiguredFeatureFlags;
    }>("/i/features/configured", {
        ...opts
    }));
}
/**
 * Get the federation status (only needed for integration/QA tests at the time of writing it)
 */
export function getFederationStatus({ remoteDomainsMtUzNtMyMjAw }: {
    remoteDomainsMtUzNtMyMjAw: RemoteDomainsMtUzNtMyMjAw;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: string;
    } | {
        status: 533;
        data: {
            unreachable_backends: Domain[];
        };
    }>("/i/federation-status", oazapfts.json({
        ...opts,
        body: remoteDomainsMtUzNtMyMjAw
    })));
}
/**
 * Get mls conversation client list
 */
export function getConversationClients({ gid }: {
    gid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: ClientListNdIyNjE4NTg3;
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-conversation";
            message: string;
        };
    }>(`/i/group/${encodeURIComponent(gid)}`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "guard-legalhold-policy-conflicts"]
 *
 *
 */
export function guardLegalholdPolicyConflicts({ guardLegalholdPolicyConflictsMjAyMjgwNjk5 }: {
    guardLegalholdPolicyConflictsMjAyMjgwNjk5: GuardLegalholdPolicyConflictsMjAyMjgwNjk5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "missing-legalhold-consent-old-clients" | "missing-legalhold-consent";
            message: string;
        };
    }>("/i/guard-legalhold-policy-conflicts", oazapfts.json({
        ...opts,
        method: "PUT",
        body: guardLegalholdPolicyConflictsMjAyMjgwNjk5
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "unset-team-legalhold-whitelisted"]
 *
 *
 */
export function unsetTeamLegalholdWhitelisted({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/i/legalhold/whitelisted-teams/${encodeURIComponent(tid)}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-team-legalhold-whitelisted"]
 *
 *
 */
export function getTeamLegalholdWhitelisted({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/i/legalhold/whitelisted-teams/${encodeURIComponent(tid)}`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "set-team-legalhold-whitelisted"]
 *
 *
 */
export function setTeamLegalholdWhitelisted({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/i/legalhold/whitelisted-teams/${encodeURIComponent(tid)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "conversation-mls-one-to-one"]
 *
 *
 */
export function conversationMlsOneToOne({ userDomain, user }: {
    userDomain: string;
    user: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: V9OwnConversationNdu4NDc3MDgz;
    } | {
        status: 400;
        data: {
            code: 400;
            label: "mls-not-enabled";
            message: string;
        };
    } | {
        status: 403;
        data: {
            code: 403;
            label: "not-connected";
            message: string;
        };
    }>(`/i/mls-one2one-conversations/${encodeURIComponent(userDomain)}/${encodeURIComponent(user)}`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "conversation-mls-one-to-one-established"]
 *
 *
 */
export function conversationMlsOneToOneEstablished({ userDomain, user }: {
    userDomain: string;
    user: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: boolean;
    } | {
        status: 400;
        data: {
            code: 400;
            label: "mls-not-enabled";
            message: string;
        };
    } | {
        status: 403;
        data: {
            code: 403;
            label: "not-connected";
            message: string;
        };
    }>(`/i/mls-one2one-conversations/${encodeURIComponent(userDomain)}/${encodeURIComponent(user)}/established`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "delete-service"]
 *
 *
 */
export function deleteService({ serviceRefLTgxMjY3NzAz }: {
    serviceRefLTgxMjY3NzAz: ServiceRefLTgxMjY3NzAz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/i/services", oazapfts.json({
        ...opts,
        method: "DELETE",
        body: serviceRefLTgxMjY3NzAz
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "add-service"]
 *
 *
 */
export function addService({ serviceLty5NzY4MtEw }: {
    serviceLty5NzY4MtEw: ServiceLty5NzY4MtEw;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/i/services", oazapfts.json({
        ...opts,
        method: "POST",
        body: serviceLty5NzY4MtEw
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "status"]
 *
 *
 */
export function status(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/i/status", {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "delete-binding-team"]
 *
 *
 */
export function deleteBindingTeam({ tid, force }: {
    tid: string;
    force?: boolean;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 202;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "not-one-member-team" | "no-binding-team";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    } | {
        status: 503;
        data: {
            code: 503;
            label: "queue-full";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}${QS.query(QS.explode({
        force
    }))}`, {
        ...opts,
        method: "DELETE"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-team-internal"]
 *
 *
 */
export function getTeamInternal({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamDataODgyNzY3Otq3;
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "create-binding-team"]
 *
 *
 */
export function createBindingTeam({ tid, newTeamMtMzOtIwNjM5 }: {
    tid: string;
    newTeamMtMzOtIwNjM5: NewTeamMtMzOtIwNjM5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/i/teams/${encodeURIComponent(tid)}`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: newTeamMtMzOtIwNjM5
    })));
}
/**
 * Get config for allowedGlobalOperations
 */
export function igetAllowedGlobalOperationsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureAllowedGlobalOperationsConfigNjQ1MjA5MdYw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/allowedGlobalOperations`, {
        ...opts
    }));
}
/**
 * Get config for appLock
 */
export function igetAppLockConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureAppLockConfigBBareIdentityODgzNdi0Otu5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/appLock`, {
        ...opts
    }));
}
/**
 * Patch config for appLock
 */
export function ipatchAppLockConfigB({ tid, lockableFturPhApCnfigBIdyLtq0NzQyOdu1 }: {
    tid: string;
    lockableFturPhApCnfigBIdyLtq0NzQyOdu1: LockableFturPhApCnfigBIdyLtq0NzQyOdu1;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureAppLockConfigBBareIdentityODgzNdi0Otu5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/appLock`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhApCnfigBIdyLtq0NzQyOdu1
    })));
}
/**
 * Put config for appLock
 */
export function iputAppLockConfigB({ tid, featureAppLockConfigBBareIdentityMtAzMjI5NdYy }: {
    tid: string;
    featureAppLockConfigBBareIdentityMtAzMjI5NdYy: FeatureAppLockConfigBBareIdentityMtAzMjI5NdYy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureAppLockConfigBBareIdentityODgzNdi0Otu5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/appLock`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureAppLockConfigBBareIdentityMtAzMjI5NdYy
    })));
}
/**
 * Get config for apps
 */
export function igetAppsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureAppsConfigMzQyNtMxNTk5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/apps`, {
        ...opts
    }));
}
/**
 * Patch config for apps
 */
export function ipatchAppsConfig({ tid, lockableFeaturePatchAppsConfigLte0NzQ5NzA0 }: {
    tid: string;
    lockableFeaturePatchAppsConfigLte0NzQ5NzA0: LockableFeaturePatchAppsConfigLte0NzQ5NzA0;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureAppsConfigMzQyNtMxNTk5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/apps`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchAppsConfigLte0NzQ5NzA0
    })));
}
/**
 * Put config for apps
 */
export function iputAppsConfig({ tid, featureAppsConfigNde5Otm3MjM1 }: {
    tid: string;
    featureAppsConfigNde5Otm3MjM1: FeatureAppsConfigNde5Otm3MjM1;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureAppsConfigMzQyNtMxNTk5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/apps`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureAppsConfigNde5Otm3MjM1
    })));
}
/**
 * (Un-)lock apps
 */
export function ilockAppsConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/apps/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for assetAuditLog
 */
export function igetAssetAuditLogConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureAssetAuditLogConfigNdq3MzcyMzk2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/assetAuditLog`, {
        ...opts
    }));
}
/**
 * Get config for backgroundEffects
 */
export function igetBackgroundEffectsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureBackgroundEffectsConfigMTg1MTk3Ntm5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/backgroundEffects`, {
        ...opts
    }));
}
/**
 * Patch config for backgroundEffects
 */
export function ipatchBackgroundEffectsConfig({ tid, lockableFeaturePatchBackgroundEffectsConfigMzI0MtYwOTky }: {
    tid: string;
    lockableFeaturePatchBackgroundEffectsConfigMzI0MtYwOTky: LockableFeaturePatchBackgroundEffectsConfigMzI0MtYwOTky;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureBackgroundEffectsConfigMTg1MTk3Ntm5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/backgroundEffects`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchBackgroundEffectsConfigMzI0MtYwOTky
    })));
}
/**
 * Put config for backgroundEffects
 */
export function iputBackgroundEffectsConfig({ tid, featureBackgroundEffectsConfigMjQyOTkxMDc4 }: {
    tid: string;
    featureBackgroundEffectsConfigMjQyOTkxMDc4: FeatureBackgroundEffectsConfigMjQyOTkxMDc4;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureBackgroundEffectsConfigMTg1MTk3Ntm5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/backgroundEffects`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureBackgroundEffectsConfigMjQyOTkxMDc4
    })));
}
/**
 * (Un-)lock backgroundEffects
 */
export function ilockBackgroundEffectsConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/backgroundEffects/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for cells
 */
export function igetCellsConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureCellsConfigBBareIdentityLTgzMda1NjI3;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/cells`, {
        ...opts
    }));
}
/**
 * Patch config for cells
 */
export function ipatchCellsConfigB({ tid, lockableFeaturePatchCellsConfigBBareIdentityMjQ0MTk4MDg5 }: {
    tid: string;
    lockableFeaturePatchCellsConfigBBareIdentityMjQ0MTk4MDg5: LockableFeaturePatchCellsConfigBBareIdentityMjQ0MTk4MDg5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureCellsConfigBBareIdentityLTgzMda1NjI3;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/cells`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchCellsConfigBBareIdentityMjQ0MTk4MDg5
    })));
}
/**
 * Put config for cells
 */
export function iputCellsConfigB({ tid, featureCellsConfigBBareIdentityNzU2NjgxNzEw }: {
    tid: string;
    featureCellsConfigBBareIdentityNzU2NjgxNzEw: FeatureCellsConfigBBareIdentityNzU2NjgxNzEw;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureCellsConfigBBareIdentityLTgzMda1NjI3;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/cells`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureCellsConfigBBareIdentityNzU2NjgxNzEw
    })));
}
/**
 * (Un-)lock cells
 */
export function ilockCellsConfigB({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/cells/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for cellsInternal
 */
export function igetCellsInternalConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturCsInfigBdyLtq3Mtu3Mjg0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/cellsInternal`, {
        ...opts
    }));
}
/**
 * Patch config for cellsInternal
 */
export function ipatchCellsInternalConfigB({ tid, lockableFturPhCsInfigBdyLTc0NjM1ODky }: {
    tid: string;
    lockableFturPhCsInfigBdyLTc0NjM1ODky: LockableFturPhCsInfigBdyLTc0NjM1ODky;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturCsInfigBdyLtq3Mtu3Mjg0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/cellsInternal`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhCsInfigBdyLTc0NjM1ODky
    })));
}
/**
 * Put config for cellsInternal
 */
export function iputCellsInternalConfigB({ tid, featureCellsInternalConfigBBareIdentityOdm1Mjg1Mtq2 }: {
    tid: string;
    featureCellsInternalConfigBBareIdentityOdm1Mjg1Mtq2: FeatureCellsInternalConfigBBareIdentityOdm1Mjg1Mtq2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturCsInfigBdyLtq3Mtu3Mjg0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/cellsInternal`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureCellsInternalConfigBBareIdentityOdm1Mjg1Mtq2
    })));
}
/**
 * Get config for channels
 */
export function igetChannelsConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureChannelsConfigBBareIdentityNzA2NdEyMdEw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/channels`, {
        ...opts
    }));
}
/**
 * Patch config for channels
 */
export function ipatchChannelsConfigB({ tid, lockableFturPhCnsfigBIdyLtMxNTg0Ntq5 }: {
    tid: string;
    lockableFturPhCnsfigBIdyLtMxNTg0Ntq5: LockableFturPhCnsfigBIdyLtMxNTg0Ntq5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureChannelsConfigBBareIdentityNzA2NdEyMdEw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/channels`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhCnsfigBIdyLtMxNTg0Ntq5
    })));
}
/**
 * Put config for channels
 */
export function iputChannelsConfigB({ tid, featureChannelsConfigBBareIdentityLtu4Nte4MTgx }: {
    tid: string;
    featureChannelsConfigBBareIdentityLtu4Nte4MTgx: FeatureChannelsConfigBBareIdentityLtu4Nte4MTgx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureChannelsConfigBBareIdentityNzA2NdEyMdEw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/channels`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureChannelsConfigBBareIdentityLtu4Nte4MTgx
    })));
}
/**
 * (Un-)lock channels
 */
export function ilockChannelsConfigB({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/channels/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for chatBubbles
 */
export function igetChatBubblesConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureChatBubblesConfigNDgwMtQzNjI2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/chatBubbles`, {
        ...opts
    }));
}
/**
 * Patch config for chatBubbles
 */
export function ipatchChatBubblesConfig({ tid, lockableFeaturePatchChatBubblesConfigNDg1NzkwNtu4 }: {
    tid: string;
    lockableFeaturePatchChatBubblesConfigNDg1NzkwNtu4: LockableFeaturePatchChatBubblesConfigNDg1NzkwNtu4;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureChatBubblesConfigNDgwMtQzNjI2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/chatBubbles`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchChatBubblesConfigNDg1NzkwNtu4
    })));
}
/**
 * Put config for chatBubbles
 */
export function iputChatBubblesConfig({ tid, featureChatBubblesConfigLty2ODk1MtIx }: {
    tid: string;
    featureChatBubblesConfigLty2ODk1MtIx: FeatureChatBubblesConfigLty2ODk1MtIx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureChatBubblesConfigNDgwMtQzNjI2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/chatBubbles`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureChatBubblesConfigLty2ODk1MtIx
    })));
}
/**
 * (Un-)lock chatBubbles
 */
export function ilockChatBubblesConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/chatBubbles/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for classifiedDomains
 */
export function igetClassifiedDomainsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureClassifiedDomainsConfigLty1OdQwODg1;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/classifiedDomains`, {
        ...opts
    }));
}
/**
 * Get config for conferenceCalling
 */
export function igetConferenceCallingConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturCnfigBIdyNzY1Ndu5MdAy;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/conferenceCalling`, {
        ...opts
    }));
}
/**
 * Patch config for conferenceCalling
 */
export function ipatchConferenceCallingConfigB({ tid, lockableFturPhCnfigBIdyNjkxOtExMTgz }: {
    tid: string;
    lockableFturPhCnfigBIdyNjkxOtExMTgz: LockableFturPhCnfigBIdyNjkxOtExMTgz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturCnfigBIdyNzY1Ndu5MdAy;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/conferenceCalling`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhCnfigBIdyNjkxOtExMTgz
    })));
}
/**
 * Put config for conferenceCalling
 */
export function iputConferenceCallingConfigB({ tid, featureConferenceCallingConfigBBareIdentityNjc2NTcxNti3 }: {
    tid: string;
    featureConferenceCallingConfigBBareIdentityNjc2NTcxNti3: FeatureConferenceCallingConfigBBareIdentityNjc2NTcxNti3;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturCnfigBIdyNzY1Ndu5MdAy;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/conferenceCalling`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureConferenceCallingConfigBBareIdentityNjc2NTcxNti3
    })));
}
/**
 * (Un-)lock conferenceCalling
 */
export function ilockConferenceCallingConfigB({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/conferenceCalling/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for consumableNotifications
 */
export function igetConsumableNotificationsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureConsumableNotificationsConfigMjUxMjczMjM0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/consumableNotifications`, {
        ...opts
    }));
}
/**
 * Patch config for consumableNotifications
 */
export function ipatchConsumableNotificationsConfig({ tid, lockableFeaturePatchConsumableNotificationsConfigLTc1MjkzOtAy }: {
    tid: string;
    lockableFeaturePatchConsumableNotificationsConfigLTc1MjkzOtAy: LockableFeaturePatchConsumableNotificationsConfigLTc1MjkzOtAy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureConsumableNotificationsConfigMjUxMjczMjM0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/consumableNotifications`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchConsumableNotificationsConfigLTc1MjkzOtAy
    })));
}
/**
 * Put config for consumableNotifications
 */
export function iputConsumableNotificationsConfig({ tid, featureConsumableNotificationsConfigLtMzMzM4Mjkz }: {
    tid: string;
    featureConsumableNotificationsConfigLtMzMzM4Mjkz: FeatureConsumableNotificationsConfigLtMzMzM4Mjkz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureConsumableNotificationsConfigMjUxMjczMjM0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/consumableNotifications`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureConsumableNotificationsConfigLtMzMzM4Mjkz
    })));
}
/**
 * (Un-)lock consumableNotifications
 */
export function ilockConsumableNotificationsConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/consumableNotifications/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for conversationGuestLinks
 */
export function igetGuestLinksConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureGuestLinksConfigLTcwNjU0NdMw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/conversationGuestLinks`, {
        ...opts
    }));
}
/**
 * Patch config for conversationGuestLinks
 */
export function ipatchGuestLinksConfig({ tid, lockableFeaturePatchGuestLinksConfigNjU5NjAwNDg3 }: {
    tid: string;
    lockableFeaturePatchGuestLinksConfigNjU5NjAwNDg3: LockableFeaturePatchGuestLinksConfigNjU5NjAwNDg3;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureGuestLinksConfigLTcwNjU0NdMw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/conversationGuestLinks`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchGuestLinksConfigNjU5NjAwNDg3
    })));
}
/**
 * Put config for conversationGuestLinks
 */
export function iputGuestLinksConfig({ tid, featureGuestLinksConfigNjQyMdMxNjg3 }: {
    tid: string;
    featureGuestLinksConfigNjQyMdMxNjg3: FeatureGuestLinksConfigNjQyMdMxNjg3;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureGuestLinksConfigLTcwNjU0NdMw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/conversationGuestLinks`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureGuestLinksConfigNjQyMdMxNjg3
    })));
}
/**
 * (Un-)lock conversationGuestLinks
 */
export function ilockGuestLinksConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/conversationGuestLinks/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for digitalSignatures
 */
export function igetDigitalSignaturesConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureDigitalSignaturesConfigOdm2Mda2Ndu4;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/digitalSignatures`, {
        ...opts
    }));
}
/**
 * Patch config for digitalSignatures
 */
export function ipatchDigitalSignaturesConfig({ tid, lockableFeaturePatchDigitalSignaturesConfigMjAyNjQ0MzI1 }: {
    tid: string;
    lockableFeaturePatchDigitalSignaturesConfigMjAyNjQ0MzI1: LockableFeaturePatchDigitalSignaturesConfigMjAyNjQ0MzI1;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureDigitalSignaturesConfigOdm2Mda2Ndu4;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/digitalSignatures`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchDigitalSignaturesConfigMjAyNjQ0MzI1
    })));
}
/**
 * Put config for digitalSignatures
 */
export function iputDigitalSignaturesConfig({ tid, featureDigitalSignaturesConfigNjUxMjg5Mta2 }: {
    tid: string;
    featureDigitalSignaturesConfigNjUxMjg5Mta2: FeatureDigitalSignaturesConfigNjUxMjg5Mta2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureDigitalSignaturesConfigOdm2Mda2Ndu4;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/digitalSignatures`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureDigitalSignaturesConfigNjUxMjg5Mta2
    })));
}
/**
 * Get config for domainRegistration
 */
export function igetDomainRegistrationConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureDomainRegistrationConfigNzU0NjczNte0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/domainRegistration`, {
        ...opts
    }));
}
/**
 * Patch config for domainRegistration
 */
export function ipatchDomainRegistrationConfig({ tid, lockableFeaturePatchDomainRegistrationConfigMjA0NjUxOtEy }: {
    tid: string;
    lockableFeaturePatchDomainRegistrationConfigMjA0NjUxOtEy: LockableFeaturePatchDomainRegistrationConfigMjA0NjUxOtEy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureDomainRegistrationConfigNzU0NjczNte0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/domainRegistration`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchDomainRegistrationConfigMjA0NjUxOtEy
    })));
}
/**
 * Put config for domainRegistration
 */
export function iputDomainRegistrationConfig({ tid, featureDomainRegistrationConfigLtUxNti3NjYy }: {
    tid: string;
    featureDomainRegistrationConfigLtUxNti3NjYy: FeatureDomainRegistrationConfigLtUxNti3NjYy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureDomainRegistrationConfigNzU0NjczNte0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/domainRegistration`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureDomainRegistrationConfigLtUxNti3NjYy
    })));
}
/**
 * (Un-)lock domainRegistration
 */
export function ilockDomainRegistrationConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/domainRegistration/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for enforceFileDownloadLocation
 */
export function igetEnforceFileDownloadLocationConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturEnfiDwdCgBIyOda5Ota5Mtq4;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/enforceFileDownloadLocation`, {
        ...opts
    }));
}
/**
 * Patch config for enforceFileDownloadLocation
 */
export function ipatchEnforceFileDownloadLocationConfigB({ tid, lockableFturPhEnfiDwdCgBIyLTcwODgxOtQw }: {
    tid: string;
    lockableFturPhEnfiDwdCgBIyLTcwODgxOtQw: LockableFturPhEnfiDwdCgBIyLTcwODgxOtQw;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturEnfiDwdCgBIyOda5Ota5Mtq4;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/enforceFileDownloadLocation`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhEnfiDwdCgBIyLTcwODgxOtQw
    })));
}
/**
 * Put config for enforceFileDownloadLocation
 */
export function iputEnforceFileDownloadLocationConfigB({ tid, featurEnfocilDwdLCgBIyMjcxMzc1Nda5 }: {
    tid: string;
    featurEnfocilDwdLCgBIyMjcxMzc1Nda5: FeaturEnfocilDwdLCgBIyMjcxMzc1Nda5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturEnfiDwdCgBIyOda5Ota5Mtq4;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/enforceFileDownloadLocation`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featurEnfocilDwdLCgBIyMjcxMzc1Nda5
    })));
}
/**
 * (Un-)lock enforceFileDownloadLocation
 */
export function ilockEnforceFileDownloadLocationConfigB({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/enforceFileDownloadLocation/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for exposeInvitationURLsToTeamAdmin
 */
export function igetExposeInvitationUrLsToTeamAdminConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturExpsInviUrTmAdCfgLtQzMzU2Oty1;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/exposeInvitationURLsToTeamAdmin`, {
        ...opts
    }));
}
/**
 * Patch config for exposeInvitationURLsToTeamAdmin
 */
export function ipatchExposeInvitationUrLsToTeamAdminConfig({ tid, lockableFturPhExpsInviUrTmAdCfgLTc4MjU5ODk2 }: {
    tid: string;
    lockableFturPhExpsInviUrTmAdCfgLTc4MjU5ODk2: LockableFturPhExpsInviUrTmAdCfgLTc4MjU5ODk2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturExpsInviUrTmAdCfgLtQzMzU2Oty1;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/exposeInvitationURLsToTeamAdmin`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhExpsInviUrTmAdCfgLTc4MjU5ODk2
    })));
}
/**
 * Put config for exposeInvitationURLsToTeamAdmin
 */
export function iputExposeInvitationUrLsToTeamAdminConfig({ tid, featureExposeInvitationUrLsToTeamAdminConfigLty5NzY2Mzg5 }: {
    tid: string;
    featureExposeInvitationUrLsToTeamAdminConfigLty5NzY2Mzg5: FeatureExposeInvitationUrLsToTeamAdminConfigLty5NzY2Mzg5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturExpsInviUrTmAdCfgLtQzMzU2Oty1;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/exposeInvitationURLsToTeamAdmin`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureExposeInvitationUrLsToTeamAdminConfigLty5NzY2Mzg5
    })));
}
/**
 * Get config for fileSharing
 */
export function igetFileSharingConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureFileSharingConfigMjgwNjIzOdEz;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/fileSharing`, {
        ...opts
    }));
}
/**
 * Patch config for fileSharing
 */
export function ipatchFileSharingConfig({ tid, lockableFeaturePatchFileSharingConfigMjMyNda3MdIz }: {
    tid: string;
    lockableFeaturePatchFileSharingConfigMjMyNda3MdIz: LockableFeaturePatchFileSharingConfigMjMyNda3MdIz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureFileSharingConfigMjgwNjIzOdEz;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/fileSharing`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchFileSharingConfigMjMyNda3MdIz
    })));
}
/**
 * Put config for fileSharing
 */
export function iputFileSharingConfig({ tid, featureFileSharingConfigLtUyNjkxMzM4 }: {
    tid: string;
    featureFileSharingConfigLtUyNjkxMzM4: FeatureFileSharingConfigLtUyNjkxMzM4;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureFileSharingConfigMjgwNjIzOdEz;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/fileSharing`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureFileSharingConfigLtUyNjkxMzM4
    })));
}
/**
 * (Un-)lock fileSharing
 */
export function ilockFileSharingConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/fileSharing/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for legalhold
 */
export function igetLegalholdConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureLegalholdConfigLTc5MTk5OtIw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/legalhold`, {
        ...opts
    }));
}
/**
 * Patch config for legalhold
 */
export function ipatchLegalholdConfig({ tid, lockableFeaturePatchLegalholdConfigLtm4ODc4NDcx }: {
    tid: string;
    lockableFeaturePatchLegalholdConfigLtm4ODc4NDcx: LockableFeaturePatchLegalholdConfigLtm4ODc4NDcx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureLegalholdConfigLTc5MTk5OtIw;
    } | {
        status: 400;
        data: {
            code: 400;
            label: "legalhold-not-registered";
            message: string;
        };
    } | {
        status: 403;
        data: {
            code: 403;
            label: "legalhold-disable-unimplemented" | "legalhold-not-enabled" | "too-large-team-for-legalhold" | "action-denied" | "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    } | {
        status: 500;
        data: {
            code: 500;
            label: "legalhold-internal" | "legalhold-illegal-op";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/legalhold`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchLegalholdConfigLtm4ODc4NDcx
    })));
}
/**
 * Put config for legalhold
 */
export function iputLegalholdConfig({ tid, featureLegalholdConfigNjM3MTkxNjYw }: {
    tid: string;
    featureLegalholdConfigNjM3MTkxNjYw: FeatureLegalholdConfigNjM3MTkxNjYw;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureLegalholdConfigLTc5MTk5OtIw;
    } | {
        status: 400;
        data: {
            code: 400;
            label: "legalhold-not-registered";
            message: string;
        };
    } | {
        status: 403;
        data: {
            code: 403;
            label: "legalhold-disable-unimplemented" | "legalhold-not-enabled" | "too-large-team-for-legalhold" | "action-denied" | "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    } | {
        status: 500;
        data: {
            code: 500;
            label: "legalhold-internal" | "legalhold-illegal-op";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/legalhold`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureLegalholdConfigNjM3MTkxNjYw
    })));
}
/**
 * Get config for limitedEventFanout
 */
export function igetLimitedEventFanoutConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureLimitedEventFanoutConfigMTg3Odm0NzU0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/limitedEventFanout`, {
        ...opts
    }));
}
/**
 * Patch config for limitedEventFanout
 */
export function ipatchLimitedEventFanoutConfig({ tid, lockableFeaturePatchLimitedEventFanoutConfigLtIwNzE3Mtm5 }: {
    tid: string;
    lockableFeaturePatchLimitedEventFanoutConfigLtIwNzE3Mtm5: LockableFeaturePatchLimitedEventFanoutConfigLtIwNzE3Mtm5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureLimitedEventFanoutConfigMTg3Odm0NzU0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/limitedEventFanout`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchLimitedEventFanoutConfigLtIwNzE3Mtm5
    })));
}
/**
 * Put config for limitedEventFanout
 */
export function iputLimitedEventFanoutConfig({ tid, featureLimitedEventFanoutConfigLte2MzA5Mtu1 }: {
    tid: string;
    featureLimitedEventFanoutConfigLte2MzA5Mtu1: FeatureLimitedEventFanoutConfigLte2MzA5Mtu1;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureLimitedEventFanoutConfigMTg3Odm0NzU0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/limitedEventFanout`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureLimitedEventFanoutConfigLte2MzA5Mtu1
    })));
}
/**
 * Get config for meetings
 */
export function igetMeetingsConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMeetingsConfigLte0Otq5Nzcw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/meetings`, {
        ...opts
    }));
}
/**
 * Patch config for meetings
 */
export function ipatchMeetingsConfig({ tid, lockableFeaturePatchMeetingsConfigLtQzMjc2Nty5 }: {
    tid: string;
    lockableFeaturePatchMeetingsConfigLtQzMjc2Nty5: LockableFeaturePatchMeetingsConfigLtQzMjc2Nty5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMeetingsConfigLte0Otq5Nzcw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/meetings`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchMeetingsConfigLtQzMjc2Nty5
    })));
}
/**
 * Put config for meetings
 */
export function iputMeetingsConfig({ tid, featureMeetingsConfigNDc2MzM0Mde1 }: {
    tid: string;
    featureMeetingsConfigNDc2MzM0Mde1: FeatureMeetingsConfigNDc2MzM0Mde1;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMeetingsConfigLte0Otq5Nzcw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/meetings`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureMeetingsConfigNDc2MzM0Mde1
    })));
}
/**
 * (Un-)lock meetings
 */
export function ilockMeetingsConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/meetings/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for meetingsPremium
 */
export function igetMeetingsPremiumConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMeetingsPremiumConfigNDg1OdEyNta1;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/meetingsPremium`, {
        ...opts
    }));
}
/**
 * Patch config for meetingsPremium
 */
export function ipatchMeetingsPremiumConfig({ tid, lockableFeaturePatchMeetingsPremiumConfigMzE0MjE4Nzcx }: {
    tid: string;
    lockableFeaturePatchMeetingsPremiumConfigMzE0MjE4Nzcx: LockableFeaturePatchMeetingsPremiumConfigMzE0MjE4Nzcx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMeetingsPremiumConfigNDg1OdEyNta1;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/meetingsPremium`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchMeetingsPremiumConfigMzE0MjE4Nzcx
    })));
}
/**
 * Put config for meetingsPremium
 */
export function iputMeetingsPremiumConfig({ tid, featureMeetingsPremiumConfigNzE4NjUzMde0 }: {
    tid: string;
    featureMeetingsPremiumConfigNzE4NjUzMde0: FeatureMeetingsPremiumConfigNzE4NjUzMde0;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMeetingsPremiumConfigNDg1OdEyNta1;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/meetingsPremium`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureMeetingsPremiumConfigNzE4NjUzMde0
    })));
}
/**
 * (Un-)lock meetingsPremium
 */
export function ilockMeetingsPremiumConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/meetingsPremium/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for mls
 */
export function igetMlsConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMlsConfigBBareIdentityMTg1MTc0NtEw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mls`, {
        ...opts
    }));
}
/**
 * Patch config for mls
 */
export function ipatchMlsConfigB({ tid, lockableFeaturePatchMlsConfigBBareIdentityLtq4NjgwNdQx }: {
    tid: string;
    lockableFeaturePatchMlsConfigBBareIdentityLtq4NjgwNdQx: LockableFeaturePatchMlsConfigBBareIdentityLtq4NjgwNdQx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMlsConfigBBareIdentityMTg1MTc0NtEw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mls`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchMlsConfigBBareIdentityLtq4NjgwNdQx
    })));
}
/**
 * Put config for mls
 */
export function iputMlsConfigB({ tid, featureMlsConfigBBareIdentityLti5MjA3MdYy }: {
    tid: string;
    featureMlsConfigBBareIdentityLti5MjA3MdYy: FeatureMlsConfigBBareIdentityLti5MjA3MdYy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMlsConfigBBareIdentityMTg1MTc0NtEw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mls`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureMlsConfigBBareIdentityLti5MjA3MdYy
    })));
}
/**
 * (Un-)lock mls
 */
export function ilockMlsConfigB({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mls/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for mlsE2EId
 */
export function igetMlsE2EIdConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMlsE2EIdConfigBBareIdentityMtu2ODkyMDc4;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mlsE2EId`, {
        ...opts
    }));
}
/**
 * Patch config for mlsE2EId
 */
export function ipatchMlsE2EIdConfigB({ tid, lockableFturPhMsE2IdCnfigByLtm3NTk5MjAz }: {
    tid: string;
    lockableFturPhMsE2IdCnfigByLtm3NTk5MjAz: LockableFturPhMsE2IdCnfigByLtm3NTk5MjAz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMlsE2EIdConfigBBareIdentityMtu2ODkyMDc4;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mlsE2EId`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhMsE2IdCnfigByLtm3NTk5MjAz
    })));
}
/**
 * Put config for mlsE2EId
 */
export function iputMlsE2EIdConfigB({ tid, featureMlsE2EIdConfigBBareIdentityLtUxOdYzOdEx }: {
    tid: string;
    featureMlsE2EIdConfigBBareIdentityLtUxOdYzOdEx: FeatureMlsE2EIdConfigBBareIdentityLtUxOdYzOdEx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureMlsE2EIdConfigBBareIdentityMtu2ODkyMDc4;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mlsE2EId`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureMlsE2EIdConfigBBareIdentityLtUxOdYzOdEx
    })));
}
/**
 * (Un-)lock mlsE2EId
 */
export function ilockMlsE2EIdConfigB({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mlsE2EId/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for mlsMigration
 */
export function igetMlsMigrationConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturMsignCfBIdyLte1NjAxNjU2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mlsMigration`, {
        ...opts
    }));
}
/**
 * Patch config for mlsMigration
 */
export function ipatchMlsMigrationConfigB({ tid, lockableFturPhMsignCfBIdyNdQxNjA2NtAx }: {
    tid: string;
    lockableFturPhMsignCfBIdyNdQxNjA2NtAx: LockableFturPhMsignCfBIdyNdQxNjA2NtAx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturMsignCfBIdyLte1NjAxNjU2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mlsMigration`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhMsignCfBIdyNdQxNjA2NtAx
    })));
}
/**
 * Put config for mlsMigration
 */
export function iputMlsMigrationConfigB({ tid, featureMlsMigrationConfigBBareIdentityLtQyMdAxMTkz }: {
    tid: string;
    featureMlsMigrationConfigBBareIdentityLtQyMdAxMTkz: FeatureMlsMigrationConfigBBareIdentityLtQyMdAxMTkz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturMsignCfBIdyLte1NjAxNjU2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mlsMigration`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureMlsMigrationConfigBBareIdentityLtQyMdAxMTkz
    })));
}
/**
 * (Un-)lock mlsMigration
 */
export function ilockMlsMigrationConfigB({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/mlsMigration/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for outlookCalIntegration
 */
export function igetOutlookCalIntegrationConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureOutlookCalIntegrationConfigNjQ0MzMyMzY0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/outlookCalIntegration`, {
        ...opts
    }));
}
/**
 * Patch config for outlookCalIntegration
 */
export function ipatchOutlookCalIntegrationConfig({ tid, lockableFeaturePatchOutlookCalIntegrationConfigMtm5Mte4ODkz }: {
    tid: string;
    lockableFeaturePatchOutlookCalIntegrationConfigMtm5Mte4ODkz: LockableFeaturePatchOutlookCalIntegrationConfigMtm5Mte4ODkz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureOutlookCalIntegrationConfigNjQ0MzMyMzY0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/outlookCalIntegration`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchOutlookCalIntegrationConfigMtm5Mte4ODkz
    })));
}
/**
 * Put config for outlookCalIntegration
 */
export function iputOutlookCalIntegrationConfig({ tid, featureOutlookCalIntegrationConfigLTg0MjIxNtMx }: {
    tid: string;
    featureOutlookCalIntegrationConfigLTg0MjIxNtMx: FeatureOutlookCalIntegrationConfigLTg0MjIxNtMx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureOutlookCalIntegrationConfigNjQ0MzMyMzY0;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/outlookCalIntegration`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureOutlookCalIntegrationConfigLTg0MjIxNtMx
    })));
}
/**
 * (Un-)lock outlookCalIntegration
 */
export function ilockOutlookCalIntegrationConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/outlookCalIntegration/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for preventAdminlessGroups
 */
export function igetPreventAdminlessGroupsConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturPvnAdmisGpCfgBIyMtQxOtu4Mzgw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/preventAdminlessGroups`, {
        ...opts
    }));
}
/**
 * Patch config for preventAdminlessGroups
 */
export function ipatchPreventAdminlessGroupsConfigB({ tid, lockableFturPhVnAdmisGpCfgBIyLTc3MDg2MjUy }: {
    tid: string;
    lockableFturPhVnAdmisGpCfgBIyLTc3MDg2MjUy: LockableFturPhVnAdmisGpCfgBIyLTc3MDg2MjUy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturPvnAdmisGpCfgBIyMtQxOtu4Mzgw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/preventAdminlessGroups`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhVnAdmisGpCfgBIyLTc3MDg2MjUy
    })));
}
/**
 * Put config for preventAdminlessGroups
 */
export function iputPreventAdminlessGroupsConfigB({ tid, featurPvnAdmilsGopCfgBIyLte2NzM3ODkx }: {
    tid: string;
    featurPvnAdmilsGopCfgBIyLte2NzM3ODkx: FeaturPvnAdmilsGopCfgBIyLte2NzM3ODkx;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturPvnAdmisGpCfgBIyMtQxOtu4Mzgw;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/preventAdminlessGroups`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featurPvnAdmilsGopCfgBIyLte2NzM3ODkx
    })));
}
/**
 * (Un-)lock preventAdminlessGroups
 */
export function ilockPreventAdminlessGroupsConfigB({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/preventAdminlessGroups/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for searchVisibility
 */
export function igetSearchVisibilityAvailableConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSearchVisibilityAvailableConfigLTkxMta5ODk5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/searchVisibility`, {
        ...opts
    }));
}
/**
 * Patch config for searchVisibility
 */
export function ipatchSearchVisibilityAvailableConfig({ tid, lockableFturPhSVisyAvCnfgLtExNzU3MdIw }: {
    tid: string;
    lockableFturPhSVisyAvCnfgLtExNzU3MdIw: LockableFturPhSVisyAvCnfgLtExNzU3MdIw;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSearchVisibilityAvailableConfigLTkxMta5ODk5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/searchVisibility`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhSVisyAvCnfgLtExNzU3MdIw
    })));
}
/**
 * Put config for searchVisibility
 */
export function iputSearchVisibilityAvailableConfig({ tid, featureSearchVisibilityAvailableConfigLtMzNTkxOdi1 }: {
    tid: string;
    featureSearchVisibilityAvailableConfigLtMzNTkxOdi1: FeatureSearchVisibilityAvailableConfigLtMzNTkxOdi1;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSearchVisibilityAvailableConfigLTkxMta5ODk5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/searchVisibility`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureSearchVisibilityAvailableConfigLtMzNTkxOdi1
    })));
}
/**
 * Get config for searchVisibilityInbound
 */
export function igetSearchVisibilityInboundConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSearchVisibilityInboundConfigNzA5NzczNTgy;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/searchVisibilityInbound`, {
        ...opts
    }));
}
/**
 * Patch config for searchVisibilityInbound
 */
export function ipatchSearchVisibilityInboundConfig({ tid, lockableFeaturePatchSearchVisibilityInboundConfigNzE1MdAzNzQy }: {
    tid: string;
    lockableFeaturePatchSearchVisibilityInboundConfigNzE1MdAzNzQy: LockableFeaturePatchSearchVisibilityInboundConfigNzE1MdAzNzQy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSearchVisibilityInboundConfigNzA5NzczNTgy;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/searchVisibilityInbound`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchSearchVisibilityInboundConfigNzE1MdAzNzQy
    })));
}
/**
 * Put config for searchVisibilityInbound
 */
export function iputSearchVisibilityInboundConfig({ tid, featureSearchVisibilityInboundConfigMti1NzQxOdy2 }: {
    tid: string;
    featureSearchVisibilityInboundConfigMti1NzQxOdy2: FeatureSearchVisibilityInboundConfigMti1NzQxOdy2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSearchVisibilityInboundConfigNzA5NzczNTgy;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/searchVisibilityInbound`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureSearchVisibilityInboundConfigMti1NzQxOdy2
    })));
}
/**
 * Get config for selfDeletingMessages
 */
export function igetSelfDeletingMessagesConfigB({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturSfDingMsCbIdyLTg5MtEwNta2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/selfDeletingMessages`, {
        ...opts
    }));
}
/**
 * Patch config for selfDeletingMessages
 */
export function ipatchSelfDeletingMessagesConfigB({ tid, lockableFturPhSfDingMsCbIdyMzQ5MtIzMzc5 }: {
    tid: string;
    lockableFturPhSfDingMsCbIdyMzQ5MtIzMzc5: LockableFturPhSfDingMsCbIdyMzQ5MtIzMzc5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturSfDingMsCbIdyLTg5MtEwNta2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/selfDeletingMessages`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhSfDingMsCbIdyMzQ5MtIzMzc5
    })));
}
/**
 * Put config for selfDeletingMessages
 */
export function iputSelfDeletingMessagesConfigB({ tid, featurSlfDingMsCoBIdyLTg2MzYzNjc2 }: {
    tid: string;
    featurSlfDingMsCoBIdyLTg2MzYzNjc2: FeaturSlfDingMsCoBIdyLTg2MzYzNjc2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturSfDingMsCbIdyLTg5MtEwNta2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/selfDeletingMessages`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featurSlfDingMsCoBIdyLTg2MzYzNjc2
    })));
}
/**
 * (Un-)lock selfDeletingMessages
 */
export function ilockSelfDeletingMessagesConfigB({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/selfDeletingMessages/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for simplifiedUserConnectionRequestQRCode
 */
export function igetSimplifiedUserConnectionRequestQrCodeConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturSimpfdUsCnRqQgNjk5NjU4OTgy;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/simplifiedUserConnectionRequestQRCode`, {
        ...opts
    }));
}
/**
 * Patch config for simplifiedUserConnectionRequestQRCode
 */
export function ipatchSimplifiedUserConnectionRequestQrCodeConfig({ tid, lockableFturPhSimpfdUsCnRqQgLtEzNty0NjI1 }: {
    tid: string;
    lockableFturPhSimpfdUsCnRqQgLtEzNty0NjI1: LockableFturPhSimpfdUsCnRqQgLtEzNty0NjI1;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturSimpfdUsCnRqQgNjk5NjU4OTgy;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/simplifiedUserConnectionRequestQRCode`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhSimpfdUsCnRqQgLtEzNty0NjI1
    })));
}
/**
 * Put config for simplifiedUserConnectionRequestQRCode
 */
export function iputSimplifiedUserConnectionRequestQrCodeConfig({ tid, featurSimplfdUsConcRqQgNzA5NdExNDc0 }: {
    tid: string;
    featurSimplfdUsConcRqQgNzA5NdExNDc0: FeaturSimplfdUsConcRqQgNzA5NdExNDc0;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturSimpfdUsCnRqQgNjk5NjU4OTgy;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/simplifiedUserConnectionRequestQRCode`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featurSimplfdUsConcRqQgNzA5NdExNDc0
    })));
}
/**
 * (Un-)lock simplifiedUserConnectionRequestQRCode
 */
export function ilockSimplifiedUserConnectionRequestQrCodeConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/simplifiedUserConnectionRequestQRCode/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for sndFactorPasswordChallenge
 */
export function igetSndFactorPasswordChallengeConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSndFactorPasswordChallengeConfigMjQ3NzQ2ODgx;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/sndFactorPasswordChallenge`, {
        ...opts
    }));
}
/**
 * Patch config for sndFactorPasswordChallenge
 */
export function ipatchSndFactorPasswordChallengeConfig({ tid, lockableFturPhSndswCgfiLti4NtQwMjc2 }: {
    tid: string;
    lockableFturPhSndswCgfiLti4NtQwMjc2: LockableFturPhSndswCgfiLti4NtQwMjc2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSndFactorPasswordChallengeConfigMjQ3NzQ2ODgx;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/sndFactorPasswordChallenge`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhSndswCgfiLti4NtQwMjc2
    })));
}
/**
 * Put config for sndFactorPasswordChallenge
 */
export function iputSndFactorPasswordChallengeConfig({ tid, featureSndFactorPasswordChallengeConfigNDc0MzUyMzQz }: {
    tid: string;
    featureSndFactorPasswordChallengeConfigNDc0MzUyMzQz: FeatureSndFactorPasswordChallengeConfigNDc0MzUyMzQz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSndFactorPasswordChallengeConfigMjQ3NzQ2ODgx;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/sndFactorPasswordChallenge`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureSndFactorPasswordChallengeConfigNDc0MzUyMzQz
    })));
}
/**
 * (Un-)lock sndFactorPasswordChallenge
 */
export function ilockSndFactorPasswordChallengeConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/sndFactorPasswordChallenge/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for sso
 */
export function igetSsoConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSsoConfigNjcyMjU4Mdy2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/sso`, {
        ...opts
    }));
}
/**
 * Patch config for sso
 */
export function ipatchSsoConfig({ tid, lockableFeaturePatchSsoConfigMzkxNzA3MdMz }: {
    tid: string;
    lockableFeaturePatchSsoConfigMzkxNzA3MdMz: LockableFeaturePatchSsoConfigMzkxNzA3MdMz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSsoConfigNjcyMjU4Mdy2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/sso`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchSsoConfigMzkxNzA3MdMz
    })));
}
/**
 * Put config for sso
 */
export function iputSsoConfig({ tid, featureSsoConfigNzYyMjQ3OtAy }: {
    tid: string;
    featureSsoConfigNzYyMjQ3OtAy: FeatureSsoConfigNzYyMjQ3OtAy;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureSsoConfigNjcyMjU4Mdy2;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/sso`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureSsoConfigNzYyMjQ3OtAy
    })));
}
/**
 * Get config for stealthUsers
 */
export function igetStealthUsersConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureStealthUsersConfigLte1MTk2NzIz;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/stealthUsers`, {
        ...opts
    }));
}
/**
 * Patch config for stealthUsers
 */
export function ipatchStealthUsersConfig({ tid, lockableFeaturePatchStealthUsersConfigLtIzNTk0MzM5 }: {
    tid: string;
    lockableFeaturePatchStealthUsersConfigLtIzNTk0MzM5: LockableFeaturePatchStealthUsersConfigLtIzNTk0MzM5;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureStealthUsersConfigLte1MTk2NzIz;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/stealthUsers`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFeaturePatchStealthUsersConfigLtIzNTk0MzM5
    })));
}
/**
 * Put config for stealthUsers
 */
export function iputStealthUsersConfig({ tid, featureStealthUsersConfigLty5Mty3Mte0 }: {
    tid: string;
    featureStealthUsersConfigLty5Mty3Mte0: FeatureStealthUsersConfigLty5Mty3Mte0;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFeatureStealthUsersConfigLte1MTk2NzIz;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/stealthUsers`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureStealthUsersConfigLty5Mty3Mte0
    })));
}
/**
 * (Un-)lock stealthUsers
 */
export function ilockStealthUsersConfig({ tid, lockStatus }: {
    tid: string;
    lockStatus: "locked" | "unlocked";
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockStatusResponseLtUzNzQzOTc5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/stealthUsers/${encodeURIComponent(lockStatus)}`, {
        ...opts,
        method: "PUT"
    }));
}
/**
 * Get config for validateSAMLemails
 */
export function igetRequireExternalEmailVerificationConfig({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturRqiExnmVfCgNjUyMzgzNzY5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/validateSAMLemails`, {
        ...opts
    }));
}
/**
 * Patch config for validateSAMLemails
 */
export function ipatchRequireExternalEmailVerificationConfig({ tid, lockableFturPhRqiExnmVfCgLtq5Ndi4Ota4 }: {
    tid: string;
    lockableFturPhRqiExnmVfCgLtq5Ndi4Ota4: LockableFturPhRqiExnmVfCgLtq5Ndi4Ota4;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturRqiExnmVfCgNjUyMzgzNzY5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/validateSAMLemails`, oazapfts.json({
        ...opts,
        method: "PATCH",
        body: lockableFturPhRqiExnmVfCgLtq5Ndi4Ota4
    })));
}
/**
 * Put config for validateSAMLemails
 */
export function iputRequireExternalEmailVerificationConfig({ tid, featureRequireExternalEmailVerificationConfigLte3MjU1Odi2 }: {
    tid: string;
    featureRequireExternalEmailVerificationConfigLte3MjU1Odi2: FeatureRequireExternalEmailVerificationConfigLte3MjU1Odi2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: LockableFturRqiExnmVfCgNjUyMzgzNzY5;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/features/validateSAMLemails`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: featureRequireExternalEmailVerificationConfigLte3MjU1Odi2
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "finalize-delete-team"]
 *
 *
 */
export function finalizeDeleteTeam({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText(`/i/teams/${encodeURIComponent(tid)}/finalize-delete`, {
        ...opts,
        method: "POST"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "user-is-team-owner"]
 *
 *
 */
export function userIsTeamOwner({ tid, uid }: {
    tid: string;
    uid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "access-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team-member";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/is-team-owner/${encodeURIComponent(uid)}`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "unchecked-get-team-members"]
 *
 *
 */
export function uncheckedGetTeamMembers({ tid, maxResults }: {
    tid: string;
    maxResults?: number;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamMemberListRequiredNzI1MjgxNdq5;
    }>(`/i/teams/${encodeURIComponent(tid)}/members${QS.query(QS.explode({
        maxResults
    }))}`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "unchecked-add-team-member"]
 *
 *
 */
export function uncheckedAddTeamMember({ tid, newTeamMemberRequiredLTg2NjU5Oti2 }: {
    tid: string;
    newTeamMemberRequiredLTg2NjU5Oti2: NewTeamMemberRequiredLTg2NjU5Oti2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "too-many-team-admins" | "too-many-members-for-legalhold" | "too-many-team-members";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/members`, oazapfts.json({
        ...opts,
        method: "POST",
        body: newTeamMemberRequiredLTg2NjU5Oti2
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "unchecked-update-team-member"]
 *
 *
 */
export function uncheckedUpdateTeamMember({ tid, newTeamMemberRequiredLTg2NjU5Oti2 }: {
    tid: string;
    newTeamMemberRequiredLTg2NjU5Oti2: NewTeamMemberRequiredLTg2NjU5Oti2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "operation-denied" | "no-team-member" | "too-many-team-admins" | "invalid-permissions" | "access-denied";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team-member" | "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/members`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: newTeamMemberRequiredLTg2NjU5Oti2
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "unchecked-get-team-admins"]
 *
 *
 */
export function uncheckedGetTeamAdmins({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamMemberListRequiredNzI1MjgxNdq5;
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/members/admins`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "unchecked-select-team-member-infos"]
 *
 *
 */
export function uncheckedSelectTeamMemberInfos({ tid, userIdsNtm1MzkyNtq2 }: {
    tid: string;
    userIdsNtm1MzkyNtq2: UserIdsNtm1MzkyNtq2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamMemberInfoListMzUyOtEzMjE2;
    }>(`/i/teams/${encodeURIComponent(tid)}/members/by-ids`, oazapfts.json({
        ...opts,
        body: userIdsNtm1MzkyNtq2
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "can-user-join-team"]
 *
 *
 */
export function canUserJoinTeam({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "too-many-members-for-legalhold";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/members/check`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "unchecked-select-team-members"]
 *
 *
 */
export function uncheckedSelectTeamMembers({ tid, userIdsNtm1MzkyNtq2 }: {
    tid: string;
    userIdsNtm1MzkyNtq2: UserIdsNtm1MzkyNtq2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamMemberRequiredLtm2NjE1Mde3[];
    }>(`/i/teams/${encodeURIComponent(tid)}/members/get-by-ids`, oazapfts.json({
        ...opts,
        method: "POST",
        body: userIdsNtm1MzkyNtq2
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "unchecked-get-team-member"]
 *
 *
 */
export function uncheckedGetTeamMember({ tid, uid }: {
    tid: string;
    uid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamMemberRequiredLtm2NjE1Mde3;
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team-member";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/members/${encodeURIComponent(uid)}`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-team-name"]
 *
 *
 */
export function getTeamName({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamNameLtYwMti2MzI4;
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/name`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-search-visibility-internal"]
 *
 *
 */
export function getSearchVisibilityInternal({ tid }: {
    tid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamSearchVisibilityViewMzg3MzMzMTk3;
    }>(`/i/teams/${encodeURIComponent(tid)}/search-visibility`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "set-search-visibility-internal"]
 *
 *
 */
export function setSearchVisibilityInternal({ tid, teamSearchVisibilityViewMzg3MzMzMTk3 }: {
    tid: string;
    teamSearchVisibilityViewMzg3MzMzMTk3: TeamSearchVisibilityViewMzg3MzMzMTk3;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 204;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "no-team-member" | "operation-denied" | "team-search-visibility-not-enabled";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/search-visibility`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: teamSearchVisibilityViewMzg3MzMzMTk3
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "update-team-status"]
 *
 *
 */
export function updateTeamStatus({ tid, teamStatusUpdateLtEzNTc0NtMz }: {
    tid: string;
    teamStatusUpdateLtEzNTc0NtMz: TeamStatusUpdateLtEzNTc0NtMz;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
    } | {
        status: 403;
        data: {
            code: 403;
            label: "invalid-team-status-update";
            message: string;
        };
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team";
            message: string;
        };
    }>(`/i/teams/${encodeURIComponent(tid)}/status`, oazapfts.json({
        ...opts,
        method: "PUT",
        body: teamStatusUpdateLtEzNTc0NtMz
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "test-get-clients"]
 *
 *
 */
export function testGetClients(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: string[];
    }>("/i/test/clients", {
        ...opts
    }));
}
/**
 * Remove a user from their teams and conversations and erase their clients
 */
export function deleteUser(opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchText("/i/user", {
        ...opts,
        method: "DELETE"
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-conversations-by-user"]
 *
 *
 */
export function getConversationsByUser({ user }: {
    user: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: EjpdConvInfoNDgwMdIyMdAw[];
    } | {
        status: 403;
        data: {
            code: 403;
            label: "not-connected";
            message: string;
        };
    }>(`/i/user/${encodeURIComponent(user)}/all-conversations`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-users-lh-status"]
 *
 *
 */
export function getUsersLhStatus({ userIdsNtm1MzkyNtq2 }: {
    userIdsNtm1MzkyNtq2: UserIdsNtm1MzkyNtq2;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserLegalHoldStatusEntryNta0MjMyMdIy[];
    }>("/i/users/lh-status", oazapfts.json({
        ...opts,
        method: "POST",
        body: userIdsNtm1MzkyNtq2
    })));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-user-lh-status"]
 *
 *
 */
export function getUserLhStatus({ uid, teamId }: {
    uid: string;
    teamId?: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: UserLegalHoldStatusLtq2Oda2Ntu5;
    }>(`/i/users/${encodeURIComponent(uid)}/lh-status${QS.query(QS.explode({
        team_id: teamId
    }))}`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-team-id"]
 *
 *
 */
export function getTeamId({ uid }: {
    uid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: Uuid;
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team" | "non-binding-team";
            message: string;
        };
    }>(`/i/users/${encodeURIComponent(uid)}/team`, {
        ...opts
    }));
}
/**
 *  [<a href="https://docs.wire.com/developer/developer/servant.html#named-and-internal-route-ids">internal route ID:</a> "get-team-members"]
 *
 *
 */
export function getTeamMembers({ uid }: {
    uid: string;
}, opts?: Oazapfts.RequestOpts) {
    return oazapfts.ok(oazapfts.fetchJson<{
        status: 200;
        data: TeamMemberListRequiredNzI1MjgxNdq5;
    } | {
        status: 404;
        data: {
            code: 404;
            label: "no-team" | "non-binding-team";
            message: string;
        };
    }>(`/i/users/${encodeURIComponent(uid)}/team/members`, {
        ...opts
    }));
}
