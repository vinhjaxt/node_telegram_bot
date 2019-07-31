# @vinhjaxt Nodejs and Telegram BOT API

# Install:  `npm i -S vinhjaxt/node_telegram_bot`

# Usage:
```js
const TelegramBot = require('node_telegram_bot')

const myBot = new TelegramBot({
  token: '536034356:xxx' // Your bot token
})

myBot.getMePromise.then(() => {
  console.log('Bot is ready')
  myBot.sendMessage('Hello', '@your_channel').then(b => {
    console.log(b, myBot.cachedChatIds)
  }).catch(console.error.bind(console))
}).catch(console.error.bind(console))
```
