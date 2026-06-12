/* ═══════════════════════════════════════════════════════════════
   НАСТРОЙКА — меняй только этот файл
   ═══════════════════════════════════════════════════════════════ */

const CONFIG = {
  site: {
    favicon: "image/icon.png",
    titleTypewriter: true,
    typewriterSpeed: 88,
    /* ↑ увеличь при смене bg.mp4, музыки, аватарки — иначе браузер покажет старый кэш */
    cacheVersion: 4,
  },

  profile: {
    displayName: "D3buff",
    avatar: "image/avatar.jpg",
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
    image: "https://i.imgur.com/hpCyi8J.png",
  },

  background: {
    type: "video",
    video: "back/bg.mp4",
    randomStart: true,
    image: "",
    overlay: 0.55,
    blur: 0,
    dimColor: "rgba(0,0,0,0.4)",
    vignette: false,
  },

  enter: {
    enabled: true,
    text: "Tap to continue",
    emoji: "image/fun.jpg",
  },

  social: [
    { id: "telegram", url: "https://t.me/TheD3buff", label: "Tg channel" },
    { id: "discord", url: "https://discord.com/users/976212073790980117/", label: "Discord" },
    { id: "namemc", url: "https://namemc.com/profile/goofy_D3buff", label: "NameMC" },
    { id: "youtube", url: "https://www.youtube.com/@D3BUFF-k6j", label: "YouTube" },
    { id: "roblox", url: "https://www.roblox.com/users/2335154582/profile", label: "Roblox · 1 акк" },
    { id: "roblox2", url: "https://www.roblox.com/users/4577228859/profile", label: "Roblox · 2 акк" },
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
        file: "back/music/bez-kryshi-somewhaat.mp3",
        title: "Без крыши",
        artist: "somewhaat",
      },
      {
        file: "back/music/vse-hotyat-potselovat-gotlib.mp3",
        title: "все хотят меня поцеловать",
        artist: "gotlibgotlibgotlib",
      },
      {
        file: "back/music/liverpool-street-mall-grab.mp3",
        title: "Liverpool Street In The Rain",
        artist: "Mall Grab",
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
