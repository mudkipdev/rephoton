import { LemmyHttp } from 'lemmy-js-client'
import type { BaseClient, ClientType } from '../base'
import * as v3 from '../types'
import * as t from './v4-translate'
import { unwrap } from './v4-translate'

export const LemmyClientConstants = {
  password: { minLength: 8, maxLength: 60 },
}

export function createLemmyClient(
  baseUrl: string,
  args: {
    fetchFunction: (input: any, init: any) => Promise<any>
    headers: any
  },
): BaseClient {
  const client = new LemmyHttp(baseUrl, args as any)

  // shortcut for `unwrap(await client.foo(...))`
  const call = async <R>(p: Promise<any>): Promise<R> => unwrap<R>(await p)

  const overrides: Partial<BaseClient> = {
    type: { name: 'lemmy', baseUrl: '/api/v4' } as ClientType,

    // ---------------- Site ----------------
    async getSite() {
      const site: any = await call(client.getSite())
      let myUser: any = null
      try {
        myUser = await call(client.getMyUser())
      } catch {
        myUser = null
      }
      return t.toV3GetSiteResponse(site, myUser)
    },

    async editSite(form) {
      const res: any = await call(
        client.editSite({
          ...(form as any),
          sidebar: (form as any).sidebar,
          summary: (form as any).description,
        }),
      )
      return {
        site_view: t.toV3GetSiteResponse(res, null).site_view,
        taglines: [],
      }
    },

    async generateTotpSecret() {
      return await call(client.generateTotpSecret())
    },

    async listLogins() {
      const res: any = await call(client.listLogins())
      return (res.logins ?? []).map((l: any) => ({
        local_user_id: l.user_id,
        published: l.published_at,
        ip: l.ip,
        user_agent: l.user_agent,
      })) as v3.LoginToken[]
    },

    async listAllMedia(form) {
      const res: any = await call(
        client.listMediaAdmin({ limit: form.limit } as any),
      )
      return { images: (res.items ?? []).map(t.toV3LocalImageView) }
    },

    async listMedia(form) {
      const res: any = await call(
        client.listMedia({ limit: form.limit } as any),
      )
      return { images: (res.items ?? []).map(t.toV3LocalImageView) }
    },

    async updateTotp(form) {
      const res: any = await call(
        client.editTotp({ totp_token: form.totp_token, enabled: form.enabled }),
      )
      return { enabled: res.enabled }
    },

    async getModlog(form) {
      const res: any = await call(
        client.getModlog({
          mod_person_id: form.mod_person_id,
          community_id: form.community_id,
          type_: t.toV4ModlogKind(form.type_) as any,
          other_person_id: form.other_person_id,
          post_id: form.post_id,
          comment_id: form.comment_id,
          limit: form.limit,
        } as any),
      )
      return t.toV3GetModlogResponse(res.items ?? [])
    },

    // ---------------- Search ----------------
    async search(form) {
      const sortMapped = t.toV4PostSort(form.sort)
      const res: any = await call(
        client.search({
          search_term: (form as any).q,
          community_id: form.community_id,
          community_name: form.community_name,
          creator_id: form.creator_id,
          type_: ((form as any).type_ ?? 'All').toLowerCase(),
          listing_type: t.toV4ListingType(form.listing_type) as any,
          time_range_seconds: sortMapped.time_range_seconds,
          limit: form.limit,
        } as any),
      )
      return {
        type_: (form as any).type_ ?? 'All',
        comments: (res.comments ?? []).map(t.toV3CommentView),
        posts: (res.posts ?? []).map(t.toV3PostView),
        communities: (res.communities ?? []).map(t.toV3CommunityView),
        users: (res.persons ?? []).map(t.toV3PersonView),
      } as v3.SearchResponse
    },

    async resolveObject(form) {
      const res: any = await call(client.resolveObject({ q: (form as any).q }))
      return t.toV3ResolveObjectResponse(res)
    },

    // ---------------- Communities ----------------
    async createCommunity(form) {
      const res: any = await call(
        client.createCommunity({
          name: form.name,
          title: form.title,
          sidebar: (form as any).description,
          summary: (form as any).description,
          icon: form.icon,
          banner: form.banner,
          nsfw: form.nsfw,
          posting_restricted_to_mods: form.posting_restricted_to_mods,
          discussion_languages: form.discussion_languages,
          visibility: form.visibility as any,
        }),
      )
      return {
        community_view: t.toV3CommunityView(res.community_view),
        discussion_languages: res.discussion_languages ?? [],
      }
    },

    async getCommunity(form) {
      const res: any = await call(
        client.getCommunity({ id: form.id, name: form.name }),
      )
      return {
        community_view: t.toV3CommunityView(res.community_view),
        site: res.site
          ? t.toV3GetSiteResponse({ site_view: { site: res.site, local_site: {} } }, null).site_view.site
          : undefined,
        moderators: (res.moderators ?? []).map(t.toV3CommunityModeratorView),
        discussion_languages: res.discussion_languages ?? [],
      } as v3.GetCommunityResponse
    },

    async editCommunity(form) {
      const res: any = await call(
        client.editCommunity({
          community_id: form.community_id,
          title: form.title,
          sidebar: (form as any).description,
          summary: (form as any).description,
          nsfw: form.nsfw,
          posting_restricted_to_mods: form.posting_restricted_to_mods,
          discussion_languages: form.discussion_languages,
          visibility: form.visibility,
        } as any),
      )
      return {
        community_view: t.toV3CommunityView(res.community_view),
        discussion_languages: res.discussion_languages ?? [],
      }
    },

    async listCommunities(form) {
      const res: any = await call(
        client.listCommunities({
          type_: t.toV4ListingType(form.type_) as any,
          sort: t.toV4CommunitySort(form.sort) as any,
          show_nsfw: form.show_nsfw,
          limit: form.limit,
        } as any),
      )
      return {
        communities: (res.items ?? []).map(t.toV3CommunityView),
      }
    },

    async followCommunity(form) {
      const res: any = await call(
        client.followCommunity({
          community_id: form.community_id,
          follow: form.follow,
        }),
      )
      return {
        community_view: t.toV3CommunityView(res.community_view),
        discussion_languages: res.discussion_languages ?? [],
      }
    },

    async blockCommunity(form) {
      const res: any = await call(client.blockCommunity(form))
      return {
        community_view: t.toV3CommunityView(res.community_view),
        blocked: form.block,
      }
    },

    async deleteCommunity(form) {
      const res: any = await call(client.deleteCommunity(form))
      return {
        community_view: t.toV3CommunityView(res.community_view),
        discussion_languages: res.discussion_languages ?? [],
      }
    },

    async hideCommunity(form) {
      return await call(
        client.hideCommunity({
          community_id: form.community_id,
          hidden: form.hidden,
          reason: form.reason ?? '',
        }),
      )
    },

    async removeCommunity(form) {
      const res: any = await call(client.removeCommunity(form as any))
      return {
        community_view: t.toV3CommunityView(res.community_view),
        discussion_languages: res.discussion_languages ?? [],
      }
    },

    async banFromCommunity(form) {
      const res: any = await call(
        client.banFromCommunity({
          community_id: form.community_id,
          person_id: form.person_id,
          ban: form.ban,
          remove_or_restore_data: (form as any).remove_data,
          reason: form.reason ?? '',
          expires_at: form.expires,
        } as any),
      )
      return {
        person_view: t.toV3PersonView(res.person_view),
        banned: form.ban,
      } as any
    },

    async addModToCommunity(form) {
      const res: any = await call(client.addModToCommunity(form))
      return {
        moderators: (res.moderators ?? []).map(t.toV3CommunityModeratorView),
      }
    },

    // ---------------- Posts ----------------
    async createPost(form) {
      const res: any = await call(
        client.createPost({
          name: form.name,
          community_id: form.community_id,
          url: form.url,
          body: form.body,
          alt_text: form.alt_text,
          honeypot: form.honeypot,
          nsfw: form.nsfw,
          language_id: form.language_id,
          custom_thumbnail: form.custom_thumbnail,
        } as any),
      )
      return { post_view: t.toV3PostView(res.post_view) }
    },

    async getPost(form) {
      const res: any = await call(
        client.getPost({ id: form.id, comment_id: form.comment_id }),
      )
      return {
        post_view: t.toV3PostView(res.post_view),
        community_view: t.toV3CommunityView(res.community_view),
        moderators: [],
        cross_posts: (res.cross_posts ?? []).map(t.toV3PostView),
      }
    },

    async editPost(form) {
      const res: any = await call(
        client.editPost({
          post_id: form.post_id,
          name: form.name,
          url: form.url,
          body: form.body,
          alt_text: form.alt_text,
          nsfw: form.nsfw,
          language_id: form.language_id,
          custom_thumbnail: form.custom_thumbnail,
        } as any),
      )
      return { post_view: t.toV3PostView(res.post_view) }
    },

    async deletePost(form) {
      const res: any = await call(client.deletePost(form))
      return { post_view: t.toV3PostView(res.post_view) }
    },

    async removePost(form) {
      const res: any = await call(client.removePost(form as any))
      return { post_view: t.toV3PostView(res.post_view) }
    },

    async markPostAsRead(form) {
      if ((form as any).post_ids?.length) {
        return await call(
          client.markManyPostAsRead({
            post_ids: (form as any).post_ids,
            read: form.read,
          } as any),
        )
      }
      const single = (form as any).post_id
      if (single != null) {
        await call(client.markPostAsRead({ post_id: single, read: form.read }))
      }
      return { success: true }
    },

    async hidePost(form) {
      const ids = (form as any).post_ids ?? []
      for (const id of ids) {
        await call(client.hidePost({ post_id: id, hide: form.hide } as any))
      }
      return { success: true }
    },

    async lockPost(form) {
      const res: any = await call(
        client.lockPost({
          post_id: form.post_id,
          locked: form.locked,
          reason: '',
        }),
      )
      return { post_view: t.toV3PostView(res.post_view) }
    },

    async featurePost(form) {
      const res: any = await call(client.featurePost(form as any))
      return { post_view: t.toV3PostView(res.post_view) }
    },

    async getPosts(form) {
      const sortMapped = t.toV4PostSort(form.sort)
      const res: any = await call(
        client.getPosts({
          type_: t.toV4ListingType(form.type_ as any) as any,
          sort: sortMapped.sort,
          time_range_seconds: sortMapped.time_range_seconds,
          community_id: form.community_id,
          community_name: form.community_name,
          show_hidden: form.show_hidden,
          show_read: form.show_read,
          show_nsfw: form.show_nsfw,
          page_cursor: form.page_cursor,
          limit: form.limit,
        } as any),
      )
      return {
        posts: (res.items ?? []).map(t.toV3PostView),
        next_page: res.next_page as any,
      }
    },

    async likePost(form) {
      const res: any = await call(
        client.likePost({
          post_id: form.post_id,
          is_upvote: t.toV4Vote(form.score),
        }),
      )
      return { post_view: t.toV3PostView(res.post_view) }
    },

    async listPostLikes(form) {
      const res: any = await call(
        client.listPostLikes({ post_id: form.post_id, limit: form.limit } as any),
      )
      return { post_likes: res.items ?? [] }
    },

    async savePost(form) {
      const res: any = await call(client.savePost(form))
      return { post_view: t.toV3PostView(res.post_view) }
    },

    async createPostReport(form) {
      const res: any = await call(client.createPostReport(form))
      return { post_report_view: t.toV3PostReportView(res.post_report_view) }
    },

    async resolvePostReport(form) {
      const res: any = await call(client.resolvePostReport(form))
      return { post_report_view: t.toV3PostReportView(res.post_report_view) }
    },

    async listPostReports(form) {
      const res: any = await call(
        client.listReports({
          unresolved_only: form.unresolved_only,
          type_: 'posts' as any,
          community_id: form.community_id,
          limit: form.limit,
        } as any),
      )
      return {
        post_reports: (res.items ?? [])
          .filter((x: any) => x.type_ === 'post')
          .map(t.toV3PostReportView),
      }
    },

    async getSiteMetadata(form) {
      const res: any = await call(client.getSiteMetadata({ url: form.url }))
      return {
        metadata: {
          title: res.metadata?.title,
          description: res.metadata?.description,
          image: res.metadata?.image,
          embed_video_url: res.metadata?.embed_video_url,
        } as any,
      }
    },

    // ---------------- Comments ----------------
    async createComment(form) {
      const res: any = await call(client.createComment(form))
      return {
        comment_view: t.toV3CommentView(res.comment_view),
        recipient_ids: [],
      } as any
    },

    async editComment(form) {
      const res: any = await call(
        client.editComment({
          comment_id: form.comment_id,
          content: form.content,
          language_id: form.language_id,
        }),
      )
      return {
        comment_view: t.toV3CommentView(res.comment_view),
        recipient_ids: [],
      } as any
    },

    async deleteComment(form) {
      const res: any = await call(client.deleteComment(form))
      return {
        comment_view: t.toV3CommentView(res.comment_view),
        recipient_ids: [],
      } as any
    },

    async removeComment(form) {
      const res: any = await call(client.removeComment(form as any))
      return {
        comment_view: t.toV3CommentView(res.comment_view),
        recipient_ids: [],
      } as any
    },

    async markCommentReplyAsRead(form) {
      // The v3 form supplies a comment_reply_id; in our notification translation
      // we reuse the v4 notification id as comment_reply_id.
      await call(
        client.markNotificationAsRead({
          notification_id: (form as any).comment_reply_id,
          read: form.read,
        }),
      )
    },

    async likeComment(form) {
      const res: any = await call(
        client.likeComment({
          comment_id: form.comment_id,
          is_upvote: t.toV4Vote(form.score),
        }),
      )
      return {
        comment_view: t.toV3CommentView(res.comment_view),
        recipient_ids: [],
      } as any
    },

    async listCommentLikes(form) {
      const res: any = await call(
        client.listCommentLikes({
          comment_id: form.comment_id,
          limit: form.limit,
        } as any),
      )
      return { comment_likes: res.items ?? [] }
    },

    async saveComment(form) {
      const res: any = await call(client.saveComment(form))
      return {
        comment_view: t.toV3CommentView(res.comment_view),
        recipient_ids: [],
      } as any
    },

    async distinguishComment(form) {
      const res: any = await call(client.distinguishComment(form))
      return {
        comment_view: t.toV3CommentView(res.comment_view),
        recipient_ids: [],
      } as any
    },

    async getComments(form) {
      const sort = t.toV4CommentSort(form.sort) as any
      const res: any = await call(
        client.getComments({
          type_: t.toV4ListingType(form.type_) as any,
          sort,
          max_depth: form.max_depth,
          limit: form.limit,
          community_id: form.community_id,
          community_name: form.community_name,
          post_id: form.post_id,
          parent_id: form.parent_id,
          saved_only: undefined,
        } as any),
      )
      return { comments: (res.items ?? []).map(t.toV3CommentView) }
    },

    async getComment(form) {
      const res: any = await call(client.getComment({ id: form.id }))
      return {
        comment_view: t.toV3CommentView(res.comment_view),
        recipient_ids: [],
      } as any
    },

    async createCommentReport(form) {
      const res: any = await call(client.createCommentReport(form as any))
      return {
        comment_report_view: t.toV3CommentReportView(res.comment_report_view),
      }
    },

    async resolveCommentReport(form) {
      const res: any = await call(client.resolveCommentReport(form))
      return {
        comment_report_view: t.toV3CommentReportView(res.comment_report_view),
      }
    },

    async listCommentReports(form) {
      const res: any = await call(
        client.listReports({
          unresolved_only: form.unresolved_only,
          type_: 'comments' as any,
          community_id: form.community_id,
          limit: form.limit,
        } as any),
      )
      return {
        comment_reports: (res.items ?? [])
          .filter((x: any) => x.type_ === 'comment')
          .map(t.toV3CommentReportView),
      }
    },

    // ---------------- Private messages / inbox ----------------
    async getPrivateMessages(form) {
      const res: any = await call(
        client.listNotifications({
          type_: 'private_message' as any,
          unread_only: form.unread_only,
          creator_id: form.creator_id,
          limit: form.limit,
        } as any),
      )
      const split = t.splitNotifications(res.items ?? [])
      return { private_messages: split.private_messages }
    },

    async createPrivateMessage(form) {
      const res: any = await call(client.createPrivateMessage(form))
      return {
        private_message_view: t.toV3PrivateMessageView(res.private_message_view),
      }
    },

    async editPrivateMessage(form) {
      const res: any = await call(client.editPrivateMessage(form))
      return {
        private_message_view: t.toV3PrivateMessageView(res.private_message_view),
      }
    },

    async deletePrivateMessage(form) {
      const res: any = await call(client.deletePrivateMessage(form))
      return {
        private_message_view: t.toV3PrivateMessageView(res.private_message_view),
      }
    },

    async markPrivateMessageAsRead(form) {
      // form.private_message_id is reused as a notification id (see notification mapping)
      await call(
        client.markNotificationAsRead({
          notification_id: (form as any).private_message_id,
          read: form.read,
        }),
      )
      return { private_message_view: undefined } as any
    },

    async createPrivateMessageReport(form) {
      const res: any = await call(client.createPrivateMessageReport(form))
      return {
        private_message_report_view: t.toV3PrivateMessageReportView(
          res.private_message_report_view,
        ),
      }
    },

    async resolvePrivateMessageReport(form) {
      const res: any = await call(client.resolvePrivateMessageReport(form))
      return {
        private_message_report_view: t.toV3PrivateMessageReportView(
          res.private_message_report_view,
        ),
      }
    },

    async listPrivateMessageReports(form) {
      const res: any = await call(
        client.listReports({
          unresolved_only: form.unresolved_only,
          type_: 'private_messages' as any,
          limit: form.limit,
        } as any),
      )
      return {
        private_message_reports: (res.items ?? [])
          .filter((x: any) => x.type_ === 'private_message')
          .map(t.toV3PrivateMessageReportView),
      }
    },

    // ---------------- Auth ----------------
    async register(form) {
      return await call(
        client.register({
          ...(form as any),
          password: form.password as any,
          password_verify: form.password_verify as any,
        }),
      )
    },

    async login(form) {
      return await call(
        client.login({
          username_or_email: form.username_or_email as any,
          password: form.password as any,
          totp_2fa_token: form.totp_2fa_token,
        }),
      )
    },

    async logout() {
      return await call(client.logout())
    },

    // ---------------- People ----------------
    async getPersonDetails(form) {
      const person: any = await call(
        client.getPersonDetails({
          person_id: form.person_id,
          username: form.username,
        }),
      )
      // posts and comments come from a separate endpoint in v4
      const posts: any[] = []
      const comments: any[] = []
      try {
        const content: any = await call(
          client.listPersonContent({
            person_id: form.person_id,
            username: form.username,
            community_id: form.community_id,
            limit: form.limit,
          } as any),
        )
        for (const item of content.items ?? []) {
          if (item.type_ === 'post') posts.push(item)
          else if (item.type_ === 'comment') comments.push(item)
        }
      } catch {
        // ignore
      }
      return {
        person_view: t.toV3PersonView(person.person_view),
        site: undefined,
        comments: comments.map(t.toV3CommentView),
        posts: posts.map(t.toV3PostView),
        moderates: (person.moderates ?? []).map(t.toV3CommunityModeratorView),
      }
    },

    async getPersonMentions(form) {
      const res: any = await call(
        client.listNotifications({
          type_: 'mention' as any,
          unread_only: form.unread_only,
          limit: form.limit,
        } as any),
      )
      const split = t.splitNotifications(res.items ?? [])
      return { mentions: split.mentions }
    },

    async markPersonMentionAsRead(form) {
      await call(
        client.markNotificationAsRead({
          notification_id: (form as any).person_mention_id,
          read: form.read,
        }),
      )
    },

    async getReplies(form) {
      const res: any = await call(
        client.listNotifications({
          type_: 'reply' as any,
          unread_only: form.unread_only,
          limit: form.limit,
        } as any),
      )
      const split = t.splitNotifications(res.items ?? [])
      return { replies: split.replies }
    },

    async banPerson(form) {
      const res: any = await call(
        client.banPerson({
          person_id: form.person_id,
          ban: form.ban,
          remove_or_restore_data: (form as any).remove_data,
          reason: form.reason ?? '',
          expires_at: form.expires,
        } as any),
      )
      return {
        person_view: t.toV3PersonView(res.person_view),
        banned: form.ban,
      }
    },

    async getBannedPersons() {
      // v4 lets us list users with banned_only filter
      const res: any = await call(
        client.listUsers({ banned_only: true } as any),
      )
      return {
        banned: (res.items ?? []).map((u: any) =>
          t.toV3PersonView({
            person: u.person,
            is_admin: false,
            banned: u.banned,
            ban_expires_at: u.ban_expires_at,
          }),
        ),
      }
    },

    async blockPerson(form) {
      const res: any = await call(client.blockPerson(form))
      return {
        person_view: t.toV3PersonView(res.person_view),
        blocked: form.block,
      }
    },

    async getCaptcha() {
      try {
        return await call(client.getCaptcha())
      } catch {
        return { ok: undefined } as any
      }
    },

    async deleteAccount(form) {
      return await call(
        client.deleteAccount({
          password: form.password as any,
          delete_content: form.delete_content,
        }),
      )
    },

    async passwordReset(form) {
      return await call(client.resetPassword({ email: form.email as any }))
    },

    async passwordChangeAfterReset(form) {
      return await call(
        client.changePasswordAfterReset({
          token: form.token as any,
          password: form.password as any,
          password_verify: form.password_verify as any,
        }),
      )
    },

    async markAllAsRead() {
      await call(client.markAllNotificationsAsRead())
      return { replies: [] }
    },

    async saveUserSettings(form) {
      const sortMapped = t.toV4PostSort((form as any).default_sort_type)
      return await call(
        client.saveUserSettings({
          show_nsfw: form.show_nsfw,
          blur_nsfw: form.blur_nsfw,
          theme: form.theme,
          default_listing_type: t.toV4ListingType(form.default_listing_type) as any,
          default_post_sort_type: sortMapped.sort as any,
          default_post_time_range_seconds: sortMapped.time_range_seconds,
          interface_language: form.interface_language,
          display_name: form.display_name,
          email: form.email as any,
          bio: form.bio,
          matrix_user_id: form.matrix_user_id,
          show_avatars: form.show_avatars,
          send_notifications_to_email: form.send_notifications_to_email,
          bot_account: form.bot_account,
          show_bot_accounts: form.show_bot_accounts,
          show_read_posts: form.show_read_posts,
          discussion_languages: form.discussion_languages,
          open_links_in_new_tab: form.open_links_in_new_tab,
          infinite_scroll_enabled: form.infinite_scroll_enabled,
          post_listing_mode: form.post_listing_mode,
          animated_images_enabled: (form as any).enable_animated_images,
          collapse_bot_comments: form.collapse_bot_comments,
          show_score: (form as any).show_scores,
          show_upvotes: form.show_upvotes,
          show_downvotes: (form as any).show_downvotes as any,
          show_upvote_percentage: form.show_upvote_percentage,
        } as any),
      )
    },

    async changePassword(form) {
      return await call(
        client.changePassword({
          new_password: form.new_password as any,
          new_password_verify: form.new_password_verify as any,
          old_password: form.old_password as any,
        }),
      )
    },

    async getReportCount(form) {
      const res: any = await call(client.getUnreadCounts())
      return {
        community_id: form.community_id,
        comment_reports: 0,
        post_reports: res.report_count ?? 0,
        private_message_reports: 0,
      }
    },

    async getUnreadCount() {
      const res: any = await call(client.getUnreadCounts())
      // v4 only returns a single combined notification_count
      return {
        replies: res.notification_count ?? 0,
        mentions: 0,
        private_messages: 0,
      }
    },

    async verifyEmail(form) {
      return await call(client.verifyEmail(form))
    },

    async addAdmin(form) {
      const res: any = await call(client.addAdmin(form))
      return { admins: (res.admins ?? []).map(t.toV3PersonView) }
    },

    async getUnreadRegistrationApplicationCount() {
      const res: any = await call(client.getUnreadCounts())
      return { registration_applications: res.registration_application_count ?? 0 }
    },

    async listRegistrationApplications(form) {
      const res: any = await call(
        client.listRegistrationApplications({
          unread_only: form.unread_only,
          limit: form.limit,
        } as any),
      )
      return {
        registration_applications: (res.items ?? []).map((r: any) => ({
          registration_application: {
            id: r.registration_application.id,
            local_user_id: r.registration_application.local_user_id,
            answer: r.registration_application.answer,
            admin_id: r.registration_application.admin_id,
            deny_reason: r.registration_application.deny_reason,
            published: r.registration_application.published_at,
          },
          creator_local_user: r.creator_local_user,
          creator: t.toV3Person(r.creator),
          admin: r.admin ? t.toV3Person(r.admin) : undefined,
        })),
      }
    },

    async approveRegistrationApplication(form) {
      const res: any = await call(client.approveRegistrationApplication(form))
      return {
        registration_application: {
          registration_application: {
            id: res.registration_application.registration_application.id,
            local_user_id:
              res.registration_application.registration_application.local_user_id,
            answer: res.registration_application.registration_application.answer,
            admin_id: res.registration_application.registration_application.admin_id,
            deny_reason:
              res.registration_application.registration_application.deny_reason,
            published:
              res.registration_application.registration_application.published_at,
          },
          creator_local_user: res.registration_application.creator_local_user,
          creator: t.toV3Person(res.registration_application.creator),
          admin: res.registration_application.admin
            ? t.toV3Person(res.registration_application.admin)
            : undefined,
        },
      } as any
    },

    async getRegistrationApplication(form) {
      const res: any = await call(client.getRegistrationApplication(form))
      return {
        registration_application: {
          registration_application: {
            id: res.registration_application.registration_application.id,
            local_user_id:
              res.registration_application.registration_application.local_user_id,
            answer: res.registration_application.registration_application.answer,
            admin_id: res.registration_application.registration_application.admin_id,
            deny_reason:
              res.registration_application.registration_application.deny_reason,
            published:
              res.registration_application.registration_application.published_at,
          },
          creator_local_user: res.registration_application.creator_local_user,
          creator: t.toV3Person(res.registration_application.creator),
          admin: res.registration_application.admin
            ? t.toV3Person(res.registration_application.admin)
            : undefined,
        },
      } as any
    },

    async purgePerson(form) {
      return await call(client.purgePerson(form as any))
    },

    async purgeCommunity(form) {
      return await call(client.purgeCommunity(form as any))
    },

    async purgePost(form) {
      return await call(client.purgePost(form as any))
    },

    async purgeComment(form) {
      return await call(client.purgeComment(form as any))
    },

    async getFederatedInstances() {
      // v4 makes you choose a kind & paginate; emulate the v3 grouped shape
      // by issuing the three requests in parallel.
      const [linked, allowed, blocked] = await Promise.all([
        call<any>(client.getFederatedInstances({ kind: 'linked' } as any)),
        call<any>(client.getFederatedInstances({ kind: 'allowed' } as any)).catch(
          () => ({ items: [] }),
        ),
        call<any>(client.getFederatedInstances({ kind: 'blocked' } as any)).catch(
          () => ({ items: [] }),
        ),
      ])
      const mapInst = (v: any) => ({
        id: v.instance.id,
        domain: v.instance.domain,
        published: v.instance.published_at,
        updated: v.instance.updated_at,
        software: v.instance.software,
        version: v.instance.version,
        federation_state: undefined,
      })
      return {
        federated_instances: {
          linked: (linked.items ?? []).map(mapInst),
          allowed: (allowed.items ?? []).map(mapInst),
          blocked: (blocked.items ?? []).map(mapInst),
        },
      } as any
    },

    async blockInstance(form) {
      await call(
        client.userBlockInstanceCommunities({
          instance_id: form.instance_id,
          block: form.block,
        }),
      )
      return { blocked: form.block }
    },

    async uploadImage(form) {
      const res: any = await call(
        client.uploadImage({ image: (form as any).image }),
      )
      return {
        msg: 'ok',
        files: [{ file: res.filename, delete_token: '' }],
        url: res.image_url,
        delete_url: undefined,
      }
    },

    async deleteImage(form) {
      await call(
        client.deleteMedia({ filename: (form as any).filename } as any),
      )
      return true
    },

    async setNote(form) {
      await call(
        client.notePerson({
          person_id: form.person_id,
          note: form.note ?? '',
        }),
      )
      // The existing v3 UI just wants a PersonView back; refetch to surface the
      // updated note on `person_actions`.
      const res: any = await call(
        client.getPersonDetails({ person_id: form.person_id }),
      )
      return t.toV3PersonView(res.person_view)
    },

    async editCommunityNotifications(form) {
      return await call(
        client.editCommunityNotifications({
          community_id: form.community_id,
          mode: form.mode as any,
        }),
      )
    },
  }

  return new Proxy(overrides as BaseClient, {
    get: (target, prop, receiver) => {
      const value = Reflect.get(target, prop, receiver)
      if (value !== undefined) return value

      const clientValue = (client as any)[prop]
      if (typeof clientValue === 'function') return clientValue.bind(client)
      return clientValue
    },
  })
}

export class LemmyClient {
  static constants = LemmyClientConstants

  #proxy: BaseClient

  constructor(
    baseUrl: string,
    args: {
      fetchFunction: (input: any, init: any) => Promise<any>
      headers: any
    },
  ) {
    this.#proxy = createLemmyClient(baseUrl, args)

    return new Proxy(this, {
      get: (target, prop) => {
        if (prop === 'constructor') return LemmyClient
        return (target.#proxy as any)[prop]
      },
    }) as any
  }
}
