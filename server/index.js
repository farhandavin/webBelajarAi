require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer'); // Wajib ada untuk upload
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server"); 

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Konfigurasi Upload File (Disimpan sementara di folder 'uploads')
const upload = multer({ dest: 'uploads/' });

// Konfigurasi Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const fileManager = new GoogleAIFileManager(process.env.GEMINI_API_KEY);

// Konfigurasi Database PostgreSQL
const pool = new Pool({
    user: 'postgres',        // Pastikan ini benar
    host: 'localhost',
    database: 'belajar_ai',
    password: 'FarhanDR14@', 
    port: 5432,
});

// ROUTE: Membuat Soal (Support Teks & File)
app.post('/api/buat-kuis', upload.single('file_materi'), async (req, res) => {
    const { text_materi } = req.body;
    const file = req.file; 

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
        promptContent.push({ text: `
            Buatkan 10 soal pilihan ganda beserta kunci jawabannya berdasarkan materi ini buatkan sangat rumit.
            OUTPUT WAJIB JSON MURNI:
            [{"soal": "...", "pilihan": ["A...", "B..."], "jawaban_benar": "..."}]
        `});

        const result = await model.generateContent(promptContent);
        const response = await result.response;
        
        let textResult = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        const kuisData = JSON.parse(textResult);

        // Hapus file sementara
        if (file) fs.unlinkSync(file.path);

        // Simpan ke Database (Versi Lengkap dengan tipe_sumber)
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

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});