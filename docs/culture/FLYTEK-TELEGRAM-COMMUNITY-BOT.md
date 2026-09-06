# Flytek Telegram Community Bot

This module is a MyZubster/Zorgax-compatible Telegram bot template for the Flytek raver / DIY music community.

## Goals

- publish organizer-approved event information;
- expose lineup/timetable only after confirmation;
- coordinate crew roles and volunteer contributions;
- surface welfare, accessibility and safety information;
- help organizers prepare lawful, authorized parties;
- preserve flyer/lineup/community history with consent;
- avoid location leaks or instructions for unauthorized access.

## Commands

- `/start` — intro
- `/events` — organizer-approved public events
- `/lineup` — confirmed lineup/timetable
- `/crew` — community roles
- `/welfare` — water, rest, accessibility, emergency and safety reminders
- `/organize` — bounded organizer checklist
- `/rules` — community rules
- `/help` — command help

## Configuration

Use a dedicated Telegram bot created by the community owner/admin. Keep the token private.

```env
FLYTEK_TELEGRAM_BOT_TOKEN=
```

Instantiate the bot with an optional `eventProvider` function. The provider should return only organizer-approved public data:

```js
const FlytekCommunityBot = require('../services/ai-automation/src/telegram/flytekCommunityBot');

const bot = new FlytekCommunityBot({
  token: process.env.FLYTEK_TELEGRAM_BOT_TOKEN,
  communityName: 'Flytek',
  eventProvider: async () => ({
    events: [
      { title: 'Example authorized event', date: '2026-09-20', publicUrl: 'https://example.org/event' }
    ],
    lineup: ['22:00 Artist A', '00:00 Artist B']
  })
});

bot.start();
```

## Safety and community boundary

The bot is for culture, coordination and organizer-approved event operations. It must not provide instructions to trespass, evade permits or controls, expose private locations, or publish personal data without consent. Human organizers remain responsible for venue authorization, local permits, capacity, noise, safety and emergency requirements.
