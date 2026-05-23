// Translates Lemmy v4 (1.0.0) API shapes back into the v3-shaped types that
// the rest of the app (BaseClient + components) was modelled against.
// All v4 inputs are typed as `any` to avoid pulling the v4 type universe into
// the adapter; outputs are typed as the v3 shapes from `../types`.

import * as v3 from '../types'

export function unwrap<T>(rs: any): T {
  if (!rs) return rs
  if (rs.state === 'success') return rs.data as T
  if (rs.state === 'failed') throw rs.err
  // empty/loading shouldn't happen for awaited results, but bail loudly if so
  throw new Error(`unexpected lemmy RequestState: ${rs.state}`)
}

const SEC = {
  hour: 3600,
  sixHour: 6 * 3600,
  twelveHour: 12 * 3600,
  day: 86400,
  week: 7 * 86400,
  month: 30 * 86400,
  threeMonths: 90 * 86400,
  sixMonths: 180 * 86400,
  nineMonths: 270 * 86400,
  year: 365 * 86400,
}

export function toV4PostSort(
  sort?: v3.SortType,
): { sort?: string; time_range_seconds?: number } {
  if (!sort) return {}
  switch (sort) {
    case 'Active':
      return { sort: 'active' }
    case 'Hot':
      return { sort: 'hot' }
    case 'New':
      return { sort: 'new' }
    case 'Old':
      return { sort: 'old' }
    case 'MostComments':
      return { sort: 'most_comments' }
    case 'NewComments':
      return { sort: 'new_comments' }
    case 'Controversial':
      return { sort: 'controversial' }
    case 'Scaled':
      return { sort: 'scaled' }
    case 'TopHour':
      return { sort: 'top', time_range_seconds: SEC.hour }
    case 'TopSixHour':
      return { sort: 'top', time_range_seconds: SEC.sixHour }
    case 'TopTwelveHour':
      return { sort: 'top', time_range_seconds: SEC.twelveHour }
    case 'TopDay':
      return { sort: 'top', time_range_seconds: SEC.day }
    case 'TopWeek':
      return { sort: 'top', time_range_seconds: SEC.week }
    case 'TopMonth':
      return { sort: 'top', time_range_seconds: SEC.month }
    case 'TopThreeMonths':
      return { sort: 'top', time_range_seconds: SEC.threeMonths }
    case 'TopSixMonths':
      return { sort: 'top', time_range_seconds: SEC.sixMonths }
    case 'TopNineMonths':
      return { sort: 'top', time_range_seconds: SEC.nineMonths }
    case 'TopYear':
      return { sort: 'top', time_range_seconds: SEC.year }
    case 'TopAll':
      return { sort: 'top' }
    default:
      return {}
  }
}

export function toV4CommentSort(sort?: v3.CommentSortType): string | undefined {
  if (!sort) return undefined
  return sort.toLowerCase()
}

export function toV4CommunitySort(sort?: v3.SortType): string | undefined {
  if (!sort) return undefined
  switch (sort) {
    case 'Hot':
      return 'hot'
    case 'New':
      return 'new'
    case 'Old':
      return 'old'
    case 'MostComments':
      return 'comments'
    case 'TopAll':
    case 'TopYear':
    case 'TopMonth':
    case 'TopWeek':
    case 'TopDay':
      return 'subscribers'
    default:
      return 'active_daily'
  }
}

export function toV4ListingType(
  type_?: v3.ListingType | 'Popular',
): string | undefined {
  if (!type_) return undefined
  if (type_ === 'Popular') return 'all'
  switch (type_) {
    case 'All':
      return 'all'
    case 'Local':
      return 'local'
    case 'Subscribed':
      return 'subscribed'
    case 'ModeratorView':
      return 'moderator_view'
    default:
      return undefined
  }
}

export function toV4Vote(score: number): boolean | undefined {
  if (score > 0) return true
  if (score < 0) return false
  return undefined
}

// ---------- v4 -> v3 entity mapping ----------

function dateOrEmpty(s?: string): string {
  return s ?? new Date(0).toISOString()
}

// Lemmy v4 exposes tag colors as an opaque "colorNN" enum and leaves the
// palette to the client. We map each slot to one of Photon's existing named
// badge color schemes so the tags render in the same style as built-in badges
// like "Featured" rather than as heavy solid blocks.
const TAG_BADGE_COLOR: Record<string, string> = {
  color01: 'red-subtle',
  color02: 'orange-subtle',
  color03: 'yellow-subtle',
  color04: 'green-subtle',
  color05: 'cyan-subtle',
  color06: 'blue-subtle',
  color07: 'indigo-subtle',
  color08: 'purple-subtle',
  color09: 'pink-subtle',
  color10: 'gray-subtle',
}

export function toV3CommunityFlair(tag: any): v3.CommunityFlair {
  const badge = TAG_BADGE_COLOR[tag.color] ?? 'gray-subtle'
  return {
    id: tag.id,
    community_id: tag.community_id,
    flair_title: tag.display_name ?? tag.name,
    text_color: '',
    background_color: '',
    blur_images: false,
    ap_id: tag.ap_id ?? null,
    badge_color: badge,
  }
}

export function toV3Person(p: any): v3.Person {
  return {
    id: p.id,
    name: p.name,
    display_name: p.display_name,
    avatar: p.avatar,
    banned: p.banned ?? false,
    published: dateOrEmpty(p.published_at),
    updated: p.updated_at,
    actor_id: p.ap_id,
    bio: p.bio,
    local: p.local,
    banner: p.banner,
    deleted: p.deleted ?? false,
    matrix_user_id: p.matrix_user_id,
    bot_account: p.bot_account ?? false,
    ban_expires: p.ban_expires_at,
    instance_id: p.instance_id,
    note: p.note,
  }
}

export function toV3Community(c: any): v3.Community {
  return {
    id: c.id,
    name: c.name,
    title: c.title,
    description: c.sidebar ?? c.summary,
    removed: c.removed ?? false,
    published: dateOrEmpty(c.published_at),
    updated: c.updated_at,
    deleted: c.deleted ?? false,
    nsfw: c.nsfw ?? false,
    actor_id: c.ap_id,
    local: c.local,
    icon: c.icon,
    banner: c.banner,
    hidden: false,
    posting_restricted_to_mods: c.posting_restricted_to_mods ?? false,
    instance_id: c.instance_id,
    visibility: c.visibility,
  }
}

export function toV3Post(p: any): v3.Post {
  return {
    id: p.id,
    name: p.name,
    url: p.url,
    body: p.body,
    creator_id: p.creator_id,
    community_id: p.community_id,
    removed: p.removed ?? false,
    locked: p.locked ?? false,
    published: dateOrEmpty(p.published_at),
    updated: p.updated_at,
    deleted: p.deleted ?? false,
    nsfw: p.nsfw ?? false,
    embed_title: p.embed_title,
    embed_description: p.embed_description,
    thumbnail_url: p.thumbnail_url,
    ap_id: p.ap_id,
    local: p.local,
    embed_video_url: p.embed_video_url,
    language_id: p.language_id,
    featured_community: p.featured_community ?? false,
    featured_local: p.featured_local ?? false,
    url_content_type: p.url_content_type,
    alt_text: p.alt_text,
  }
}

export function toV3Comment(c: any): v3.Comment {
  return {
    id: c.id,
    creator_id: c.creator_id,
    post_id: c.post_id,
    content: c.content,
    removed: c.removed ?? false,
    published: dateOrEmpty(c.published_at),
    updated: c.updated_at,
    deleted: c.deleted ?? false,
    ap_id: c.ap_id,
    local: c.local,
    path: c.path,
    distinguished: c.distinguished ?? false,
    language_id: c.language_id,
  }
}

export function toV3PrivateMessage(pm: any): v3.PrivateMessage {
  return {
    id: pm.id,
    creator_id: pm.creator_id,
    recipient_id: pm.recipient_id,
    content: pm.content,
    deleted: pm.deleted ?? false,
    read: pm.read ?? false,
    published: dateOrEmpty(pm.published_at),
    updated: pm.updated_at,
    ap_id: pm.ap_id,
    local: pm.local,
  }
}

function postCounts(p: any): v3.PostAggregates {
  return {
    post_id: p.id,
    comments: p.comments ?? 0,
    score: p.score ?? 0,
    upvotes: p.upvotes ?? 0,
    downvotes: p.downvotes ?? 0,
    published: dateOrEmpty(p.published_at),
    newest_comment_time: p.newest_comment_time_at ?? dateOrEmpty(p.published_at),
  }
}

function commentCounts(c: any): v3.CommentAggregates {
  return {
    comment_id: c.id,
    score: c.score ?? 0,
    upvotes: c.upvotes ?? 0,
    downvotes: c.downvotes ?? 0,
    published: dateOrEmpty(c.published_at),
    child_count: c.child_count ?? 0,
  }
}

function communityCounts(c: any): v3.CommunityAggregates {
  return {
    community_id: c.id,
    subscribers: c.subscribers ?? 0,
    posts: c.posts ?? 0,
    comments: c.comments ?? 0,
    published: dateOrEmpty(c.published_at),
    users_active_day: c.users_active_day ?? 0,
    users_active_week: c.users_active_week ?? 0,
    users_active_month: c.users_active_month ?? 0,
    users_active_half_year: c.users_active_half_year ?? 0,
    subscribers_local: c.subscribers_local ?? 0,
  }
}

function personCounts(p: any): v3.PersonAggregates {
  return {
    person_id: p.id,
    post_count: p.post_count ?? 0,
    comment_count: p.comment_count ?? 0,
  }
}

function voteFromActions(a: any): number | undefined {
  if (!a) return undefined
  if (a.vote_is_upvote === true) return 1
  if (a.vote_is_upvote === false) return -1
  if (a.voted_at != null) return 1
  return undefined
}

function subscribedFromActions(a: any): v3.SubscribedType {
  const state = a?.follow_state
  if (state === 'accepted') return 'Subscribed'
  if (state === 'pending' || state === 'approval_required') return 'Pending'
  return 'NotSubscribed'
}

export function toV3PostView(v: any): v3.PostView {
  return {
    post: toV3Post(v.post),
    creator: toV3Person(v.creator),
    community: toV3Community(v.community),
    image_details: v.image_details,
    creator_banned_from_community: v.creator_banned_from_community ?? false,
    banned_from_community: v.community_actions?.received_ban_at != null,
    creator_is_moderator: v.creator_is_moderator ?? false,
    creator_is_admin: v.creator_is_admin ?? false,
    counts: postCounts(v.post),
    subscribed: subscribedFromActions(v.community_actions),
    saved: v.post_actions?.saved_at != null,
    read: v.post_actions?.read_at != null,
    hidden: v.post_actions?.hidden_at != null,
    creator_blocked: v.person_actions?.blocked_at != null,
    my_vote: voteFromActions(v.post_actions),
    unread_comments: Math.max(
      0,
      (v.post.comments ?? 0) - (v.post_actions?.read_comments_amount ?? 0),
    ),
    flair_list:
      v.tags && v.tags.length > 0 ? v.tags.map(toV3CommunityFlair) : undefined,
  }
}

export function toV3CommentView(v: any): v3.CommentView {
  return {
    comment: toV3Comment(v.comment),
    creator: toV3Person(v.creator),
    post: toV3Post(v.post),
    community: toV3Community(v.community),
    counts: commentCounts(v.comment),
    creator_banned_from_community: v.creator_banned_from_community ?? false,
    banned_from_community: v.community_actions?.received_ban_at != null,
    creator_is_moderator: v.creator_is_moderator ?? false,
    creator_is_admin: v.creator_is_admin ?? false,
    subscribed: subscribedFromActions(v.community_actions),
    saved: v.comment_actions?.saved_at != null,
    creator_blocked: v.person_actions?.blocked_at != null,
    my_vote: voteFromActions(v.comment_actions),
  }
}

export function toV3CommunityView(v: any): v3.CommunityView {
  return {
    community: toV3Community(v.community),
    subscribed: subscribedFromActions(v.community_actions),
    blocked: v.community_actions?.blocked_at != null,
    counts: communityCounts(v.community),
    banned_from_community: v.community_actions?.received_ban_at != null,
    flair_list:
      v.tags && v.tags.length > 0 ? v.tags.map(toV3CommunityFlair) : undefined,
    notifications_mode: v.community_actions?.notifications ?? null,
  }
}

export function toV3PersonView(v: any): v3.PersonView {
  return {
    person: toV3Person({
      ...v.person,
      banned: v.banned,
      note: v.person_actions?.note,
    }),
    counts: personCounts(v.person),
    is_admin: v.is_admin ?? false,
  }
}

export function toV3PrivateMessageView(v: any): v3.PrivateMessageView {
  return {
    private_message: toV3PrivateMessage(v.private_message),
    creator: toV3Person(v.creator),
    recipient: toV3Person(v.recipient),
  }
}

export function toV3CommunityFollowerView(v: any): v3.CommunityFollowerView {
  return {
    community: toV3Community(v.community),
    follower: toV3Person(v.follower),
  }
}

export function toV3CommunityModeratorView(v: any): v3.CommunityModeratorView {
  return {
    community: toV3Community(v.community),
    moderator: toV3Person(v.moderator),
  }
}

export function toV3LocalImageView(v: any): v3.LocalImageView {
  return {
    local_image: {
      local_user_id: v.local_image.person_id ?? 0,
      pictrs_alias: v.local_image.pictrs_alias,
      pictrs_delete_token: '',
      published: dateOrEmpty(v.local_image.published_at),
    } as any,
    person: toV3Person(v.person),
    post: v.post ? toV3Post(v.post) : (undefined as any),
  } as any
}

// ---------- Reports ----------

export function toV3CommentReportView(v: any): v3.CommentReportView {
  return {
    comment_report: {
      id: v.comment_report.id,
      creator_id: v.comment_report.creator_id,
      comment_id: v.comment_report.comment_id,
      original_comment_text: v.comment_report.original_comment_text,
      reason: v.comment_report.reason,
      resolved: v.comment_report.resolved,
      resolver_id: v.comment_report.resolver_id,
      published: dateOrEmpty(v.comment_report.published_at),
      updated: v.comment_report.updated_at,
    },
    comment: toV3Comment(v.comment),
    post: toV3Post(v.post),
    community: toV3Community(v.community),
    creator: toV3Person(v.creator),
    comment_creator: toV3Person(v.comment_creator),
    counts: commentCounts(v.comment),
    creator_banned_from_community: v.creator_banned_from_community ?? false,
    creator_is_moderator: v.creator_is_moderator ?? false,
    creator_is_admin: v.creator_is_admin ?? false,
    creator_blocked: v.person_actions?.blocked_at != null,
    subscribed: subscribedFromActions(v.community_actions),
    saved: v.comment_actions?.saved_at != null,
    my_vote: voteFromActions(v.comment_actions),
    resolver: v.resolver ? toV3Person(v.resolver) : undefined,
  }
}

export function toV3PostReportView(v: any): v3.PostReportView {
  return {
    post_report: {
      id: v.post_report.id,
      creator_id: v.post_report.creator_id,
      post_id: v.post_report.post_id,
      original_post_name: v.post_report.original_post_name,
      original_post_url: v.post_report.original_post_url,
      original_post_body: v.post_report.original_post_body,
      reason: v.post_report.reason,
      resolved: v.post_report.resolved,
      resolver_id: v.post_report.resolver_id,
      published: dateOrEmpty(v.post_report.published_at),
      updated: v.post_report.updated_at,
    },
    post: toV3Post(v.post),
    community: toV3Community(v.community),
    creator: toV3Person(v.creator),
    post_creator: toV3Person(v.post_creator),
    creator_banned_from_community: v.creator_banned_from_community ?? false,
    creator_is_moderator: v.creator_is_moderator ?? false,
    creator_is_admin: v.creator_is_admin ?? false,
    subscribed: subscribedFromActions(v.community_actions),
    saved: v.post_actions?.saved_at != null,
    read: v.post_actions?.read_at != null,
    hidden: v.post_actions?.hidden_at != null,
    creator_blocked: v.person_actions?.blocked_at != null,
    my_vote: voteFromActions(v.post_actions),
    unread_comments: Math.max(
      0,
      (v.post.comments ?? 0) - (v.post_actions?.read_comments_amount ?? 0),
    ),
    counts: postCounts(v.post),
    resolver: v.resolver ? toV3Person(v.resolver) : undefined,
  }
}

export function toV3PrivateMessageReportView(
  v: any,
): v3.PrivateMessageReportView {
  return {
    private_message_report: {
      id: v.private_message_report.id,
      creator_id: v.private_message_report.creator_id,
      private_message_id: v.private_message_report.private_message_id,
      original_pm_text: v.private_message_report.original_pm_text,
      reason: v.private_message_report.reason,
      resolved: v.private_message_report.resolved,
      resolver_id: v.private_message_report.resolver_id,
      published: dateOrEmpty(v.private_message_report.published_at),
      updated: v.private_message_report.updated_at,
    },
    private_message: toV3PrivateMessage(v.private_message),
    private_message_creator: toV3Person(v.private_message_creator),
    creator: toV3Person(v.creator),
    resolver: v.resolver ? toV3Person(v.resolver) : undefined,
  }
}

// ---------- Site / Account ----------

export function toV3Tagline(t: any): v3.Tagline {
  return {
    id: t.id,
    local_site_id: 0 as any,
    content: t.content,
    published: dateOrEmpty(t.published_at),
    updated: t.updated_at,
  }
}

export function toV3CustomEmojiView(v: any): v3.CustomEmojiView {
  return {
    custom_emoji: {
      id: v.custom_emoji.id,
      local_site_id: 0 as any,
      shortcode: v.custom_emoji.shortcode,
      image_url: v.custom_emoji.image_url,
      alt_text: v.custom_emoji.alt_text,
      category: v.custom_emoji.category,
      published: dateOrEmpty(v.custom_emoji.published_at),
      updated: v.custom_emoji.updated_at,
    },
    keywords: v.keywords ?? [],
  }
}

export function toV3GetSiteResponse(
  v4Site: any,
  v4MyUser: any | null,
): v3.GetSiteResponse {
  const siteSrc = v4Site.site_view.site
  const localSite = v4Site.site_view.local_site
  const counts = {
    site_id: siteSrc.id,
    users: localSite?.users ?? 0,
    posts: localSite?.posts ?? 0,
    comments: localSite?.comments ?? 0,
    communities: localSite?.communities ?? 0,
    users_active_day: localSite?.users_active_day ?? 0,
    users_active_week: localSite?.users_active_week ?? 0,
    users_active_month: localSite?.users_active_month ?? 0,
    users_active_half_year: localSite?.users_active_half_year ?? 0,
  }

  return {
    site_view: {
      site: {
        id: siteSrc.id,
        name: siteSrc.name,
        sidebar: siteSrc.sidebar,
        published: dateOrEmpty(siteSrc.published_at),
        updated: siteSrc.updated_at,
        icon: siteSrc.icon,
        banner: siteSrc.banner,
        description: siteSrc.summary,
        actor_id: siteSrc.ap_id,
        last_refreshed_at: siteSrc.last_refreshed_at,
        inbox_url: siteSrc.inbox_url,
        public_key: '',
        instance_id: siteSrc.instance_id,
        content_warning: siteSrc.content_warning,
      } as any,
      local_site: localSite,
      local_site_rate_limit: v4Site.site_view.local_site_rate_limit,
      counts: counts as any,
    },
    admins: (v4Site.admins ?? []).map(toV3PersonView),
    version: v4Site.version,
    my_user: v4MyUser ? toV3MyUserInfo(v4MyUser) : undefined,
    all_languages: v4Site.all_languages ?? [],
    discussion_languages: v4Site.discussion_languages ?? [],
    taglines: v4Site.tagline ? [toV3Tagline(v4Site.tagline)] : [],
    custom_emojis: [],
    blocked_urls: v4Site.blocked_urls ?? [],
  }
}

export function toV3MyUserInfo(v4: any): v3.MyUserInfo {
  return {
    local_user_view: {
      local_user: v4.local_user_view.local_user,
      person: toV3Person({
        ...v4.local_user_view.person,
        banned: v4.local_user_view.banned,
        ban_expires_at: v4.local_user_view.ban_expires_at,
      }),
      counts: personCounts(v4.local_user_view.person),
    } as any,
    follows: (v4.follows ?? []).map(toV3CommunityFollowerView),
    moderates: (v4.moderates ?? []).map(toV3CommunityModeratorView),
    community_blocks: (v4.community_blocks ?? []).map((c: any) => ({
      person: {} as any,
      community: toV3Community(c),
    })),
    instance_blocks: (v4.instance_communities_blocks ?? []).map(
      (i: any) =>
        ({
          person: {} as any,
          instance: i,
        }) as any,
    ),
    person_blocks: (v4.person_blocks ?? []).map((p: any) => ({
      person: {} as any,
      target: toV3Person(p),
    })),
    discussion_languages: v4.discussion_languages ?? [],
  }
}

// ---------- Notifications -> v3 inbox shape ----------

export type SplitNotifications = {
  replies: v3.CommentReplyView[]
  mentions: v3.PersonMentionView[]
  private_messages: v3.PrivateMessageView[]
}

export function splitNotifications(items: any[]): SplitNotifications {
  const replies: v3.CommentReplyView[] = []
  const mentions: v3.PersonMentionView[] = []
  const privateMessages: v3.PrivateMessageView[] = []

  for (const n of items) {
    const kind = n.notification?.kind
    const data = n.data
    if (!data) continue

    if (kind === 'reply' || kind === 'subscribed') {
      replies.push(toV3CommentReplyView(n))
    } else if (kind === 'mention') {
      mentions.push(toV3PersonMentionView(n))
    } else if (kind === 'private_message') {
      privateMessages.push(toV3PrivateMessageView(data))
    }
    // mod_action notifications are dropped — v3 inbox didn't have them
  }

  return { replies, mentions, private_messages: privateMessages }
}

// Notification ids are reused as comment_reply / person_mention / pm ids so
// that mark-as-read callbacks from v3 components can be translated back.
export function toV3CommentReplyView(n: any): v3.CommentReplyView {
  const cv = n.data
  const notif = n.notification
  return {
    comment_reply: {
      id: notif.id,
      recipient_id: notif.recipient_id,
      comment_id: notif.comment_id ?? cv.comment.id,
      read: notif.read,
      published: dateOrEmpty(notif.published_at),
    },
    comment: toV3Comment(cv.comment),
    creator: toV3Person(cv.creator),
    post: toV3Post(cv.post),
    community: toV3Community(cv.community),
    recipient: toV3Person(cv.creator),
    counts: commentCounts(cv.comment),
    creator_banned_from_community: cv.creator_banned_from_community ?? false,
    banned_from_community: cv.community_actions?.received_ban_at != null,
    creator_is_moderator: cv.creator_is_moderator ?? false,
    creator_is_admin: cv.creator_is_admin ?? false,
    subscribed: subscribedFromActions(cv.community_actions),
    saved: cv.comment_actions?.saved_at != null,
    creator_blocked: cv.person_actions?.blocked_at != null,
    my_vote: voteFromActions(cv.comment_actions),
  }
}

export function toV3PersonMentionView(n: any): v3.PersonMentionView {
  const cv = n.data
  const notif = n.notification
  return {
    person_mention: {
      id: notif.id,
      recipient_id: notif.recipient_id,
      comment_id: notif.comment_id ?? cv.comment.id,
      read: notif.read,
      published: dateOrEmpty(notif.published_at),
    },
    comment: toV3Comment(cv.comment),
    creator: toV3Person(cv.creator),
    post: toV3Post(cv.post),
    community: toV3Community(cv.community),
    recipient: toV3Person(cv.creator),
    counts: commentCounts(cv.comment),
    creator_banned_from_community: cv.creator_banned_from_community ?? false,
    banned_from_community: cv.community_actions?.received_ban_at != null,
    creator_is_moderator: cv.creator_is_moderator ?? false,
    creator_is_admin: cv.creator_is_admin ?? false,
    subscribed: subscribedFromActions(cv.community_actions),
    saved: cv.comment_actions?.saved_at != null,
    creator_blocked: cv.person_actions?.blocked_at != null,
    my_vote: voteFromActions(cv.comment_actions),
  }
}

// ---------- Resolve object ----------

export function toV3ResolveObjectResponse(v: any): v3.ResolveObjectResponse {
  if (!v) return {}
  switch (v.type_) {
    case 'post':
      return { post: toV3PostView(v) }
    case 'comment':
      return { comment: toV3CommentView(v) }
    case 'community':
      return { community: toV3CommunityView(v) }
    case 'person':
      return { person: toV3PersonView(v) }
    default:
      return {}
  }
}

// ---------- Modlog ----------

const MODLOG_EMPTY: v3.GetModlogResponse = {
  removed_posts: [],
  locked_posts: [],
  featured_posts: [],
  removed_comments: [],
  removed_communities: [],
  banned_from_community: [],
  banned: [],
  added_to_community: [],
  transferred_to_community: [],
  added: [],
  admin_purged_persons: [],
  admin_purged_communities: [],
  admin_purged_posts: [],
  admin_purged_comments: [],
  hidden_communities: [],
}

export function toV3GetModlogResponse(items: any[]): v3.GetModlogResponse {
  const out: v3.GetModlogResponse = {
    removed_posts: [],
    locked_posts: [],
    featured_posts: [],
    removed_comments: [],
    removed_communities: [],
    banned_from_community: [],
    banned: [],
    added_to_community: [],
    transferred_to_community: [],
    added: [],
    admin_purged_persons: [],
    admin_purged_communities: [],
    admin_purged_posts: [],
    admin_purged_comments: [],
    hidden_communities: [],
  }
  void MODLOG_EMPTY

  for (const v of items) {
    const m = v.modlog
    if (!m) continue
    const mod = v.moderator ? toV3Person(v.moderator) : undefined
    const target = v.target_person ? toV3Person(v.target_person) : undefined
    const community = v.target_community
      ? toV3Community(v.target_community)
      : undefined
    const post = v.target_post ? toV3Post(v.target_post) : undefined
    const comment = v.target_comment ? toV3Comment(v.target_comment) : undefined
    const when_ = dateOrEmpty(m.published_at)

    switch (m.kind) {
      case 'mod_remove_post':
        if (post && community)
          out.removed_posts.push({
            mod_remove_post: {
              id: m.id,
              mod_person_id: mod?.id ?? 0,
              post_id: post.id,
              reason: m.reason,
              removed: !m.is_revert,
              when_,
            },
            moderator: mod,
            post,
            community,
          })
        break
      case 'mod_lock_post':
        if (post && community)
          out.locked_posts.push({
            mod_lock_post: {
              id: m.id,
              mod_person_id: mod?.id ?? 0,
              post_id: post.id,
              locked: !m.is_revert,
              when_,
            },
            moderator: mod,
            post,
            community,
          })
        break
      case 'mod_feature_post_community':
      case 'admin_feature_post_site':
        if (post && community)
          out.featured_posts.push({
            mod_feature_post: {
              id: m.id,
              mod_person_id: mod?.id ?? 0,
              post_id: post.id,
              featured: !m.is_revert,
              when_,
              is_featured_community: m.kind === 'mod_feature_post_community',
            },
            moderator: mod,
            post,
            community,
          })
        break
      case 'mod_remove_comment':
        if (comment && post && community && target)
          out.removed_comments.push({
            mod_remove_comment: {
              id: m.id,
              mod_person_id: mod?.id ?? 0,
              comment_id: comment.id,
              reason: m.reason,
              removed: !m.is_revert,
              when_,
            },
            moderator: mod,
            comment,
            commenter: target,
            post,
            community,
          })
        break
      case 'admin_remove_community':
        if (community)
          out.removed_communities.push({
            mod_remove_community: {
              id: m.id,
              mod_person_id: mod?.id ?? 0,
              community_id: community.id,
              reason: m.reason,
              removed: !m.is_revert,
              when_,
            },
            moderator: mod,
            community,
          })
        break
      case 'mod_ban_from_community':
        if (community && target)
          out.banned_from_community.push({
            mod_ban_from_community: {
              id: m.id,
              mod_person_id: mod?.id ?? 0,
              other_person_id: target.id,
              community_id: community.id,
              reason: m.reason,
              banned: !m.is_revert,
              expires: m.expires_at,
              when_,
            },
            moderator: mod,
            community,
            banned_person: target,
          })
        break
      case 'admin_ban':
        if (target)
          out.banned.push({
            mod_ban: {
              id: m.id,
              mod_person_id: mod?.id ?? 0,
              other_person_id: target.id,
              reason: m.reason,
              banned: !m.is_revert,
              expires: m.expires_at,
              when_,
            },
            moderator: mod,
            banned_person: target,
          })
        break
      case 'mod_add_to_community':
        if (community && target)
          out.added_to_community.push({
            mod_add_community: {
              id: m.id,
              mod_person_id: mod?.id ?? 0,
              other_person_id: target.id,
              community_id: community.id,
              removed: m.is_revert,
              when_,
            },
            moderator: mod,
            community,
            modded_person: target,
          })
        break
      case 'mod_transfer_community':
        if (community && target)
          out.transferred_to_community.push({
            mod_transfer_community: {
              id: m.id,
              mod_person_id: mod?.id ?? 0,
              other_person_id: target.id,
              community_id: community.id,
              when_,
            },
            moderator: mod,
            community,
            modded_person: target,
          })
        break
      case 'admin_add':
        if (target)
          out.added.push({
            mod_add: {
              id: m.id,
              mod_person_id: mod?.id ?? 0,
              other_person_id: target.id,
              removed: m.is_revert,
              when_,
            },
            moderator: mod,
            modded_person: target,
          })
        break
      case 'admin_purge_person':
        out.admin_purged_persons.push({
          admin_purge_person: {
            id: m.id,
            admin_person_id: mod?.id ?? 0,
            reason: m.reason,
            when_,
          },
          admin: mod,
        })
        break
      case 'admin_purge_community':
        out.admin_purged_communities.push({
          admin_purge_community: {
            id: m.id,
            admin_person_id: mod?.id ?? 0,
            reason: m.reason,
            when_,
          },
          admin: mod,
        })
        break
      case 'admin_purge_post':
        if (community)
          out.admin_purged_posts.push({
            admin_purge_post: {
              id: m.id,
              admin_person_id: mod?.id ?? 0,
              community_id: community.id,
              reason: m.reason,
              when_,
            },
            admin: mod,
            community,
          })
        break
      case 'admin_purge_comment':
        if (post)
          out.admin_purged_comments.push({
            admin_purge_comment: {
              id: m.id,
              admin_person_id: mod?.id ?? 0,
              post_id: post.id,
              reason: m.reason,
              when_,
            },
            admin: mod,
            post,
          })
        break
      case 'mod_change_community_visibility':
        if (community)
          out.hidden_communities.push({
            mod_hide_community: {
              id: m.id,
              community_id: community.id,
              mod_person_id: mod?.id ?? 0,
              when_,
              reason: m.reason,
              hidden: !m.is_revert,
            },
            admin: mod,
            community,
          })
        break
    }
  }

  return out
}

// ---------- Sort filter inverse mapping (v3 ModlogActionType -> v4) ----------

export function toV4ModlogKind(t?: v3.ModlogActionType): string | undefined {
  if (!t || t === 'All') return undefined
  switch (t) {
    case 'ModRemovePost':
      return 'mod_remove_post'
    case 'ModLockPost':
      return 'mod_lock_post'
    case 'ModFeaturePost':
      return 'mod_feature_post_community'
    case 'ModRemoveComment':
      return 'mod_remove_comment'
    case 'ModRemoveCommunity':
      return 'admin_remove_community'
    case 'ModBanFromCommunity':
      return 'mod_ban_from_community'
    case 'ModAddCommunity':
      return 'mod_add_to_community'
    case 'ModTransferCommunity':
      return 'mod_transfer_community'
    case 'ModAdd':
      return 'admin_add'
    case 'ModBan':
      return 'admin_ban'
    case 'ModHideCommunity':
      return 'mod_change_community_visibility'
    case 'AdminPurgePerson':
      return 'admin_purge_person'
    case 'AdminPurgeCommunity':
      return 'admin_purge_community'
    case 'AdminPurgePost':
      return 'admin_purge_post'
    case 'AdminPurgeComment':
      return 'admin_purge_comment'
    default:
      return undefined
  }
}
