const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Gemini API yapılandırması
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI ile sohbet endpoint'i
router.post('/chat', async (req, res) => {
    try {
        const { message, context } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const result = await model.generateContent(message);
        const response = await result.response;

        res.json({
            success: true,
            message: response.text()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Kod analizi endpoint'i
router.post('/analyze', async (req, res) => {
    try {
        const { code } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Lütfen aşağıdaki kodu analiz et ve potansiyel iyileştirmeler öner:\n\n${code}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({
            success: true,
            analysis: response.text()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Kod önerisi endpoint'i
router.post('/suggest', async (req, res) => {
    try {
        const { description } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Aşağıdaki açıklama için kod önerisi oluştur:\n\n${description}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({
            success: true,
            suggestion: response.text()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Hata düzeltme endpoint'i
router.post('/fix', async (req, res) => {
    try {
        const { code, error } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `Aşağıdaki kodda bulunan hatayı düzelt:\n\nKod:\n${code}\n\nHata:\n${error}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({
            success: true,
            fix: response.text()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Sohbet geçmişi endpoint'i
router.get('/chat/history', async (req, res) => {
    try {
        // TODO: Veritabanından kullanıcının sohbet geçmişini getir
        res.json({
            success: true,
            history: []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;