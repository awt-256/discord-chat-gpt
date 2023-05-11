// ==UserScript==
// @name         OpenAI Message Injection Plugin
// @version      1.0.0
// @description  Overrides outgoing discord messages with AI-powered modificatios
// @namespace    https://github.com/awt-256/discord-chat-gpt
// @author       awt-256
//
// @match        https://discord.com/*
// @run-at       document-start
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const OPENAI_KEY = "INSERT OPENAI TOKEN";

// msg is the outgoing msg, it's content gets changed by openai's API's response to the following POST
const aiSettings = (msg) => ({
  "model": "text-davinci-003",
  // example model that changes the text to sound like someone from the middle ages
  // other possibilities are stuff like grammar checker etc.
  "prompt": "In an old englishy voice, say \"" + msg.content + "\" then enhance the vocabulary.\n",
  "temperature": 1,
  "max_tokens": 100,
  "top_p": 1,
  "frequency_penalty": 0,
  "presence_penalty": 0
});

function inject(module) {
    unsafeWindow.webpackChunkdiscord_app.push([[Symbol()], {}, module]);
}

const overwrite = (Z) => {
  const sendMsg = Z.sendMessage;
  Z.sendMessage = async (channelId, msg, ...idk) => {
    const res = await new Promise(r => GM_xmlhttpRequest({
      url: "https://api.openai.com/v1/completions",
      method: "POST",
      data: JSON.stringify(aiSettings(msg)),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + OPENAI_KEY
      },
      onloadend: ({responseText}) => r(JSON.parse(responseText))
    }));

    const old = msg.content;
    msg.content = res.choices[0].text.trim() || msg.content;
    if (msg.content.startsWith('"')) msg.content = msg.content.slice(1, -1)
    // uncomment to prepend original before AI output
    // msg.content = "> " + old + "\n" + msg.content;
    return sendMsg.call(Z, channelId, msg, ...idk);
  }
}


unsafeWindow.inject = inject;

unsafeWindow.__startOldEnglish__ = () => {
  inject((require) => {
    unsafeWindow.require = require;
    const cache = require.c;

    for (const i in cache) {
      const { exports } = cache[i] || {};

      if (exports && exports.Z) {
        const { Z } = exports;
        if (!Z.sendMessage) continue;
        overwrite(Z);
      }
    }
  });
}
