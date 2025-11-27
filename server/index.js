require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
// PENTING: Ganti origin dengan URL frontend Vercel kamu nanti saat produksi
app.use(cors({
    origin: "https://web-belajar-ai-pbta-i3bjo5ikh-farhandavins-projects.vercel.app/", // Sementara boleh begini, nanti ganti ke URL frontend kamu
    methods: ["GET", "POST"]
}));
app.use(express.json());

// --- PERBAIKAN 1: File Upload untuk Vercel ---
// Vercel hanya mengizinkan tulis file di folder '/tmp'
const upload = multer({ dest: '/tmp/' });

// Konfigurasi Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// --- PERBAIKAN 2: Database Cloud ---
// Jangan hardcode password di sini! Gunakan Environment Variables
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Gunakan format URL koneksi (misal dari Supabase/Neon)
    ssl: {
        rejectUnauthorized: false // Wajib untuk sebagian besar Cloud Database
    }
});

// ROUTE: Cek Server
app.get('/', (req, res) => {
    res.send('Server AI Berjalan!');
});

// ROUTE: Membuat Soal
app.post('/api/buat-kuis', upload.single('file_materi'), async (req, res) => {
    const { text_materi } = req.body;
    const file = req.file;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // Pastikan model version benar
        let promptContent = [];

        // 1. Cek apakah user upload file
        if (file) {
            console.log("Mengupload file...", file.originalname);

            const uploadResponse = await fileManager.uploadFile(file.path, {
                mimeType: file.mimetype,
                displayName: file.originalname,
            });

            promptContent.push({
                fileData: {
                    mimeType: uploadResponse.file.mimeType,
                    fileUri: uploadResponse.file.uri
                }
            });
        }
        // 2. Jika tidak ada file, cek teks
        else if (text_materi) {
            promptContent.push({ text: text_materi });
        } else {
            return res.status(400).json({ success: false, message: "Materi kosong" });
        }

        // Prompt Instruksi
        promptContent.push({
            text: `
            Buatkan 10 soal pilihan ganda beserta kunci jawabannya berdasarkan materi ini buatkan sangat rumit.
            OUTPUT WAJIB JSON MURNI TANPA MARKDOWN:
            [{"soal": "...", "pilihan": ["A...", "B..."], "jawaban_benar": "..."}]
        `});

        const result = await model.generateContent(promptContent);
        const response = await result.response;

        let textResult = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        
        // Error handling jika JSON rusak
        let kuisData;
        try {
            kuisData = JSON.parse(textResult);
        } catch (e) {
            console.error("Gagal parsing JSON dari AI:", textResult);
            return res.status(500).json({ success: false, message: "Gagal memproses respon AI" });
        }

        // Hapus file sementara di /tmp agar storage tidak penuh
        if (file && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Simpan ke Database Cloud
        const tipe = file ? 'file' : 'text';
        await pool.query(
            'INSERT INTO riwayat_kuis (materi, soal_jawaban, tipe_sumber) VALUES ($1, $2, $3)',
            [file ? file.originalname : text_materi, JSON.stringify(kuisData), tipe]
        );

        res.json({ success: true, data: kuisData });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- PERBAIKAN 3: Handler Vercel ---
if (require.main === module) {
    app.listen(port, () => {
        console.log(`Server berjalan di port ${port}`);
    });
}

module.exports = app;