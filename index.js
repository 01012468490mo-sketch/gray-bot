console.log("Gray Bot is running... 🍷");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => { res.send("Gray Bot is Online! 🍷"); });
app.listen(PORT, () => console.log("Bot online 🍷"));
let muted = [];
async function start() {
    const { state, saveCreds } = await useMultiFileAuthState("session");
    const sock = makeWASocket({ auth: state, printQRInTerminal: true });
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", (u) => {
        const { connection, lastDisconnect } = u;
        if (connection === "close") {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if (shouldReconnect) start();
        } else if (connection === "open") console.log("✅ Gray Connected! 🍷");
    });
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message) return;
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        if (!from.endsWith("@g.us")) return;
        const group = await sock.groupMetadata(from);
        const participants = group.participants;
        const isSenderAdmin = participants.find(p => p.id === sender)?.admin === "admin" || participants.find(p => p.id === sender)?.admin === "superadmin";
        const isBotAdmin = participants.find(p => p.id === sock.user.id)?.admin === "admin" || participants.find(p => p.id === sock.user.id)?.admin === "superadmin";
        const isOwner = msg.key.fromMe;
        if (muted.includes(sender) && !isSenderAdmin) {
            try { await sock.sendMessage(from, { delete: msg.key }); } catch {}
            return;
        }
        if (!text.startsWith(".")) return;
        if (!isSenderAdmin && !isOwner) return;
        const cmd = text.trim().toLowerCase();
        const reply = (t) => sock.sendMessage(from, { text: t }, { quoted: msg });
        const mentioned = msg.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
        const quotedUser = msg.message.extendedTextMessage?.contextInfo?.participant;
        const quotedKey = msg.message.extendedTextMessage?.contextInfo?.stanzaId;
        const emojiMap = { ".بوت": "🍷", ".الاوامر": "📜", ".اوامر": "📜", ".طرد": "👢", ".قفل": "🔒", ".فتح": "🔓", ".ترقيه": "👑", ".ترقية": "👑", ".تنزيل": "⬇️", ".منشن": "📢", ".كتم": "🔇", ".فك": "🔊", ".حذف": "🗑️", ".تحذير": "⚠️", ".انمي": "🎌" };
        let reactEmoji = "🍷";
        for (let k in emojiMap) { if (cmd.startsWith(k)) { reactEmoji = emojiMap[k]; break; } }
        try { await sock.sendMessage(from, { react: { text: reactEmoji, key: msg.key } }); } catch {}
        if (cmd === ".بوت") await reply("🍷 موجود يا معلم! Gray شغال وتحت امرك");
        else if (cmd === ".الاوامر" || cmd === ".اوامر") {
            await reply(`📜 *اوامر Gray:*\n🍷 .بوت\n📜 .الاوامر\n👢 .طرد @حد\n🔒 .قفل\n🔓 .فتح\n👑 .ترقيه @حد\n⬇️ .تنزيل @حد\n📢 .منشن\n🔇 .كتم @حد\n🔊 .فك @حد\n🗑️ .حذف\n⚠️ .تحذير @حد\n🎌 .انمي`);
        }
        else if (cmd.startsWith(".طرد")) {
            if (!isBotAdmin) return reply("👢 لازم تخلي البوت مشرف الاول");
            const target = mentioned || quotedUser;
            if (!target) return reply("👢 منشن اللي عايز تطرده");
            await sock.groupParticipantsUpdate(from, [target], "remove");
            await reply("👢 اتطرد خلاص");
        }
        else if