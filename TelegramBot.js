/* eslint-disable eqeqeq */
/*
Copyright (c)2018-2019 by vinhjaxt
*/
const fs = require('fs')
const Request = require('request')
const defaultOpts = {
  forever: true,
  gzip: true,
  timeout: 7000,
  json: true
}
const NormalizeOptions = opts => Object.assign({}, defaultOpts, opts)
const requestBase = (opts) => new Promise((resolve, reject) => Request(NormalizeOptions(opts), (e, r, b) => e ? reject(e) : resolve([r, b])))
const checkErrError = new Error('checkErr')
const maxRetryError = new Error('maxRetryError')
const request = async (opts, callback, checkErr) => {
  let err, resp, body
  let retry = 0
  const maxRetries = opts.maxRetries || 9
  while (true) {
    if (retry > maxRetries) {
      console.error('TelegramBot: Request max retry exceeded')
      if (!err) err = maxRetryError
      break
    }
    if (retry) console.log('TelegramBot: Retry', retry)
    retry++
    try {
      [resp, body] = await requestBase(opts)
    } catch (e) {
      err = e
      continue
    }
    if (checkErr && (await checkErr(resp, body))) {
      if (!err) err = checkErrError
      continue
    }
    break
  }
  if (callback && callback.constructor === Function) callback(err, resp, body)
  if (err) throw err
  return body
}
// See: https://core.telegram.org/bots/api
const getTelegramApiUrl = (botToken, method) => 'https://api.telegram.org/bot' + botToken + '/' + method

class TelegramBot {
  constructor (config) {
    this.config = config
    if (this.config.cachedChatIdsFile && fs.existsSync(this.config.cachedChatIdsFile)) {
      try {
        this.cachedChatIds = JSON.parse(fs.readFileSync(this.config.cachedChatIdsFile, 'utf8'))
        if (typeof this.cachedChatIds !== 'object' || Array.isArray(this.cachedChatIds)) this.cachedChatIds = {}
      } catch (e) {
        this.cachedChatIds = {}
      }
    } else {
      this.cachedChatIds = {}
    }
    this.request = config.request || request
    this.getMePromise = request({
      url: this.getTelegramApiUrl('getMe')
    }).then(b => {
      if (!b.ok && b.error_code === 401) {
        throw b
      }
      return b
    })
  }

  cacheChatId (chatId, realChatId) {
    if (this.cachedChatIds[chatId] === realChatId) return
    this.cachedChatIds[chatId] = realChatId
    if (!this.config.cachedChatIdsFile) return
    fs.writeFileSync(this.config.cachedChatIdsFile, JSON.stringify(this.cachedChatIds), 'utf8')
  }

  getCachedChatId (chatId) {
    return this.cachedChatIds[chatId] || chatId
  }

  getTelegramApiUrl (method) {
    return getTelegramApiUrl(this.config.token, method)
  }
  // methods

  // send text message
  sendMessage (text, chatId, parseMode) {
    return request({
      url: this.getTelegramApiUrl('sendMessage'),
      method: 'POST',
      json: {
        chat_id: this.getCachedChatId(chatId),
        text: text,
        parse_mode: parseMode || 'HTML'
      }
    }, null, r => r.statusCode != 200).then(b => {
      if (!b.result || !b.result.message_id) {
        const err = new Error('sendMessage: May be TELEGRAM_BOT_TOKEN expired')
        err.body = b
        throw err
      }
      this.cacheChatId(chatId, b.result.chat.id)
      return b
    })
  }

  // send text message
  editMessageText (text, messageId, chatId, parseMode) {
    return request({
      url: this.getTelegramApiUrl('editMessageText'),
      method: 'POST',
      json: {
        message_id: messageId,
        chat_id: this.getCachedChatId(chatId),
        text: text,
        parse_mode: parseMode || 'HTML'
      }
    }, null, r => r.statusCode != 200).then(b => {
      if (!b.result) {
        const err = new Error('sendMessage: May be TELEGRAM_BOT_TOKEN expired')
        err.body = b
        throw err
      }
      this.cacheChatId(chatId, b.result.chat.id)
      return b
    })
  }

  // telegram getUpdates for long-polling
  getUpdates (query, opts) {
    return request({
      ...opts,
      url: this.getTelegramApiUrl('getUpdates'),
      qs: query
    })
  }

  // telegram web hook for bot
  setWebhook (url) {
    return request({
      url: this.getTelegramApiUrl('setWebhook'),
      qs: {
        url
      }
    })
  }

  sendPhoto (file, caption, chatId) {
    return request({
      url: this.getTelegramApiUrl('sendPhoto'),
      method: 'POST',
      formData: {
        chat_id: this.getCachedChatId(chatId),
        parse_mode: 'HTML', // or Markdown
        photo: fs.createReadStream(file),
        caption: caption
      }
    }, null, r => r.statusCode != 200).then(b => {
      if (!b.result || !b.result.message_id) {
        const err = new Error('sendMessage: May be TELEGRAM_BOT_TOKEN expired')
        err.body = b
        throw err
      }
      this.cacheChatId(chatId, b.result.chat.id)
      return b
    })
  }
}

exports = module.exports = { TelegramBot, defaultOpts }
