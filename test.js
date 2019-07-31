const TelegramBot = require('./TelegramBot')

const myBot = new TelegramBot({
  token: '536034356:AAEZnLWWg4g9KoZ4ihIDkroxOdeEYzGQXoU'
})

myBot.getMePromise.then(() => {
  console.log('Bot is ready')
  myBot.sendMessage('Hello', '@vinhjaxt_gr').then(b => {
    console.log(b, myBot.cachedChatIds)
  }).catch(console.error.bind(console))
}).catch(console.error.bind(console))
