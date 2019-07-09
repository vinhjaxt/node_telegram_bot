# @vinhjaxt Nodejs and Telegram BOT API

# Install:  `npm i -S vinhjaxt/node_telegram_bot`

# Usage:
```js
const TelegramBot = require('./TelegramBot')

const myBot = new TelegramBot({
  token: '536034356:xxx'
})

myBot.getMePromise.then(() => {
  console.log('Bot is ready')
  myBot.sendMessage('Hello', '@vinhjaxt_ch').catch(console.error.bind(console))
}).catch(console.error.bind(console))
```
