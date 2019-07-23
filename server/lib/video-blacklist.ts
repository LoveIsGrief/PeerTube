import { Transaction } from 'sequelize'
import { CONFIG } from '../initializers/config'
import { UserRight, VideoBlacklistType } from '../../shared/models'
import { VideoBlacklistModel } from '../models/video/video-blacklist'
import { UserModel } from '../models/account/user'
import { VideoModel } from '../models/video/video'
import { logger } from '../helpers/logger'
import { UserAdminFlag } from '../../shared/models/users/user-flag.model'
import { Hooks } from './plugins/hooks'
import { Notifier } from './notifier'

async function autoBlacklistVideoIfNeeded (parameters: {
  video: VideoModel,
  user?: UserModel,
  isRemote: boolean,
  isNew: boolean,
  notify?: boolean,
  transaction?: Transaction
}) {
  const { video, user, isRemote, isNew, notify = true, transaction } = parameters
  const doAutoBlacklist = await Hooks.wrapPromiseFun(
    autoBlacklistNeeded,
    { video, user, isRemote, isNew },
    'filter:video.auto-blacklist.result'
  )

  if (!doAutoBlacklist) return false

  const videoBlacklistToCreate = {
    videoId: video.id,
    unfederated: true,
    reason: 'Auto-blacklisted. Moderator review required.',
    type: VideoBlacklistType.AUTO_BEFORE_PUBLISHED
  }
  const [ videoBlacklist ] = await VideoBlacklistModel.findOrCreate({
    where: {
      videoId: video.id
    },
    defaults: videoBlacklistToCreate,
    transaction
  })
  video.VideoBlacklist = videoBlacklist

  if (notify) Notifier.Instance.notifyOnVideoAutoBlacklist(video)

  logger.info('Video %s auto-blacklisted.', video.uuid)

  return true
}

async function autoBlacklistNeeded (parameters: {
  video: VideoModel,
  isRemote: boolean,
  isNew: boolean,
  user?: UserModel
}) {
  const { user, video, isRemote, isNew } = parameters

  // Already blacklisted
  if (video.VideoBlacklist) return false
  if (!CONFIG.AUTO_BLACKLIST.VIDEOS.OF_USERS.ENABLED || !user) return false
  if (isRemote || isNew === false) return false

  if (user.hasRight(UserRight.MANAGE_VIDEO_BLACKLIST) || user.hasAdminFlag(UserAdminFlag.BY_PASS_VIDEO_AUTO_BLACKLIST)) return false

  return true
}

// ---------------------------------------------------------------------------

export {
  autoBlacklistVideoIfNeeded
}
