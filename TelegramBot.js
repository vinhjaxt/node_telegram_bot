/*
Copyright (c)2018 by vinhjaxt
*/

const request = require('request');

let channelIDs = {};
let doSaveChannel = false;
(() => {
  const FILE_SAVE_CHANNELS = __dirname+'/telegramSavedChannelIDs.json';
  const fs = require('fs');
  setInterval(() => {
    if(doSaveChannel)
      fs.writeFileSync(FILE_SAVE_CHANNELS, JSON.stringify(channelIDs), 'utf8');
  }, 30000);
  if(fs.existsSync(FILE_SAVE_CHANNELS)) {
    try{
      channelIDs = require(FILE_SAVE_CHANNELS);
    }catch(e){
      channelIDs = {};
    }
  }
})();

const telegramBotInstance = function (){
  let self = telegramBotInstance;
  if(this instanceof telegramBotInstance){
    self = this;
  }

  self.availableMethods = {};
  self.TELEGRAM_BOT_TOKEN = '';
  // if you: let TELEGRAM_BOT_TOKEN = '' then it'll change every time when create new instance for another bot, we avoid that
  
  // See: https://core.telegram.org/bots/api
  const getTelegramApiUrl = (method) => 'https://api.telegram.org/bot'+self.TELEGRAM_BOT_TOKEN+'/'+method;

  self.sendMessage = function (){
    if(self.availableMethods['sendMessage'])
      self.availableMethods.sendMessage.apply(null, arguments);
    if(typeof(arguments[arguments.length - 1]) === 'function'){
      (arguments[arguments.length - 1])('Not available yet');
    }
  };
  // for Long-Polling
  self.getUpdates = function (){
    if(self.availableMethods['getUpdates']){
      self.availableMethods.getUpdates.apply(null, arguments);
      return;
    }
    if(typeof(arguments[arguments.length - 1]) === 'function'){
      (arguments[arguments.length - 1])('Not available yet');
    }else
      setTimeout(() => self.getUpdates.apply(null, arguments), 2000);
  };
  self.sendPhoto = function (){
    if(self.availableMethods['sendPhoto'])
      self.availableMethods.sendPhoto.apply(null, arguments);
    if(typeof(arguments[arguments.length - 1]) === 'function'){
      (arguments[arguments.length - 1])('Not available yet');
    }
  };
  self.setWebhook = function (){
    if(self.availableMethods['setWebhook'])
      self.availableMethods.setWebhook.apply(null, arguments);
    if(typeof(arguments[arguments.length - 1]) === 'function'){
      (arguments[arguments.length - 1])('Not available yet');
    }
  };
  self.setBotToken = (token, cb) => {
    self.TELEGRAM_BOT_TOKEN = token;
    self.availableMethods = {};
    request({
        url: getTelegramApiUrl('getMe'),
        gzip: true,
        json: true,
        timeout: 15000
      },  (e,r,b) => {
        if(e){
          console.error('getMe: ', e);
          if(b){
            if(cb)
              cb(b);
          }else
            setTimeout(() => {
              self.setBotToken(token);
            }, 2000);
          return;
        }
        try{
          if(!b.ok && b.error_code == 401){
            console.error('TELEGRAM_BOT_TOKEN is invalid: ', b);
            if(cb) cb(b);
            return;
          }
          if(cb) cb(false, b);
          self.availableMethods['sendMessage'] = (message, chat_id, cb) => {
            try{
              const data = {
                chat_id: channelIDs[chat_id]||chat_id,
                text: message,
                parse_mode: 'HTML'
              };
              request({
                url: getTelegramApiUrl('sendMessage'),
                method: 'POST',
                json: data,
                gzip: true,
                timeout: 15000
              }, (e,r,b) => {
                if (e || r.statusCode != 200) {
                  console.error('sendMessage(', message, chat_id, ') : ', e, b);
                  if(b){
                    if(cb)
                      cb(b);
                  }else
                    setTimeout(() => {
                      self.sendMessage(message, chat_id);
                    }, 3000);
                  return;
                }
                if(!b.result || !b.result.message_id){
                  console.log('sendMessage: May be TELEGRAM_BOT_TOKEN was expired.');
                  if(cb)
                    cb(b);
                  return;
                }
                // Success
                if(!channelIDs[chat_id]){
                  channelIDs[chat_id] = b.result.chat.id;
                  doSaveChannel = true;
                }
                if(cb) cb(false, b);
              });
            }catch(e){
              console.error('sendMessage: ', e);
            }
          }; // sendMessage
          
          self.availableMethods['sendPhoto'] = (file, caption, chat_id, cb) => {
            try{
              const fs = require('fs');
              const data = {
                chat_id: channelIDs[chat_id]||chat_id,
                parse_mode: 'HTML', // Markdown
                photo: fs.createReadStream(file),
                caption: caption
              }
              request({
                url: getTelegramApiUrl('sendPhoto'),
                method: 'POST',
                formData: data,
                json: true,
                gzip: true,
                timeout: 20000
              }, (e,r,b) => {
                if (e || r.statusCode != 200) {
                  console.error('sendPhoto(', file, chat_id, '): ', e, b);
                  if(cb)
                    cb(b||e);
                  return;
                }
                if(!b.result || !b.result.message_id){
                  console.error('sendPhoto: May be TELEGRAM_BOT_TOKEN was expired.');
                  if(cb)
                    cb(b);
                  return;
                }
                // Success
                if(!channelIDs[chat_id]){
                  channelIDs[chat_id] = b.result.chat.id;
                  doSaveChannel = true;
                }
                if(cb)
                  cb(false, b);
              });
            }catch(e){
              console.error('sendPhoto: ', e);
            }
          }; // sendPhoto

          // telegram web hook for bot
          self.availableMethods['setWebhook'] = (url) => {
            request({
              url: getTelegramApiUrl('setWebhook'),
              method: 'GET',
              qs: {
                url: url
              },
              json: true,
              gzip: true,
              timeout: 15000
            }, (e, r, b) => {
              if(e){
                console.error(e);
                if(cb)
                  cb(b||e);
                return;
              }
              console.log('setWebhook: ', b);
              if(cb)
                cb(false, b);
            });
          }; // setWebhook

          // telegram getUpdates for long-polling
          self.availableMethods['getUpdates'] = (qs, cb) => {
            request({
              url: getTelegramApiUrl('getUpdates'),
              method: 'GET',
              qs: qs,
              json: true,
              gzip: true,
              timeout: 15000
            }, cb);
          }; // getUpdates
        }catch(e){
          console.error(e);
          return;
        }
    });
  };
  if(arguments.length > 0)
    self.setBotToken.apply(null, arguments);
  return self;
};
module.exports = telegramBotInstance;
