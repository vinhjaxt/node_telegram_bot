const TelegramBot = require('./TelegramBot')('_YOUR_TELEGRAM_BOT_TOKEN_');

setTimeout(() => {
  TelegramBot.sendMessage('Hello from Node', '@your_channel');
}, 3000);


// Or:

const TelegramBotInstance = require('./TelegramBot');
const myBot = new TelegramBotInstance('MY_TELEGRAM_BOT_TOKEN');

setTimeout(() => {
  myBot.sendMessage('Hello from another bot hihi', '@your_channel');
}, 4000);