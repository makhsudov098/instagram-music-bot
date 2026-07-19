const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

const TOKEN = "8692527415:AAEPbNJNcSCcK8GEG9FF3zZci9Cu1kEuPQI";
const bot = new TelegramBot(TOKEN, { polling: true });
const userStates = {};

const localization = {
    uz: {
        welcome: "👋 Assalomu alaykum! Xush kelibsiz!\n\n🤖 <b>Men sizning intellektual yordamchingizman.</b>\n\n✨ <b>Mening imkoniyatlarim:</b>\n📥 Menga Instagram tarmog'idan video havolasini yuboring. Men uni sizga eng <b>yuqori hamda tiniq sifatda</b> yuklab beraman.\n🎵 Yuborilgan videoning ostida maxsus tugma paydo bo'ladi, uni bosish orqali videodagi musiqani alohida yuklab olishingiz mumkin.",
        downloading: "⏳ Havola tahlil qilinmoqda. Video yuqori sifatda yuklanmoqda, iltimos kuting...",
        audioBtn: "🎵 Musiqa yuklash",
        audioSuccess: "🎶 Videodagi musiqa muvaffaqiyatli ajratib olindi va sizga taqdim etildi!",
        errorTitle: "🚨 Tizimli Nosozlik Aniqlandi",
        errorDesc: "Instagram serveri bilan xavfsiz ulanish o'rnatib bo'lmadi yoki havola shaxsiy (private) profilga tegishli.",
        langSwitch: "🇺🇿 Til muvaffaqiyatli o'zgartirildi!"
    },
    en: {
        welcome: "👋 Hello! Welcome!\n\n🤖 <b>I am your intelligent assistant.</b>\n\n✨ <b>My capabilities:</b>\n📥 Send me an Instagram video link, and I will deliver it to you in the <b>highest and clearest quality</b>.\n🎵 A special button will appear below the video, allowing you to extract and download the audio separately.",
        downloading: "⏳ Analyzing the link. The video is downloading in high quality, please wait...",
        audioBtn: "🎵 Download Music",
        audioSuccess: "🎶 The music from the video was successfully extracted and delivered!",
        errorTitle: "🚨 System Error Detected",
        errorDesc: "Secure connection with Instagram server could not be established or the link belongs to a private profile.",
        langSwitch: "🇬🇧 Language successfully updated!"
    },
    ru: {
        welcome: "👋 Здравствуйте! Добро пожаловать!\n\n🤖 <b>Я ваш интеллектуальный помощник.</b>\n\n✨ <b>Мои возможности:</b>\n📥 Отправьте мне ссылку на video из Instagram, и я предоставлю его вам в <b>самом высоком и четком качестве</b>.\n🎵 Под видео появится специальная кнопка, нажав на которую, вы сможете отдельно скачать музыку из этого видео.",
        downloading: "⏳ Ссылка анализируется. Видео загружается в высоком качестве, пожалуйста, подождите...",
        audioBtn: "🎵 Скачать музыку",
        audioSuccess: "🎶 Музыка из видео была успешно извлечена и предоставлена вам!",
        errorTitle: "🚨 Обнаружена системная ошибка",
        errorDesc: "Не удалось установить безопасное соединение с сервером Instagram или ссылка принадлежит приватному профилю.",
        langSwitch: "🇷🇺 Язык успешно изменен!"
    }
};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const keyboard = {
        inline_keyboard: [
            [{ text: "🇺🇿 O'zbekcha", callback_data: "lang_uz" }, { text: "🇬🇧 English", callback_data: "lang_en" }],
            [{ text: "🇷🇺 Русский", callback_data: "lang_ru" }]
        ]
    };
    bot.sendMessage(chatId, "🌐 Tilni tanlang / Select language / Выберите язык:", { reply_markup: keyboard });
});

bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    bot.answerCallbackQuery(callbackQuery.id);

    if (data.startsWith("lang_")) {
        const selectedLang = data.split("_")[1];
        userStates[chatId] = { lang: selectedLang, lastAudioUrl: null, lastAudioTitle: null };
        await bot.sendMessage(chatId, `✨ <b>${localization[selectedLang].langSwitch}</b>`, { parse_mode: "HTML" });
        bot.sendMessage(chatId, localization[selectedLang].welcome, { parse_mode: "HTML" });
    }

    if (data === "extract_audio") {
        const currentLang = userStates[chatId]?.lang || 'uz';
        const audioUrl = userStates[chatId]?.lastAudioUrl;
        const audioTitle = userStates[chatId]?.lastAudioTitle || "Instagram Audio Track";

        if (audioUrl) {
            bot.sendMessage(chatId, `🎶 ${localization[currentLang].audioSuccess}`);
            bot.sendAudio(chatId, audioUrl, { caption: `🎵 ${audioTitle}\n\n🤖 Intellect Media Bot` });
        } else {
            bot.sendMessage(chatId, `❌ Audio topilmadi yoki muddati o'tgan.`);
        }
    }
});

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text ? msg.text.trim() : "";
    if (text.startsWith("/")) return;

    if (!userStates[chatId]) userStates[chatId] = { lang: 'uz', lastAudioUrl: null, lastAudioTitle: null };
    const currentLang = userStates[chatId].lang;
    const textLower = text.toLowerCase();

    if (textLower.includes("instagram.com/reel/") || textLower.includes("instagram.com/p/")) {
        bot.sendMessage(chatId, `⏳ ${localization[currentLang].downloading}`);
        try {
            const options = {
                method: 'GET',
                url: 'https://instagram-downloader-download-instagram-videos-stories.p.rapidapi.com/index',
                params: { url: text },
                headers: {
                    'x-rapidapi-key': 'YOUR_RAPIDAPI_KEY_HERE',
                    'x-rapidapi-host': 'instagram-downloader-download-instagram-videos-stories.p.rapidapi.com'
                }
            };
            const response = await axios.request(options);
            const mediaUrl = response.data.media;
            const audioUrl = response.data.audio || response.data.media;
            const title = response.data.title || "Instagram Video";

            if (mediaUrl) {
                userStates[chatId].lastAudioUrl = audioUrl;
                userStates[chatId].lastAudioTitle = title;
                const keyboard = { inline_keyboard: [[{ text: localization[currentLang].audioBtn, callback_data: "extract_audio" }]] };
                await bot.sendVideo(chatId, mediaUrl, {
                    caption: `🎬 <b>Video Muvaffaqiyatli Yuklandi!</b>\n\n✨ @MultiVisionRobot tizimi`,
                    parse_mode: "HTML",
                    reply_markup: keyboard
                });
            } else { throw new Error("Media topilmadi"); }
        } catch (error) {
            sendCodePenErrorBackend(chatId, currentLang, error.message);
        }
    } else {
        bot.sendMessage(chatId, localization[currentLang].welcome, { parse_mode: "HTML" });
    }
});

function sendCodePenErrorBackend(chatId, lang, errorMsg) {
    const err = localization[lang];
    const codePenTemplate = 
        `💻 <b>CODEPEN DIAGNOSTICS WINDOW</b> 💻\n----------------------------------------\n` +
        `❌ <b>${err.errorTitle}</b>\n📝 <i>Status: 500 Internal Media Fetch Error</i>\n----------------------------------------\n` +
        `<code>// Console Stack Trace:</code>\n<code>1. [Request] => Instagram API CDN</code>\n` +
        `<code>2. [Response] => 403 Forbidden / Error</code>\n<code>3. [Action] => ${err.errorDesc}</code>\n` +
        `<code>// Error Details: ${errorMsg}</code>\n----------------------------------------\n\n` +
        `💡 <i>Tavsiya: havola ochiq profilga tegishli ekanligini qayta tekshiring yoki server kalitlarini yangilang.</i>`;
    bot.sendMessage(chatId, codePenTemplate, { parse_mode: "HTML" });
}
