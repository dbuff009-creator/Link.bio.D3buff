/* ═══════════════════════════════════════════════════════════════
   НАСТРОЙКА САЙТА
   Картинки указываются БЕЗ расширения: image/bg, image/avatar…
   Можно заменить PNG на JPG / JPEG / WEBP, не меняя этот файл.
   Оставляй один актуальный вариант картинки с нужным именем.
   ═══════════════════════════════════════════════════════════════ */

const CONFIG = {
  site: {
    favicon: "image/icon",
    titleTypewriter: true,
    typewriterSpeed: 88,
    /* Увеличь число, если заменил картинку или музыку, а браузер хранит старый файл. */
    cacheVersion: 13,
  },

  profile: {
    displayName: "D3buff", // имя вкладки и alt логотипа
    logo: "image/logo",
    logoWidth: 300,       // большой логотип вместо аватарки и видимого ника
    logoAxisX: 48.84,     // оптическая ось меча в исходном PNG, в процентах ширины
    logoOffsetX: -2,      // основное лого сдвинуто на 2px влево
    logoOffsetY: 24,      // ниже центральной линии баннера
    avatar: "image/avatar",
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
    season: "winter",
    accent: "#cceaff",
    accentHover: "#e4f4ff",
    text: "#f2f7ff",
    textMuted: "#adbfce",
    cardBg: "rgba(11, 23, 38, 0.78)",
    cardBorder: "rgba(195, 225, 255, 0.18)",
    cardRadius: 30,
    glow: true,
  },

  banner: {
    enabled: true,
    /* Обложка профиля: image/bg.png, image/bg.jpg или image/bg.jpeg. */
    image: "image/bg",
  },

  background: {
    /* Исходный видеофон. Замена обложки image/bg.* его не затрагивает. */
    type: "video",
    video: "back/bg.mp4",
    randomStart: true,
    image: "",
    overlay: 0.1,
    blur: 0,
    dimColor: "rgba(0,0,0,0.4)",
    vignette: false,
  },

  ornaments: {
    enabled: true,
    /* Боковые орнаменты инвертируют цвета под собой (mix-blend-mode: difference), как логотип. */
    image: "image/ornament",
    opacity: 1,
    flipHorizontal: true, // левый отражён, правый в исходной ориентации
  },

  enter: {
    /* Заставка с большим лого; звук разрешается настоящим жестом пользователя. */
    enabled: true,
    text: "Click to continue",
    subtext: "",
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
    icon: "image/Server",
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
    type: "none",       // снега и других фоновых эффектов нет
    parallax: true,
  },

  cursor: {
    custom: "image/cursor",
    childDrawn: true,
  },

  footer: {
    show: false,
  },
};
