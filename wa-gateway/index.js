const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const { Boom } = require("@hapi/boom");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const qrcode = require("qrcode");
const cors = require("cors");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

let sock;
let qrCodeString = null;
let connectionStatus = "Disconnected";

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info_baileys'));
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
        version,
        logger: pino({ level: "silent" }),
        printQRInTerminal: true, // Tetap muncul di terminal untuk debug
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCodeString = qr;
            qrcode.toDataURL(qr, (err, url) => {
                if (!err) {
                    io.emit("qr", url);
                    io.emit("status", "Scan QR Code untuk Menghubungkan");
                }
            });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect.error instanceof Boom) ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : true;
            connectionStatus = "Disconnected";
            io.emit("status", "Disconnected");
            io.emit("authenticated", false);
            console.log("Connection closed. Reconnecting...", shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === "open") {
            connectionStatus = "Connected";
            qrCodeString = null;
            io.emit("status", "Connected");
            io.emit("authenticated", true);
            io.emit("qr", null); // Clear QR on client
            console.log("WhatsApp Connected!");
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

// API Endpoints
app.post("/send-message", async (req, res) => {
    const { number, message } = req.body;
    
    if (!sock || connectionStatus !== "Connected") {
        return res.status(500).json({ status: "error", message: "WhatsApp not connected" });
    }

    try {
        // Bersihkan nomor (hilangkan +, spasi, dll)
        let cleanNumber = number.replace(/[^0-9]/g, '');
        
        // Pastikan format 62
        if (cleanNumber.startsWith('0')) {
            cleanNumber = '62' + cleanNumber.slice(1);
        }
        
        const jid = `${cleanNumber}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });
        
        res.json({ status: "success", message: "Message sent" });
    } catch (error) {
        console.error("Send Error:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

app.get("/status", (req, res) => {
    res.json({ status: connectionStatus });
});

// Socket logic
io.on("connection", (socket) => {
    console.log("Web Client Connected");
    socket.emit("status", connectionStatus);
    
    if (qrCodeString && connectionStatus !== "Connected") {
        qrcode.toDataURL(qrCodeString, (err, url) => {
            if (!err) socket.emit("qr", url);
        });
    }

    if (connectionStatus === "Connected") {
        socket.emit("authenticated", true);
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`WA Gateway Server running on port ${PORT}`);
    connectToWhatsApp();
});
