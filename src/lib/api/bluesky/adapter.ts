import { BskyAgent } from '@atproto/api'
import type { BaseClient, ClientType } from '../base'
import type * as types from '../types'

export class BlueskyClient implements BaseClient {
  type: ClientType = { name: 'bluesky', baseUrl: 'https://bsky.social' }

  static constants = { password: { minLength: 8, maxLength: 128 } }

  #agent: BskyAgent
  #authenticated = false
  #sessionData?: string
  // Map post ID to {uri, cid, likeUri} for tracking post metadata
  #postCache = new Map<number, { uri: string; cid: string; likeUri?: string }>()
  // Map comment ID to {uri, cid, likeUri} for tracking comment metadata
  #commentCache = new Map<number, { uri: string; cid: string; likeUri?: string }>()

  constructor(
    baseUrl: string = 'https://bsky.social',
    private options?: {
      identifier?: string
      password?: string
      fetchFunction?: (input: any, init: any) => Promise<any>
      headers?: any
    },
  ) {
    this.#agent = new BskyAgent({
      service: baseUrl,
    })

    // Store the session data from headers for later restoration
    if (options?.headers?.authorization) {
      this.#sessionData = options.headers.authorization.replace('Bearer ', '')
    }
  }

  async #restoreSession(sessionData: string) {
    try {
      // The sessionData might be a JSON string containing the full session
      let session: any

      try {
        session = JSON.parse(sessionData)
      } catch {
        // If it's not JSON, it might be just an access token (legacy)
        // We can't restore properly without refresh token
        console.warn('Bluesky session data is not valid JSON, cannot restore')
        return false
      }

      // Resume the session with the stored session data
      if (session.accessJwt && session.refreshJwt && session.did) {
        await this.#agent.resumeSession(session)
        this.#authenticated = true
        return true
      } else {
        console.warn('Bluesky session missing required fields (accessJwt, refreshJwt, did)')
        return false
      }
    } catch (error) {
      console.error('Failed to restore Bluesky session:', error)
      this.#authenticated = false
      return false
    }
  }

  async #ensureAuth() {
    // If we already have a valid session, we're good
    if (this.#authenticated && this.#agent.session) {
      return
    }

    // Try to restore from stored session data first
    if (this.#sessionData && !this.#authenticated) {
      const restored = await this.#restoreSession(this.#sessionData)
      if (restored) {
        return
      }
    }

    // Try to use stored credentials
    if (this.options?.identifier && this.options?.password) {
      await this.#agent.login({
        identifier: this.options.identifier,
        password: this.options.password,
      })
      this.#authenticated = true
      return
    }

    throw new Error('No Bluesky credentials available for authentication')
  }

  // Site methods - Bluesky doesn't have site-wide settings like Lemmy
  async getSite(): Promise<types.GetSiteResponse> {
    console.log('Bluesky getSite called')

    // Ensure we're authenticated before proceeding
    await this.#ensureAuth()

    const session = this.#agent.session

    if (!session) {
      console.error('No Bluesky session after ensureAuth')
      throw new Error('No Bluesky session available - login required')
    }

    console.log('Bluesky session valid, returning site data for:', session.handle)
    this.#authenticated = true

    return {
      site_view: {
        site: {
          id: 0,
          name: 'Bluesky',
          sidebar: undefined,
          published: '',
          updated: undefined,
          icon: undefined,
          banner: undefined,
          description: 'Social media as it should be',
          actor_id: 'https://bsky.social',
          last_refreshed_at: new Date().toISOString(),
          inbox_url: '',
          public_key: '',
          instance_id: 0,
        },
        local_site: {
          id: 0,
          site_id: 0,
          site_setup: true,
          enable_downvotes: false,
          enable_nsfw: true,
          community_creation_admin_only: false,
          require_email_verification: false,
          application_question: undefined,
          private_instance: false,
          default_theme: '',
          default_post_listing_type: 'Local',
          legal_information: undefined,
          hide_modlog_mod_names: false,
          application_email_admins: false,
          slur_filter_regex: undefined,
          actor_name_max_length: 20,
          federation_enabled: false,
          captcha_enabled: false,
          captcha_difficulty: '',
          published: '',
          updated: undefined,
          registration_mode: 'Closed',
          reports_email_admins: false,
        },
        local_site_rate_limit: {
          local_site_id: 0,
          message: 999,
          message_per_second: 999,
          post: 999,
          post_per_second: 999,
          register: 999,
          register_per_second: 999,
          image: 999,
          image_per_second: 999,
          comment: 999,
          comment_per_second: 999,
          search: 999,
          search_per_second: 999,
          published: '',
          updated: undefined,
        },
        counts: {
          site_id: 0,
          users: 0,
          posts: 0,
          comments: 0,
          communities: 0,
          users_active_day: 0,
          users_active_week: 0,
          users_active_month: 0,
          users_active_half_year: 0,
        },
      },
      admins: [],
      version: '0.1.0-bluesky',
      my_user: session ? ({
        local_user_view: {
          local_user: {
            id: 0,
            person_id: 0,
            email: undefined,
            show_nsfw: true,
            theme: '',
            default_sort_type: 'Hot',
            default_listing_type: 'Local',
            interface_language: 'en',
            show_avatars: true,
            send_notifications_to_email: false,
            validator_time: '',
            show_bot_accounts: true,
            show_scores: true,
            show_read_posts: true,
            email_verified: false,
            accepted_application: false,
            totp_2fa_url: undefined,
            open_links_in_new_tab: false,
            blur_nsfw: false,
            auto_expand: false,
            infinite_scroll_enabled: false,
            admin: false,
            post_listing_mode: 'List',
          },
          person: {
            id: 0,
            name: session.handle,
            display_name: session.handle,
            avatar: undefined,
            banned: false,
            published: '',
            updated: undefined,
            actor_id: session.did,
            bio: undefined,
            local: true,
            banner: undefined,
            deleted: false,
            inbox_url: '',
            matrix_user_id: undefined,
            admin: false,
            bot_account: false,
            ban_expires: undefined,
            instance_id: 0,
          },
          counts: {
            id: 0,
            person_id: 0,
            post_count: 0,
            post_score: 0,
            comment_count: 0,
            comment_score: 0,
          },
        },
        follows: [],
        moderates: [],
        community_blocks: [],
        person_blocks: [],
        instance_blocks: [],
        discussion_languages: [],
      } as unknown as types.MyUserInfo) : undefined,
      all_languages: [],
      discussion_languages: [],
      taglines: [],
      custom_emojis: [],
      blocked_urls: [],
    }
  }

  async editSite(form: types.EditSite): Promise<types.SiteResponse> {
    throw new Error('Bluesky does not support site editing')
  }

  async generateTotpSecret(): Promise<types.GenerateTotpSecretResponse> {
    throw new Error('Bluesky does not support TOTP')
  }

  async listLogins(): Promise<types.LoginToken[]> {
    throw new Error('Bluesky does not support login token listing')
  }

  async listAllMedia(form: types.ListMedia): Promise<types.ListMediaResponse> {
    throw new Error('Bluesky media listing not implemented')
  }

  async updateTotp(form: types.UpdateTotp): Promise<types.UpdateTotpResponse> {
    throw new Error('Bluesky does not support TOTP')
  }

  async getModlog(form: types.GetModlog): Promise<types.GetModlogResponse> {
    throw new Error('Bluesky does not have modlog')
  }

  // Search
  async search(form: types.Search): Promise<types.SearchResponse> {
    await this.#ensureAuth()

    const searchType = form.type_ || 'All'
    let posts: any[] = []
    let users: types.PersonView[] = []

    // Search for posts
    if (searchType === 'All' || searchType === 'Posts') {
      try {
        const postResults = await this.#agent.app.bsky.feed.searchPosts({
          q: form.q || '',
          limit: form.limit,
        })
        posts = postResults.data.posts.map(post => this.#mapPostToPostView(post))
      } catch (error) {
        console.error('Bluesky post search error:', error)
      }
    }

    // Search for users
    if (searchType === 'All' || searchType === 'Users') {
      try {
        const userResults = await this.#agent.searchActors({
          q: form.q || '',
          limit: form.limit || 20,
        })

        users = userResults.data.actors.map(actor => ({
          person: {
            id: 0,
            name: actor.handle,
            display_name: actor.displayName,
            avatar: actor.avatar,
            banned: false,
            published: '',
            updated: undefined,
            actor_id: `https://bsky.app/profile/${actor.handle}`,
            bio: actor.description,
            local: false,
            banner: actor.banner,
            deleted: false,
            matrix_user_id: undefined,
            bot_account: false,
            ban_expires: undefined,
            instance_id: 0,
          },
          counts: {
            person_id: 0,
            post_count: 0,
            comment_count: 0,
          },
          is_admin: false,
        }))
      } catch (error) {
        console.error('Bluesky user search error:', error)
      }
    }

    // Map to Lemmy-like structure
    return {
      type_: searchType,
      comments: [],
      posts: posts,
      communities: [],
      users: users,
    }
  }

  async resolveObject(form: types.ResolveObject): Promise<types.ResolveObjectResponse> {
    throw new Error('Bluesky resolve not implemented')
  }

  // Community methods - Bluesky doesn't have communities, but we can use lists or feeds
  async createCommunity(form: types.CreateCommunity): Promise<types.CommunityResponse> {
    throw new Error('Bluesky does not have communities')
  }

  async getCommunity(form: types.GetCommunity): Promise<types.GetCommunityResponse> {
    throw new Error('Bluesky does not have communities')
  }

  async editCommunity(form: types.EditCommunity): Promise<types.CommunityResponse> {
    throw new Error('Bluesky does not have communities')
  }

  async listCommunities(form: types.ListCommunities): Promise<types.ListCommunitiesResponse> {
    // Could map to Bluesky feeds/lists in the future
    return { communities: [] }
  }

  async followCommunity(form: types.FollowCommunity): Promise<types.CommunityResponse> {
    throw new Error('Bluesky does not have communities')
  }

  async blockCommunity(form: types.BlockCommunity): Promise<types.BlockCommunityResponse> {
    throw new Error('Bluesky does not have communities')
  }

  async deleteCommunity(form: types.DeleteCommunity): Promise<types.CommunityResponse> {
    throw new Error('Bluesky does not have communities')
  }

  async hideCommunity(form: types.HideCommunity): Promise<types.SuccessResponse> {
    throw new Error('Bluesky does not have communities')
  }

  async removeCommunity(form: types.RemoveCommunity): Promise<types.CommunityResponse> {
    throw new Error('Bluesky does not have communities')
  }

  async banFromCommunity(form: types.BanFromCommunity): Promise<types.BanFromCommunityResponse> {
    throw new Error('Bluesky does not have communities')
  }

  async addModToCommunity(form: types.AddModToCommunity): Promise<types.AddModToCommunityResponse> {
    throw new Error('Bluesky does not have communities')
  }

  // Post methods
  async createPost(form: types.CreatePost): Promise<types.PostResponse> {
    await this.#ensureAuth()

    // For Bluesky, just use body (title is auto-generated from body anyway)
    // If there's no body, fall back to name
    let text = form.body || form.name

    const record: any = {
      $type: 'app.bsky.feed.post',
      text: text,
      createdAt: new Date().toISOString(),
    }

    // Priority: images > URL > no embed
    // Check if there are uploaded images (stored as blob refs)
    const imageUrls = (form as any).image_urls
    if (imageUrls && imageUrls.length > 0) {
      // Add images as embed
      const images = imageUrls.map((url: string) => {
        // If it's a blob ref from our uploadImage, parse it
        return {
          alt: '',
          image: {
            $type: 'blob',
            ref: { $link: url },
            mimeType: 'image/jpeg',
            size: 0,
          },
        }
      })

      record.embed = {
        $type: 'app.bsky.embed.images',
        images: images,
      }
    } else if (form.url) {
      // Add URL as embed if provided and no images
      try {
        const urlObj = new URL(form.url)
        record.embed = {
          $type: 'app.bsky.embed.external',
          external: {
            uri: form.url,
            title: form.name,
            description: form.body || '',
          },
        }
      } catch (e) {
        // Invalid URL, just include in text
      }
    }

    const result = await this.#agent.post(record)

    const session = this.#agent.session

    // Return in Lemmy format - this is a simplified mapping
    return {
      post_view: {
        post: {
          id: 0,
          name: form.name,
          body: form.body,
          url: form.url,
          creator_id: 0,
          community_id: 0,
          removed: false,
          locked: false,
          published: new Date().toISOString(),
          updated: undefined,
          deleted: false,
          nsfw: form.nsfw || false,
          ap_id: result.uri && session?.handle
            ? `https://bsky.app/profile/${session.handle}/post/${result.uri.split('/').pop()}`
            : 'https://bsky.app',
          local: true,
          language_id: 0,
          featured_community: false,
          featured_local: false,
        },
        creator: {
          id: 0,
          name: session?.handle || '',
          display_name: session?.handle || undefined,
          avatar: undefined,
          banned: false,
          published: '',
          updated: undefined,
          actor_id: session?.handle
            ? `https://bsky.app/profile/${session.handle}`
            : 'https://bsky.app',
          bio: undefined,
          local: true,
          banner: undefined,
          deleted: false,
          matrix_user_id: undefined,
          bot_account: false,
          ban_expires: undefined,
          instance_id: 0,
        },
        community: {
          id: 0,
          name: 'bluesky',
          title: 'Bluesky',
          description: undefined,
          removed: false,
          published: '',
          updated: undefined,
          deleted: false,
          nsfw: false,
          actor_id: 'https://bsky.app',
          local: true,
          icon: undefined,
          banner: undefined,
          hidden: false,
          posting_restricted_to_mods: false,
          instance_id: 0,
          visibility: 'Public',
        },
        counts: {
          post_id: 0,
          comments: 0,
          score: 0,
          upvotes: 0,
          downvotes: 0,
          published: new Date().toISOString(),
          newest_comment_time: new Date().toISOString(),
        },
        subscribed: 'NotSubscribed',
        saved: false,
        read: false,
        creator_blocked: false,
        my_vote: undefined,
        creator_banned_from_community: false,
        banned_from_community: false,
        creator_is_moderator: false,
        creator_is_admin: false,
        hidden: false,
        unread_comments: 0,
      },
    }
  }

  async getPost(form: types.GetPost): Promise<types.GetPostResponse> {
    await this.#ensureAuth()

    try {
      // For Bluesky, we need the post URI
      // The ID is hashed, so we can't reverse it
      // Instead, try to fetch from the timeline and find it
      // This is not ideal but works for now

      console.log('Bluesky getPost called with ID:', form.id)

      // Fetch recent timeline to try to find the post
      const timeline = await this.#agent.getTimeline({ limit: 50 })

      // Try to find the post by matching the hashed ID
      const post = timeline.data.feed.find(item => {
        const rkey = item.post.uri ? item.post.uri.split('/').pop() : ''
        const hashId = rkey ? Math.abs(rkey.split('').reduce((acc: number, char: string) => {
          acc = ((acc << 5) - acc) + char.charCodeAt(0)
          return acc & acc
        }, 0)) : 0
        return hashId === form.id
      })

      if (!post) {
        throw new Error('Post not found in recent timeline')
      }

      return {
        post_view: this.#mapPostToPostView(post.post),
        community_view: {
          community: {
            id: 0,
            name: 'bluesky',
            title: 'Bluesky',
            description: undefined,
            removed: false,
            published: '',
            updated: undefined,
            deleted: false,
            nsfw: false,
            actor_id: 'https://bsky.app',
            local: false,
            icon: undefined,
            banner: undefined,
            hidden: false,
            posting_restricted_to_mods: false,
            instance_id: 0,
            visibility: 'Public',
          },
          subscribed: 'NotSubscribed',
          blocked: false,
          banned_from_community: false,
          counts: {
            community_id: 0,
            subscribers: 0,
            posts: 0,
            comments: 0,
            published: '',
            users_active_day: 0,
            users_active_week: 0,
            users_active_month: 0,
            users_active_half_year: 0,
            subscribers_local: 0,
          },
        },
        moderators: [],
        cross_posts: [],
      }
    } catch (error) {
      console.error('Bluesky getPost error:', error)
      throw error
    }
  }

  async editPost(form: types.EditPost): Promise<types.PostResponse> {
    throw new Error('Bluesky does not support post editing in the same way')
  }

  async deletePost(form: types.DeletePost): Promise<types.PostResponse> {
    await this.#ensureAuth()

    const cached = this.#postCache.get(form.post_id)
    if (!cached) {
      throw new Error('Post not found in cache - please refresh the page')
    }

    try {
      // Delete the post using AT Protocol
      await this.#agent.deletePost(cached.uri)

      // Remove from cache
      this.#postCache.delete(form.post_id)

      // Return a minimal response indicating success
      const deletedPost: types.PostView = {
        post: {
          id: form.post_id,
          name: '',
          body: undefined,
          creator_id: 0,
          community_id: 0,
          removed: false,
          locked: false,
          published: new Date().toISOString(),
          updated: undefined,
          deleted: true,
          nsfw: false,
          ap_id: '',
          local: false,
          language_id: 0,
          featured_community: false,
          featured_local: false,
        },
        creator: {
          id: 0,
          name: '',
          display_name: undefined,
          avatar: undefined,
          banned: false,
          published: '',
          updated: undefined,
          actor_id: '',
          bio: undefined,
          local: false,
          banner: undefined,
          deleted: false,
          matrix_user_id: undefined,
          bot_account: false,
          ban_expires: undefined,
          instance_id: 0,
        },
        community: {
          id: 0,
          name: 'bluesky',
          title: 'Bluesky',
          description: undefined,
          removed: false,
          published: '',
          updated: undefined,
          deleted: false,
          nsfw: false,
          actor_id: 'https://bsky.app',
          local: false,
          icon: undefined,
          banner: undefined,
          hidden: false,
          posting_restricted_to_mods: false,
          instance_id: 0,
          visibility: 'Public',
        },
        counts: {
          post_id: 0,
          comments: 0,
          score: 0,
          upvotes: 0,
          downvotes: 0,
          published: new Date().toISOString(),
          newest_comment_time: new Date().toISOString(),
        },
        subscribed: 'NotSubscribed',
        saved: false,
        read: false,
        creator_blocked: false,
        my_vote: undefined,
        creator_banned_from_community: false,
        banned_from_community: false,
        creator_is_moderator: false,
        creator_is_admin: false,
        hidden: false,
        unread_comments: 0,
      }

      return {
        post_view: deletedPost,
      }
    } catch (error) {
      console.error('Bluesky deletePost error:', error)
      throw error
    }
  }

  async removePost(form: types.RemovePost): Promise<types.PostResponse> {
    throw new Error('Bluesky does not have moderation removal')
  }

  async markPostAsRead(form: types.MarkPostAsRead): Promise<types.SuccessResponse> {
    // Bluesky doesn't track read status
    return { success: true }
  }

  async hidePost(form: types.HidePost): Promise<types.SuccessResponse> {
    // Could implement via mute in the future
    return { success: true }
  }

  async lockPost(form: types.LockPost): Promise<types.PostResponse> {
    throw new Error('Bluesky does not support locking posts')
  }

  async featurePost(form: types.FeaturePost): Promise<types.PostResponse> {
    throw new Error('Bluesky does not support featuring posts')
  }

  async getPosts(form: types.GetPosts): Promise<types.GetPostsResponse> {
    console.log('Bluesky getPosts called with:', form)

    try {
      await this.#ensureAuth()

      // Support pagination with cursor
      const cursor = form.page_cursor

      // Map Lemmy listing types to Bluesky feeds:
      // - "Subscribed" -> Following timeline (people you follow)
      // - "All" or "Local" or default -> Discover feed (public posts)
      const listingType = form.type_ || 'All'

      let feed: any

      if (listingType === 'Subscribed') {
        // Use Following timeline for subscribed content
        console.log('Bluesky fetching Following timeline with cursor:', cursor)
        feed = await this.#agent.getTimeline({
          limit: form.limit || 20,
          cursor: cursor || undefined,
        })
      } else {
        // Use Discover feed for All/Local/default
        // The "What's Hot" feed is Bluesky's discover feed
        console.log('Bluesky fetching Discover feed with cursor:', cursor)
        feed = await this.#agent.app.bsky.feed.getFeed({
          feed: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
          limit: form.limit || 20,
          cursor: cursor || undefined,
        })
      }

      console.log('Bluesky feed fetched, posts:', feed.data.feed.length)

      const posts = feed.data.feed.map((item: any) => this.#mapPostToPostView(item.post))

      return {
        posts: posts,
        next_page: feed.data.cursor,
      }
    } catch (error) {
      console.error('Bluesky getPosts error:', error)
      throw error
    }
  }

  async likePost(form: types.CreatePostLike): Promise<types.PostResponse> {
    await this.#ensureAuth()

    // Try to get from cache first
    let cached = this.#postCache.get(form.post_id)

    // If not in cache, try to find it in the timeline
    if (!cached) {
      console.log('Post not in cache, fetching from timeline...')
      try {
        // Fetch recent timeline to find the post
        const timeline = await this.#agent.getTimeline({ limit: 50 })
        const foundPost = timeline.data.feed.find(item => {
          const rkey = item.post.uri ? item.post.uri.split('/').pop() : ''
          const hashId = rkey ? Math.abs(rkey.split('').reduce((acc: number, char: string) => {
            acc = ((acc << 5) - acc) + char.charCodeAt(0)
            return acc & acc
          }, 0)) : 0
          return hashId === form.post_id
        })

        if (foundPost && foundPost.post.uri && foundPost.post.cid) {
          // Add to cache
          cached = {
            uri: foundPost.post.uri,
            cid: foundPost.post.cid,
            likeUri: foundPost.post.viewer?.like
          }
          this.#postCache.set(form.post_id, cached)
        }
      } catch (e) {
        console.error('Failed to fetch post from timeline:', e)
      }
    }

    if (!cached) {
      throw new Error('Post not found - it may be too old or from a different feed')
    }

    try {
      if (form.score === 1) {
        // Like the post
        const result = await this.#agent.like(cached.uri, cached.cid)
        // Store the like URI for later unliking
        cached.likeUri = result.uri
        this.#postCache.set(form.post_id, cached)
      } else if (form.score === -1) {
        // Unlike - delete the like record
        if (cached.likeUri) {
          await this.#agent.deleteLike(cached.likeUri)
          cached.likeUri = undefined
          this.#postCache.set(form.post_id, cached)
        }
      }

      // Fetch the updated post to return current state
      const updatedPost = await this.getPost({ id: form.post_id })
      return updatedPost
    } catch (error) {
      console.error('Bluesky like error:', error)
      throw error
    }
  }

  async listPostLikes(form: types.ListPostLikes): Promise<types.ListPostLikesResponse> {
    throw new Error('Bluesky does not support listing post likes in the same way')
  }

  async savePost(form: types.SavePost): Promise<types.PostResponse> {
    // Bluesky doesn't have native saving, could use lists
    throw new Error('Bluesky savePost not implemented')
  }

  async createPostReport(form: types.CreatePostReport): Promise<types.PostReportResponse> {
    await this.#ensureAuth()

    try {
      const cached = this.#postCache.get(form.post_id)
      if (!cached) {
        throw new Error('Post not found in cache - please refresh the page')
      }

      // Create a report using Bluesky's moderation API
      await this.#agent.com.atproto.moderation.createReport({
        reasonType: 'com.atproto.moderation.defs#reasonOther',
        reason: form.reason,
        subject: {
          $type: 'com.atproto.repo.strongRef',
          uri: cached.uri,
          cid: cached.cid,
        },
      })

      // Return a minimal report response
      return {
        post_report_view: {
          creator_is_moderator: false,
          creator_is_admin: false,
          subscribed: 'NotSubscribed',
          saved: false,
          read: false,
          hidden: false,
          creator_blocked: false,
          my_vote: undefined,
          unread_comments: 0,
          post_report: {
            id: 0,
            creator_id: 0,
            post_id: form.post_id,
            original_post_name: '',
            original_post_url: undefined,
            original_post_body: undefined,
            reason: form.reason,
            resolved: false,
            resolver_id: undefined,
            published: new Date().toISOString(),
            updated: undefined,
          },
          post: {
            id: form.post_id,
            name: '',
            body: undefined,
            creator_id: 0,
            community_id: 0,
            removed: false,
            locked: false,
            published: new Date().toISOString(),
            updated: undefined,
            deleted: false,
            nsfw: false,
            ap_id: cached.uri,
            local: false,
            language_id: 0,
            featured_community: false,
            featured_local: false,
          },
          community: {
            id: 0,
            name: 'bluesky',
            title: 'Bluesky',
            description: undefined,
            removed: false,
            published: '',
            updated: undefined,
            deleted: false,
            nsfw: false,
            actor_id: 'https://bsky.app',
            local: false,
            icon: undefined,
            banner: undefined,
            hidden: false,
            posting_restricted_to_mods: false,
            instance_id: 0,
            visibility: 'Public',
          },
          creator: {
            id: 0,
            name: '',
            display_name: undefined,
            avatar: undefined,
            banned: false,
            published: '',
            updated: undefined,
            actor_id: '',
            bio: undefined,
            local: false,
            banner: undefined,
            deleted: false,
            matrix_user_id: undefined,
            bot_account: false,
            ban_expires: undefined,
            instance_id: 0,
          },
          post_creator: {
            id: 0,
            name: '',
            display_name: undefined,
            avatar: undefined,
            banned: false,
            published: '',
            updated: undefined,
            actor_id: '',
            bio: undefined,
            local: false,
            banner: undefined,
            deleted: false,
            matrix_user_id: undefined,
            bot_account: false,
            ban_expires: undefined,
            instance_id: 0,
          },
          creator_banned_from_community: false,
          resolver: undefined,
          counts: {
            post_id: form.post_id,
            comments: 0,
            score: 0,
            upvotes: 0,
            downvotes: 0,
            published: new Date().toISOString(),
            newest_comment_time: new Date().toISOString(),
          },
          my_vote: undefined,
        },
      }
    } catch (error) {
      console.error('Bluesky createPostReport error:', error)
      throw error
    }
  }

  async resolvePostReport(form: types.ResolvePostReport): Promise<types.PostReportResponse> {
    throw new Error('Bluesky does not have post report resolution')
  }

  async listPostReports(form: types.ListPostReports): Promise<types.ListPostReportsResponse> {
    throw new Error('Bluesky does not have post reports')
  }

  async getSiteMetadata(form: types.GetSiteMetadata): Promise<types.GetSiteMetadataResponse> {
    // Could implement URL preview fetching
    throw new Error('Bluesky metadata fetching not implemented')
  }

  // Comment methods
  async createComment(form: types.CreateComment): Promise<types.CommentResponse> {
    await this.#ensureAuth()

    try {
      let parentUri: string
      let parentCid: string
      let rootUri: string
      let rootCid: string

      if (form.parent_id) {
        // Replying to a comment - need to find parent comment URI
        // For now, we'll throw an error as we need comment URI tracking
        throw new Error('Replying to comments not yet fully supported - please reply to the main post')
      }

      // Replying to a post
      const cached = this.#postCache.get(form.post_id)
      if (!cached) {
        throw new Error('Post not found in cache - please refresh the page')
      }

      parentUri = cached.uri
      parentCid = cached.cid
      rootUri = cached.uri
      rootCid = cached.cid

      // Create the reply
      const result = await this.#agent.post({
        text: form.content,
        reply: {
          root: { uri: rootUri, cid: rootCid },
          parent: { uri: parentUri, cid: parentCid },
        },
      })

      // Generate ID for the new comment
      const rkey = result.uri.split('/').pop() || ''
      const commentId = rkey ? Math.abs(rkey.split('').reduce((a: number, b: string) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)) : 0

      // Return a comment view
      const session = this.#agent.session
      const comment: types.CommentView = {
        comment: {
          id: commentId,
          creator_id: 0,
          post_id: form.post_id,
          content: form.content,
          removed: false,
          published: new Date().toISOString(),
          updated: undefined,
          deleted: false,
          ap_id: result.uri,
          local: false,
          path: `0.${commentId}`,
          distinguished: false,
          language_id: 0,
        },
        creator: {
          id: 0,
          name: session?.handle || '',
          display_name: session?.handle || undefined,
          avatar: undefined,
          banned: false,
          published: '',
          updated: undefined,
          actor_id: session?.handle ? `https://bsky.app/profile/${session.handle}` : '',
          bio: undefined,
          local: false,
          banner: undefined,
          deleted: false,
          matrix_user_id: undefined,
          bot_account: false,
          ban_expires: undefined,
          instance_id: 0,
        },
        community: {
          id: 0,
          name: 'bluesky',
          title: 'Bluesky',
          description: undefined,
          removed: false,
          published: '',
          updated: undefined,
          deleted: false,
          nsfw: false,
          actor_id: 'https://bsky.app',
          local: false,
          icon: undefined,
          banner: undefined,
          hidden: false,
          posting_restricted_to_mods: false,
          instance_id: 0,
          visibility: 'Public',
        },
        post: {
          id: form.post_id,
          name: '',
          body: undefined,
          creator_id: 0,
          community_id: 0,
          removed: false,
          locked: false,
          published: new Date().toISOString(),
          updated: undefined,
          deleted: false,
          nsfw: false,
          ap_id: '',
          local: false,
          language_id: 0,
          featured_community: false,
          featured_local: false,
        },
        counts: {
          comment_id: commentId,
          score: 0,
          upvotes: 0,
          downvotes: 0,
          published: new Date().toISOString(),
          child_count: 0,
        },
        subscribed: 'NotSubscribed',
        saved: false,
        creator_blocked: false,
        creator_banned_from_community: false,
        banned_from_community: false,
        creator_is_moderator: false,
        creator_is_admin: false,
        my_vote: undefined,
      }

      return {
        comment_view: comment,
        recipient_ids: [],
      }
    } catch (error) {
      console.error('Bluesky createComment error:', error)
      throw error
    }
  }

  async editComment(form: types.EditComment): Promise<types.CommentResponse> {
    throw new Error('Bluesky does not support comment editing')
  }

  async deleteComment(form: types.DeleteComment): Promise<types.CommentResponse> {
    throw new Error('Bluesky deleteComment not implemented')
  }

  async removeComment(form: types.RemoveComment): Promise<types.CommentResponse> {
    throw new Error('Bluesky does not have comment removal')
  }

  async markCommentReplyAsRead(form: types.MarkCommentReplyAsRead): Promise<types.CommentReplyResponse | void> {
    // Bluesky doesn't track read status
  }

  async likeComment(form: types.CreateCommentLike): Promise<types.CommentResponse> {
    await this.#ensureAuth()

    const cached = this.#commentCache.get(form.comment_id)
    if (!cached) {
      throw new Error('Comment not found in cache - please refresh the page')
    }

    try {
      if (form.score === 1) {
        // Like the comment
        const result = await this.#agent.like(cached.uri, cached.cid)
        cached.likeUri = result.uri
        this.#commentCache.set(form.comment_id, cached)
      } else if (form.score === -1) {
        // Unlike
        if (cached.likeUri) {
          await this.#agent.deleteLike(cached.likeUri)
          cached.likeUri = undefined
          this.#commentCache.set(form.comment_id, cached)
        }
      }

      // Return a minimal comment response
      // Note: In a real implementation, we'd refetch the comment to get updated counts
      const session = this.#agent.session
      return {
        comment_view: {
          comment: {
            id: form.comment_id,
            creator_id: 0,
            post_id: 0,
            content: '',
            removed: false,
            published: new Date().toISOString(),
            updated: undefined,
            deleted: false,
            ap_id: cached.uri,
            local: false,
            path: '0',
            distinguished: false,
            language_id: 0,
          },
          creator: {
            id: 0,
            name: session?.handle || '',
            display_name: undefined,
            avatar: undefined,
            banned: false,
            published: '',
            updated: undefined,
            actor_id: '',
            bio: undefined,
            local: false,
            banner: undefined,
            deleted: false,
            matrix_user_id: undefined,
            bot_account: false,
            ban_expires: undefined,
            instance_id: 0,
          },
          community: {
            id: 0,
            name: 'bluesky',
            title: 'Bluesky',
            description: undefined,
            removed: false,
            published: '',
            updated: undefined,
            deleted: false,
            nsfw: false,
            actor_id: 'https://bsky.app',
            local: false,
            icon: undefined,
            banner: undefined,
            hidden: false,
            posting_restricted_to_mods: false,
            instance_id: 0,
            visibility: 'Public',
          },
          post: {
            id: 0,
            name: '',
            body: undefined,
            creator_id: 0,
            community_id: 0,
            removed: false,
            locked: false,
            published: new Date().toISOString(),
            updated: undefined,
            deleted: false,
            nsfw: false,
            ap_id: '',
            local: false,
            language_id: 0,
            featured_community: false,
            featured_local: false,
          },
          counts: {
            comment_id: form.comment_id,
            score: cached.likeUri ? 1 : 0,
            upvotes: cached.likeUri ? 1 : 0,
            downvotes: 0,
            published: new Date().toISOString(),
            child_count: 0,
          },
          subscribed: 'NotSubscribed',
          saved: false,
          creator_blocked: false,
          creator_banned_from_community: false,
          banned_from_community: false,
          creator_is_moderator: false,
          creator_is_admin: false,
          my_vote: cached.likeUri ? 1 : undefined,
        },
      }
    } catch (error) {
      console.error('Bluesky likeComment error:', error)
      throw error
    }
  }

  async listCommentLikes(form: types.ListCommentLikes): Promise<types.ListCommentLikesResponse> {
    throw new Error('Bluesky does not support listing comment likes')
  }

  async saveComment(form: types.SaveComment): Promise<types.CommentResponse> {
    throw new Error('Bluesky does not support saving comments')
  }

  async distinguishComment(form: types.DistinguishComment): Promise<types.CommentResponse> {
    throw new Error('Bluesky does not support distinguishing comments')
  }

  async getComments(form: types.GetComments): Promise<types.GetCommentsResponse> {
    await this.#ensureAuth()

    try {
      // Get the post URI from cache
      const cached = this.#postCache.get(form.post_id!)
      if (!cached) {
        console.warn('Post not in cache, returning empty comments')
        return { comments: [] }
      }

      // Fetch the post thread
      const thread = await this.#agent.getPostThread({
        uri: cached.uri,
        depth: 10, // Fetch nested replies
      })

      if (!thread.success || !('replies' in thread.data.thread)) {
        return { comments: [] }
      }

      // Map replies to CommentView
      const comments = this.#mapThreadToComments(thread.data.thread, [])

      return { comments }
    } catch (error) {
      console.error('Bluesky getComments error:', error)
      return { comments: [] }
    }
  }

  #mapThreadToComments(thread: any, path: number[]): types.CommentView[] {
    const comments: types.CommentView[] = []

    // Skip if not a valid thread post
    if (!thread || thread.$type === 'app.bsky.feed.defs#notFoundPost' || thread.$type === 'app.bsky.feed.defs#blockedPost') {
      return comments
    }

    // Process replies if they exist
    if (thread.replies && Array.isArray(thread.replies)) {
      for (let i = 0; i < thread.replies.length; i++) {
        const reply = thread.replies[i]

        if (reply.$type === 'app.bsky.feed.defs#notFoundPost' || reply.$type === 'app.bsky.feed.defs#blockedPost') {
          continue
        }

        const post = reply.post
        if (!post) continue

        const rkey = post.uri ? post.uri.split('/').pop() : ''
        const commentId = rkey ? Math.abs(rkey.split('').reduce((a: number, b: string) => {
          a = ((a << 5) - a) + b.charCodeAt(0)
          return a & a
        }, 0)) : i

        // Cache comment URI and CID for liking/etc
        if (post.uri && post.cid) {
          this.#commentCache.set(commentId, {
            uri: post.uri,
            cid: post.cid,
            likeUri: post.viewer?.like
          })
        }

        const currentPath = [...path, commentId]

        const comment: types.CommentView = {
          comment: {
            id: commentId,
            creator_id: 0,
            post_id: 0,
            content: post.record?.text || '',
            removed: false,
            published: post.record?.createdAt || new Date().toISOString(),
            updated: undefined,
            deleted: false,
            ap_id: post.uri || '',
            local: false,
            path: currentPath.join('.'),
            distinguished: false,
            language_id: 0,
          },
          creator: {
            id: 0,
            name: post.author?.handle || '',
            display_name: post.author?.displayName || undefined,
            avatar: post.author?.avatar || undefined,
            banned: false,
            published: '',
            updated: undefined,
            actor_id: post.author?.handle ? `https://bsky.app/profile/${post.author.handle}` : '',
            bio: post.author?.description || undefined,
            local: false,
            banner: post.author?.banner || undefined,
            deleted: false,
            matrix_user_id: undefined,
            bot_account: false,
            ban_expires: undefined,
            instance_id: 0,
          },
          community: {
            id: 0,
            name: 'bluesky',
            title: 'Bluesky',
            description: undefined,
            removed: false,
            published: '',
            updated: undefined,
            deleted: false,
            nsfw: false,
            actor_id: 'https://bsky.app',
            local: false,
            icon: undefined,
            banner: undefined,
            hidden: false,
            posting_restricted_to_mods: false,
            instance_id: 0,
            visibility: 'Public',
          },
          post: {
            id: 0,
            name: '',
            body: undefined,
            creator_id: 0,
            community_id: 0,
            removed: false,
            locked: false,
            published: new Date().toISOString(),
            updated: undefined,
            deleted: false,
            nsfw: false,
            ap_id: '',
            local: false,
            language_id: 0,
            featured_community: false,
            featured_local: false,
          },
          counts: {
            comment_id: commentId,
            score: (post.likeCount || 0),
            upvotes: post.likeCount || 0,
            downvotes: 0,
            published: post.record?.createdAt || new Date().toISOString(),
            child_count: reply.replies?.length || 0,
          },
          subscribed: 'NotSubscribed',
          saved: false,
          creator_blocked: false,
          creator_banned_from_community: false,
          banned_from_community: false,
          creator_is_moderator: false,
          creator_is_admin: false,
          my_vote: post.viewer?.like ? 1 : undefined,
        }

        comments.push(comment)

        // Recursively process nested replies
        if (reply.replies && reply.replies.length > 0) {
          const childComments = this.#mapThreadToComments(reply, currentPath)
          comments.push(...childComments)
        }
      }
    }

    return comments
  }

  async getComment(form: types.GetComment): Promise<types.CommentResponse> {
    throw new Error('Bluesky getComment not implemented')
  }

  async createCommentReport(form: types.CreateCommentReport): Promise<types.CommentReportResponse> {
    await this.#ensureAuth()

    try {
      const cached = this.#commentCache.get(form.comment_id)
      if (!cached) {
        throw new Error('Comment not found in cache - please refresh the page')
      }

      // Create a report using Bluesky's moderation API
      await this.#agent.com.atproto.moderation.createReport({
        reasonType: 'com.atproto.moderation.defs#reasonOther',
        reason: form.reason,
        subject: {
          $type: 'com.atproto.repo.strongRef',
          uri: cached.uri,
          cid: cached.cid,
        },
      })

      // Return a minimal report response
      return {
        comment_report_view: {
          creator_is_moderator: false,
          creator_is_admin: false,
          creator_blocked: false,
          subscribed: 'NotSubscribed',
          saved: false,
          comment_report: {
            id: 0,
            creator_id: 0,
            comment_id: form.comment_id,
            original_comment_text: '',
            reason: form.reason,
            resolved: false,
            resolver_id: undefined,
            published: new Date().toISOString(),
            updated: undefined,
          },
          comment: {
            id: form.comment_id,
            creator_id: 0,
            post_id: 0,
            content: '',
            removed: false,
            published: new Date().toISOString(),
            updated: undefined,
            deleted: false,
            ap_id: cached.uri,
            local: false,
            path: '0',
            distinguished: false,
            language_id: 0,
          },
          post: {
            id: 0,
            name: '',
            body: undefined,
            creator_id: 0,
            community_id: 0,
            removed: false,
            locked: false,
            published: new Date().toISOString(),
            updated: undefined,
            deleted: false,
            nsfw: false,
            ap_id: '',
            local: false,
            language_id: 0,
            featured_community: false,
            featured_local: false,
          },
          community: {
            id: 0,
            name: 'bluesky',
            title: 'Bluesky',
            description: undefined,
            removed: false,
            published: '',
            updated: undefined,
            deleted: false,
            nsfw: false,
            actor_id: 'https://bsky.app',
            local: false,
            icon: undefined,
            banner: undefined,
            hidden: false,
            posting_restricted_to_mods: false,
            instance_id: 0,
            visibility: 'Public',
          },
          creator: {
            id: 0,
            name: '',
            display_name: undefined,
            avatar: undefined,
            banned: false,
            published: '',
            updated: undefined,
            actor_id: '',
            bio: undefined,
            local: false,
            banner: undefined,
            deleted: false,
            matrix_user_id: undefined,
            bot_account: false,
            ban_expires: undefined,
            instance_id: 0,
          },
          comment_creator: {
            id: 0,
            name: '',
            display_name: undefined,
            avatar: undefined,
            banned: false,
            published: '',
            updated: undefined,
            actor_id: '',
            bio: undefined,
            local: false,
            banner: undefined,
            deleted: false,
            matrix_user_id: undefined,
            bot_account: false,
            ban_expires: undefined,
            instance_id: 0,
          },
          creator_banned_from_community: false,
          resolver: undefined,
          counts: {
            comment_id: form.comment_id,
            score: 0,
            upvotes: 0,
            downvotes: 0,
            published: new Date().toISOString(),
            child_count: 0,
          },
        },
      }
    } catch (error) {
      console.error('Bluesky createCommentReport error:', error)
      throw error
    }
  }

  async resolveCommentReport(form: types.ResolveCommentReport): Promise<types.CommentReportResponse> {
    throw new Error('Bluesky does not have comment report resolution')
  }

  async listCommentReports(form: types.ListCommentReports): Promise<types.ListCommentReportsResponse> {
    throw new Error('Bluesky does not have comment reports')
  }

  // Private message methods
  // Note: Bluesky doesn't have traditional DMs/private messages yet
  async getPrivateMessages(form: types.GetPrivateMessages): Promise<types.PrivateMessagesResponse> {
    // Return empty - Bluesky doesn't have DMs
    return {
      private_messages: []
    }
  }

  async createPrivateMessage(form: types.CreatePrivateMessage): Promise<types.PrivateMessageResponse> {
    throw new Error('Bluesky does not support private messages yet. DMs are not available on this platform.')
  }

  async editPrivateMessage(form: types.EditPrivateMessage): Promise<types.PrivateMessageResponse> {
    throw new Error('Bluesky does not support private messages')
  }

  async deletePrivateMessage(form: types.DeletePrivateMessage): Promise<types.PrivateMessageResponse> {
    throw new Error('Bluesky does not support private messages')
  }

  async markPrivateMessageAsRead(form: types.MarkPrivateMessageAsRead): Promise<types.PrivateMessageResponse> {
    // Silently succeed - no DMs to mark as read
    throw new Error('Bluesky does not support private messages')
  }

  async createPrivateMessageReport(form: types.CreatePrivateMessageReport): Promise<types.PrivateMessageReportResponse> {
    throw new Error('Bluesky does not support private messages')
  }

  async resolvePrivateMessageReport(form: types.ResolvePrivateMessageReport): Promise<types.PrivateMessageReportResponse> {
    throw new Error('Bluesky does not have message report resolution')
  }

  async listPrivateMessageReports(form: types.ListPrivateMessageReports): Promise<types.ListPrivateMessageReportsResponse> {
    return {
      private_message_reports: []
    }
  }

  // User/Person methods
  async register(form: types.Register): Promise<types.LoginResponse> {
    throw new Error('Bluesky registration not implemented - use bsky.app')
  }

  async login(form: types.Login): Promise<types.LoginResponse> {
    try {
      console.log('Attempting Bluesky login for:', form.username_or_email)

      await this.#agent.login({
        identifier: form.username_or_email,
        password: form.password,
      })

      if (!this.#agent.session) {
        throw new Error('Login succeeded but no session was created')
      }

      this.#authenticated = true

      // Store credentials for future requests
      this.options = {
        ...this.options,
        identifier: form.username_or_email,
        password: form.password,
      }

      // Store the entire session as JSON so we can restore it later
      // This includes both access and refresh tokens
      const sessionData = JSON.stringify(this.#agent.session)

      console.log('Bluesky login successful, session stored')

      return {
        jwt: sessionData,
        registration_created: false,
        verify_email_sent: false,
      }
    } catch (error: any) {
      console.error('Bluesky login error:', error)

      // Provide more specific error messages
      if (error.message?.includes('Invalid identifier or password')) {
        throw new Error('Invalid Bluesky handle or app password. Make sure you are using an app password (not your account password).')
      }

      throw new Error(`Bluesky login failed: ${error.message || error}`)
    }
  }

  async logout(): Promise<types.SuccessResponse> {
    this.#authenticated = false
    return { success: true }
  }

  async getPersonDetails(form: types.GetPersonDetails): Promise<types.GetPersonDetailsResponse> {
    console.log('Bluesky getPersonDetails called for:', form)
    await this.#ensureAuth()

    try {
      // Get the profile - form.username or person_id would be the handle
      // If person_id is 0 or not provided, and no username, use current user's handle
      let handle = form.username

      if (!handle && form.person_id && form.person_id !== 0) {
        handle = form.person_id.toString()
      }

      // If still no handle, use current user's session handle
      if (!handle) {
        const session = this.#agent.session
        if (session?.handle) {
          handle = session.handle
        } else {
          throw new Error('No handle provided for person details')
        }
      }

      const profile = await this.#agent.getProfile({ actor: handle })

      // Get the user's posts
      const feed = await this.#agent.getAuthorFeed({
        actor: handle,
        limit: form.limit || 20,
      })

      const profileUrl = `https://bsky.app/profile/${profile.data.handle}`

      return {
        person_view: {
          person: {
            id: 0,
            name: profile.data.handle,
            display_name: profile.data.displayName,
            avatar: profile.data.avatar,
            banned: false,
            published: profile.data.createdAt || '',
            updated: undefined,
            actor_id: profileUrl,
            bio: profile.data.description,
            local: false,
            banner: profile.data.banner,
            deleted: false,
            matrix_user_id: undefined,
            bot_account: false,
            ban_expires: undefined,
            instance_id: 0,
          },
          counts: {
            person_id: 0,
            post_count: profile.data.postsCount || 0,
            comment_count: 0,
          },
          is_admin: false,
        },
        posts: feed.data.feed.map(item => this.#mapPostToPostView(item.post)),
        comments: [],
        moderates: [],
      }
    } catch (error) {
      console.error('Bluesky getPersonDetails error:', error)
      throw error
    }
  }

  async getPersonMentions(form: types.GetPersonMentions): Promise<types.GetPersonMentionsResponse> {
    await this.#ensureAuth()

    try {
      const notifications = await this.#agent.listNotifications({
        limit: form.limit || 20,
      })

      const mentions = notifications.data.notifications
        .filter(notif => notif.reason === 'mention' || notif.reason === 'reply')
        .map(notif => {
          const post = notif.record as any
          const author = notif.author

          // Generate a comment/mention ID from the notification
          const rkey = notif.uri ? notif.uri.split('/').pop() : ''
          const mentionId = rkey ? Math.abs(rkey.split('').reduce((acc: number, char: string) => {
            acc = ((acc << 5) - acc) + char.charCodeAt(0)
            return acc & acc
          }, 0)) : 0

          return {
            recipient: {
              id: 0,
              name: '',
              display_name: undefined,
              avatar: undefined,
              banned: false,
              published: '',
              updated: undefined,
              actor_id: '',
              bio: undefined,
              local: false,
              banner: undefined,
              deleted: false,
              matrix_user_id: undefined,
              bot_account: false,
              ban_expires: undefined,
              instance_id: 0,
            },
            person_mention: {
              id: mentionId,
              recipient_id: 0,
              comment_id: mentionId,
              read: !notif.isRead,
              published: notif.indexedAt,
            },
            comment: {
              id: mentionId,
              creator_id: 0,
              post_id: 0,
              content: post.text || '',
              removed: false,
              published: notif.indexedAt,
              updated: undefined,
              deleted: false,
              ap_id: notif.uri,
              local: false,
              path: '0',
              distinguished: false,
              language_id: 0,
            },
            creator: {
              id: 0,
              name: author.handle,
              display_name: author.displayName,
              avatar: author.avatar,
              banned: false,
              published: '',
              updated: undefined,
              actor_id: `https://bsky.app/profile/${author.handle}`,
              bio: author.description,
              local: false,
              banner: author.banner,
              deleted: false,
              matrix_user_id: undefined,
              bot_account: false,
              ban_expires: undefined,
              instance_id: 0,
            },
            post: {
              id: 0,
              name: '',
              body: undefined,
              creator_id: 0,
              community_id: 0,
              removed: false,
              locked: false,
              published: notif.indexedAt,
              updated: undefined,
              deleted: false,
              nsfw: false,
              ap_id: '',
              local: false,
              language_id: 0,
              featured_community: false,
              featured_local: false,
            },
            community: {
              id: 0,
              name: 'bluesky',
              title: 'Bluesky',
              description: undefined,
              removed: false,
              published: '',
              updated: undefined,
              deleted: false,
              nsfw: false,
              actor_id: 'https://bsky.app',
              local: false,
              icon: undefined,
              banner: undefined,
              hidden: false,
              posting_restricted_to_mods: false,
              instance_id: 0,
              visibility: 'Public',
            },
            counts: {
              comment_id: mentionId,
              score: 0,
              upvotes: 0,
              downvotes: 0,
              published: notif.indexedAt,
              child_count: 0,
            },
            subscribed: 'NotSubscribed',
            saved: false,
            creator_blocked: false,
            creator_banned_from_community: false,
            banned_from_community: false,
            creator_is_moderator: false,
            creator_is_admin: false,
            my_vote: undefined,
          }
        })

      return {
        mentions: mentions,
      }
    } catch (error) {
      console.error('Bluesky getPersonMentions error:', error)
      return { mentions: [] }
    }
  }

  async markPersonMentionAsRead(form: types.MarkPersonMentionAsRead): Promise<types.PersonMentionResponse | void> {
    // Bluesky doesn't track read status
  }

  async getReplies(form: types.GetReplies): Promise<types.GetRepliesResponse> {
    await this.#ensureAuth()

    try {
      const notifications = await this.#agent.listNotifications({
        limit: form.limit || 20,
      })

      const replies = notifications.data.notifications
        .filter(notif => notif.reason === 'reply')
        .map(notif => {
          const post = notif.record as any
          const author = notif.author

          const rkey = notif.uri ? notif.uri.split('/').pop() : ''
          const replyId = rkey ? Math.abs(rkey.split('').reduce((acc: number, char: string) => {
            acc = ((acc << 5) - acc) + char.charCodeAt(0)
            return acc & acc
          }, 0)) : 0

          return {
            recipient: {
              id: 0,
              name: '',
              display_name: undefined,
              avatar: undefined,
              banned: false,
              published: '',
              updated: undefined,
              actor_id: '',
              bio: undefined,
              local: false,
              banner: undefined,
              deleted: false,
              matrix_user_id: undefined,
              bot_account: false,
              ban_expires: undefined,
              instance_id: 0,
            },
            comment_reply: {
              id: replyId,
              recipient_id: 0,
              comment_id: replyId,
              read: !notif.isRead,
              published: notif.indexedAt,
            },
            comment: {
              id: replyId,
              creator_id: 0,
              post_id: 0,
              content: post.text || '',
              removed: false,
              published: notif.indexedAt,
              updated: undefined,
              deleted: false,
              ap_id: notif.uri,
              local: false,
              path: '0',
              distinguished: false,
              language_id: 0,
            },
            creator: {
              id: 0,
              name: author.handle,
              display_name: author.displayName,
              avatar: author.avatar,
              banned: false,
              published: '',
              updated: undefined,
              actor_id: `https://bsky.app/profile/${author.handle}`,
              bio: author.description,
              local: false,
              banner: author.banner,
              deleted: false,
              matrix_user_id: undefined,
              bot_account: false,
              ban_expires: undefined,
              instance_id: 0,
            },
            post: {
              id: 0,
              name: '',
              body: undefined,
              creator_id: 0,
              community_id: 0,
              removed: false,
              locked: false,
              published: notif.indexedAt,
              updated: undefined,
              deleted: false,
              nsfw: false,
              ap_id: '',
              local: false,
              language_id: 0,
              featured_community: false,
              featured_local: false,
            },
            community: {
              id: 0,
              name: 'bluesky',
              title: 'Bluesky',
              description: undefined,
              removed: false,
              published: '',
              updated: undefined,
              deleted: false,
              nsfw: false,
              actor_id: 'https://bsky.app',
              local: false,
              icon: undefined,
              banner: undefined,
              hidden: false,
              posting_restricted_to_mods: false,
              instance_id: 0,
              visibility: 'Public',
            },
            counts: {
              comment_id: replyId,
              score: 0,
              upvotes: 0,
              downvotes: 0,
              published: notif.indexedAt,
              child_count: 0,
            },
            subscribed: 'NotSubscribed',
            saved: false,
            creator_blocked: false,
            creator_banned_from_community: false,
            banned_from_community: false,
            creator_is_moderator: false,
            creator_is_admin: false,
            my_vote: undefined,
          }
        })

      return {
        replies: replies,
      }
    } catch (error) {
      console.error('Bluesky getReplies error:', error)
      return { replies: [] }
    }
  }

  async banPerson(form: types.BanPerson): Promise<types.BanPersonResponse> {
    throw new Error('Bluesky does not have person banning in the same way')
  }

  async getBannedPersons(): Promise<types.BannedPersonsResponse> {
    throw new Error('Bluesky does not have banned persons')
  }

  async blockPerson(form: types.BlockPerson): Promise<types.BlockPersonResponse> {
    await this.#ensureAuth()

    try {
      // In Bluesky, we need the user's DID to block them
      // The person_id in Lemmy is usually numeric, but we're using handles
      // We'll need to resolve the handle to get the DID

      // If person_id is provided as a number, we can't directly map it
      // We need to get the handle somehow - this is a limitation of the mapping
      // For now, throw an error with a helpful message
      if (typeof form.person_id === 'number' && form.person_id !== 0) {
        throw new Error('Bluesky blocking requires refreshing the page to get user details')
      }

      // If we have a username/handle, use that
      const actor = form.person_id?.toString() || ''
      if (!actor) {
        throw new Error('No user identifier provided for blocking')
      }

      // Get the user's profile to get their DID
      const profile = await this.#agent.getProfile({ actor })

      if (form.block) {
        // Block the user
        await this.#agent.app.bsky.graph.block.create(
          { repo: this.#agent.session!.did },
          { subject: profile.data.did, createdAt: new Date().toISOString() }
        )
      } else {
        // Unblock - we'd need to find and delete the block record
        // This is more complex, so for now we'll throw an error
        throw new Error('Unblocking not yet fully implemented')
      }

      return {
        person_view: {
          person: {
            id: 0,
            name: profile.data.handle,
            display_name: profile.data.displayName,
            avatar: profile.data.avatar,
            banned: false,
            published: profile.data.createdAt || '',
            updated: undefined,
            actor_id: `https://bsky.app/profile/${profile.data.handle}`,
            bio: profile.data.description,
            local: false,
            banner: profile.data.banner,
            deleted: false,
            matrix_user_id: undefined,
            bot_account: false,
            ban_expires: undefined,
            instance_id: 0,
          },
          counts: {
            person_id: 0,
            post_count: profile.data.postsCount || 0,
            comment_count: 0,
          },
          is_admin: false,
        },
        blocked: form.block,
      }
    } catch (error) {
      console.error('Bluesky blockPerson error:', error)
      throw error
    }
  }

  async getCaptcha(): Promise<types.GetCaptchaResponse> {
    throw new Error('Bluesky does not use captcha')
  }

  async deleteAccount(form: types.DeleteAccount): Promise<types.SuccessResponse> {
    throw new Error('Bluesky account deletion not implemented')
  }

  async passwordReset(form: types.PasswordReset): Promise<types.SuccessResponse> {
    throw new Error('Bluesky password reset not implemented')
  }

  async passwordChangeAfterReset(form: types.PasswordChangeAfterReset): Promise<types.SuccessResponse> {
    throw new Error('Bluesky password change not implemented')
  }

  async markAllAsRead(): Promise<types.GetRepliesResponse> {
    return { replies: [] }
  }

  async saveUserSettings(form: types.SaveUserSettings): Promise<types.SuccessResponse> {
    await this.#ensureAuth()

    try {
      // Map Lemmy settings to Bluesky profile
      // Most Lemmy settings don't have Bluesky equivalents
      // We can update display name, bio, and avatar

      const session = this.#agent.session
      if (!session) {
        throw new Error('No session available')
      }

      // Get current profile
      const profile = await this.#agent.getProfile({ actor: session.did })

      // Update profile with new values
      const updateRecord: any = {
        displayName: form.display_name || profile.data.displayName,
        description: form.bio || profile.data.description,
      }

      // Keep existing avatar and banner if not changed
      if (profile.data.avatar) {
        updateRecord.avatar = profile.data.avatar
      }
      if (profile.data.banner) {
        updateRecord.banner = profile.data.banner
      }

      // Update the profile
      await this.#agent.upsertProfile((existing: any) => {
        return {
          ...existing,
          ...updateRecord,
        }
      })

      return {
        success: true,
      }
    } catch (error) {
      console.error('Bluesky saveUserSettings error:', error)
      throw error
    }
  }

  async changePassword(form: types.ChangePassword): Promise<types.LoginResponse> {
    throw new Error('Bluesky password change not implemented')
  }

  async getReportCount(form: types.GetReportCount): Promise<types.GetReportCountResponse> {
    return {
      community_id: undefined,
      comment_reports: 0,
      post_reports: 0,
      private_message_reports: undefined,
    }
  }

  async getUnreadCount(): Promise<types.GetUnreadCountResponse> {
    await this.#ensureAuth()

    try {
      const count = await this.#agent.countUnreadNotifications()

      return {
        replies: count.data.count || 0,
        mentions: 0, // Bluesky combines these
        private_messages: 0, // Bluesky doesn't have DMs in the same way
      }
    } catch (error) {
      console.error('Bluesky getUnreadCount error:', error)
      return {
        replies: 0,
        mentions: 0,
        private_messages: 0,
      }
    }
  }

  async verifyEmail(form: types.VerifyEmail): Promise<types.SuccessResponse> {
    throw new Error('Bluesky email verification not implemented')
  }

  async addAdmin(form: types.AddAdmin): Promise<types.AddAdminResponse> {
    throw new Error('Bluesky does not have admin management')
  }

  async getUnreadRegistrationApplicationCount(): Promise<types.GetUnreadRegistrationApplicationCountResponse> {
    return { registration_applications: 0 }
  }

  async listRegistrationApplications(form: types.ListRegistrationApplications): Promise<types.ListRegistrationApplicationsResponse> {
    return { registration_applications: [] }
  }

  async approveRegistrationApplication(form: types.ApproveRegistrationApplication): Promise<types.RegistrationApplicationResponse> {
    throw new Error('Bluesky does not have registration applications')
  }

  async getRegistrationApplication(form: types.GetRegistrationApplication): Promise<types.RegistrationApplicationResponse> {
    throw new Error('Bluesky does not have registration applications')
  }

  async purgePerson(form: types.PurgePerson): Promise<types.SuccessResponse> {
    throw new Error('Bluesky does not support purging')
  }

  async purgeCommunity(form: types.PurgeCommunity): Promise<types.SuccessResponse> {
    throw new Error('Bluesky does not support purging')
  }

  async purgePost(form: types.PurgePost): Promise<types.SuccessResponse> {
    throw new Error('Bluesky does not support purging')
  }

  async purgeComment(form: types.PurgeComment): Promise<types.SuccessResponse> {
    throw new Error('Bluesky does not support purging')
  }

  async getFederatedInstances(): Promise<types.GetFederatedInstancesResponse> {
    throw new Error('Bluesky federation not implemented')
  }

  async blockInstance(form: types.BlockInstance): Promise<types.BlockInstanceResponse> {
    throw new Error('Bluesky does not have instance blocking')
  }

  async uploadImage(form: types.UploadImage): Promise<types.UploadImageResponse> {
    await this.#ensureAuth()

    try {
      // Convert the image to a Blob if it's not already
      let imageBlob: Blob

      if (form.image instanceof Blob) {
        imageBlob = form.image
      } else if (typeof form.image === 'string') {
        // If it's a base64 string or URL, fetch it
        const response = await fetch(form.image)
        imageBlob = await response.blob()
      } else {
        throw new Error('Unsupported image format')
      }

      // Upload the blob to Bluesky
      const uploadResponse = await this.#agent.uploadBlob(imageBlob, {
        encoding: imageBlob.type || 'image/jpeg',
      })

      // Return the blob reference in the expected format
      return {
        files: [{
          file: uploadResponse.data.blob.ref.toString(),
          delete_token: '', // Bluesky doesn't use delete tokens
        }],
        msg: 'success',
        url: uploadResponse.data.blob.ref.toString(),
      }
    } catch (error) {
      console.error('Bluesky uploadImage error:', error)
      throw error
    }
  }

  async deleteImage(form: types.DeleteImage): Promise<boolean> {
    throw new Error('Bluesky image deletion not implemented')
  }

  async listMedia(form: types.ListMedia): Promise<types.ListMediaResponse> {
    throw new Error('Bluesky media listing not implemented')
  }

  // Helper method to map Bluesky posts to PostView
  #mapPostToPostView(post: any): types.PostView {
    // Convert Bluesky handle to profile URL
    const profileUrl = post.author?.handle
      ? `https://bsky.app/profile/${post.author.handle}`
      : 'https://bsky.app'

    // Extract rkey from URI (last part after final slash)
    const rkey = post.uri ? post.uri.split('/').pop() : ''

    // Convert post URI to web URL
    const postUrl = post.uri && post.author?.handle
      ? `https://bsky.app/profile/${post.author.handle}/post/${rkey}`
      : 'https://bsky.app'

    // Generate a numeric ID from the rkey for routing
    // Use a simple hash to convert the rkey string to a number
    const hashId = rkey ? Math.abs(rkey.split('').reduce((acc: number, char: string) => {
      acc = ((acc << 5) - acc) + char.charCodeAt(0)
      return acc & acc
    }, 0)) : 0

    // Store post URI and CID in cache for later use (liking, deleting, etc.)
    if (post.uri && post.cid) {
      this.#postCache.set(hashId, {
        uri: post.uri,
        cid: post.cid,
        likeUri: post.viewer?.like // Store existing like URI if present
      })
    }

    // Extract image URL from embed if present
    let imageUrl: string | undefined
    let thumbnailUrl: string | undefined
    if (post.embed) {
      if (post.embed.$type === 'app.bsky.embed.images#view' && post.embed.images?.[0]) {
        // Direct image embed - use fullsize for url and thumb for thumbnail
        imageUrl = post.embed.images[0].fullsize
        thumbnailUrl = post.embed.images[0].thumb
      } else if (post.embed.$type === 'app.bsky.embed.recordWithMedia#view' && post.embed.media?.images?.[0]) {
        // Quote post with media
        imageUrl = post.embed.media.images[0].fullsize
        thumbnailUrl = post.embed.media.images[0].thumb
      }
    }

    return {
      post: {
        id: hashId,
        name: '', // Bluesky doesn't have titles, only body text
        body: post.record?.text || '',
        url: imageUrl, // Full size image URL
        thumbnail_url: thumbnailUrl, // Thumbnail for preview
        creator_id: 0,
        community_id: 0,
        removed: false,
        locked: false,
        published: post.record?.createdAt || new Date().toISOString(),
        updated: undefined,
        deleted: false,
        nsfw: false,
        ap_id: postUrl,
        local: false,
        language_id: 0,
        featured_community: false,
        featured_local: false,
      },
      creator: {
        id: 0,
        name: post.author?.handle || '',
        display_name: post.author?.displayName || undefined,
        avatar: post.author?.avatar || undefined,
        banned: false,
        published: '',
        updated: undefined,
        actor_id: profileUrl,
        bio: post.author?.description || undefined,
        local: false,
        banner: post.author?.banner || undefined,
        deleted: false,
        matrix_user_id: undefined,
        bot_account: false,
        ban_expires: undefined,
        instance_id: 0,
      },
      community: {
        id: 0,
        name: 'bluesky',
        title: 'Bluesky',
        description: undefined,
        removed: false,
        published: '',
        updated: undefined,
        deleted: false,
        nsfw: false,
        actor_id: 'https://bsky.app',
        local: false,
        icon: undefined,
        banner: undefined,
        hidden: false,
        posting_restricted_to_mods: false,
        instance_id: 0,
        visibility: 'Public',
      },
      counts: {
        post_id: 0,
        comments: post.replyCount || 0,
        score: (post.likeCount || 0) - (post.dislikeCount || 0),
        upvotes: post.likeCount || 0,
        downvotes: 0,
        published: post.record?.createdAt || new Date().toISOString(),
        newest_comment_time: post.record?.createdAt || new Date().toISOString(),
      },
      subscribed: 'NotSubscribed',
      saved: false,
      read: false,
      creator_blocked: false,
      my_vote: post.viewer?.like ? 1 : undefined,
      creator_banned_from_community: false,
      banned_from_community: false,
      creator_is_moderator: false,
      creator_is_admin: false,
      hidden: false,
      unread_comments: 0,
    }
  }
}
