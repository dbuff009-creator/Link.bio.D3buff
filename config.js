/* ═══════════════════════════════════════════════════════════════
   НАСТРОЙКА — меняй только этот файл
   ═══════════════════════════════════════════════════════════════ */

const CONFIG = {
  site: {
    favicon: "image/icon.png",
    titleTypewriter: true,
    typewriterSpeed: 88,
    /* ↑ увеличь при смене bg.mp4, музыки, аватарки — иначе браузер покажет старый кэш */
    cacheVersion: 2,
  },

  profile: {
    displayName: "D3buff",
    avatar: "image/avatar.png",
    avatarCrop: "center 72%",
    tags: ["Graphic designer", "Furry", "Gmod player"],
    pronouns: "He || his",
    location: "Russian federation",
  },

  counter: {
    namespace: "d3buff-live",
    /* уникальные IP с fakecrime (каждый IP один раз), не число заходов */
    offset: 222,
  },

  fonts: {
    body: "Inter",
    display: "Humane",
    name: "MangoGrotesque",
  },

  theme: {
    accent: "#ffffff",
    accentHover: "#e5e5e5",
    text: "#ffffff",
    textMuted: "#a3a3a3",
    cardBg: "rgba(8, 8, 10, 0.72)",
    cardBorder: "rgba(255, 255, 255, 0.06)",
    cardRadius: 30,
    glow: false,
  },

  banner: {
    enabled: true,
    image: "https://i.imgur.com/UE7hr92.png",
  },

  background: {
    type: "video",
    video: "back/bg.mp4",
    randomStart: true,
    image: "",
    overlay: 0.1,
    blur: 0,
    dimColor: "rgba(0,0,0,0.4)",
    vignette: false,
  },

  enter: {
    enabled: false,
  },

  social: [
    { id: "telegram", url: "https://t.me/TheD3buff", label: "Tg channel" },
    { id: "discord", url: "https://discord.com/users/976212073790980117/", label: "Discord" },
  ],

  links: [
    {
      id: "steam",
      title: "Основной акк",
      description: "тут все мои игры можем поиграть и т.д.",
      url: "https://steamcommunity.com/profiles/76561198739087972/",
    },
  ],

  portfolio: {
    enabled: true,
    title: "Portfolio D3buff",
    description: "Графический дизайн — мои работы и проекты",
    url: "https://dbuff009-creator.github.io/Portfolio-D3buff-Design/",
    icon: "palette",
  },

  /* Discord статус (Lanyard) — отключён */
  discord: {
    enabled: false,
    userId: "976212073790980117",
  },

  discordServer: {
    enabled: true,
    guildId: "1257766638883705006",
    name: "FRND Squad!",
    tag: "FRND squad",
    icon: "image/Server.png",
    description: "Это сообщество друзей без сорр и оскорблений",
    invite: "https://discord.gg/em6GrsH933",
  },

  music: {
    enabled: true,
    autoplay: true,
    loop: true,
    volume: 0.2,
    marqueePause: 1.5,
    marqueeWidth: 128,
    playlist: [
      {
        file: "back/music/sorry.mp3",
        title: "> ,< + sorry",
        artist: "sheqate",
      },
      {
        file: "back/music/suture.mp3",
        title: "suture",
        artist: "Sink Saiko",
      },
      {
        file: "back/music/hardwick.mp3",
        title: "7MANN",
        artist: "HARDWICK",
      },
    ],
  },

  effects: {
    type: "sparkles",
    intensity: 18,
    color: "#ffffff",
    targets: [".sparkle-zone"],
    parallax: true,
    confetti: true,
  },

  cursor: {
    custom: "image/cursor.png",
    childDrawn: true,
  },

  footer: {
    show: false,
  },
};
