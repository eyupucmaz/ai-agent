# AI Code Agent - PRD (Product Requirements Document)

## Ürün Özeti

AI Code Agent, geliştiricilerin GitHub repolarını AI ile entegre etmelerini sağlayan, kod tabanını anlayan ve geliştirme sürecinde yardımcı olan bir araçtır. Google Gemini API kullanarak, kod tabanı üzerinde akıllı sorgular yapabilir, kod önerileri alabilir ve otomatik düzeltmeler uygulayabilirsiniz.

## Temel Özellikler

### 1. GitHub Entegrasyonu ve Kullanıcı Yönetimi

- GitHub OAuth ile kullanıcı girişi
- Kullanıcının GitHub repolarına erişim ve listeleme
- Seçilen reponun otomatik indekslenmesi ve vektör veritabanına kaydedilmesi

### 2. Kod Tabanı İndeksleme ve AI Eğitimi

- GitHub repo URL'si ile otomatik kod indeksleme
- Kod yapısının vektör veritabanında (MongoDB) saklanması
- Gemini AI modelinin kod tabanı üzerinde eğitilmesi
- Gerçek zamanlı kod analizi ve indeksleme durumu takibi

### 3. AI Chat Arayüzü

- ChatGPT benzeri modern ve kullanıcı dostu arayüz
- Syntax highlighting ile renklendirilmiş kod yanıtları
- Dosya seçme ve spesifik kod parçaları üzerinde sorgulama yapabilme
- Kod oluşturma, düzenleme ve hata düzeltme önerileri
- Sohbet geçmişi ve bağlam takibi

## Teknik Mimari

### Frontend

- React + TypeScript
- Vite build tool
- Önemli Kütüphaneler:
  - React Router (sayfa yönetimi)
  - CodeMirror/Monaco Editor (kod görüntüleme/düzenleme)
  - Axios (HTTP istekleri)
  - TailwindCSS (stil)
  - React Query (veri yönetimi)

### Backend

- Node.js + Express.js
- Önemli Özellikler:
  - RESTful API endpoints
  - WebSocket desteği (gerçek zamanlı iletişim)
  - GitHub API entegrasyonu
  - Google Gemini API entegrasyonu
  - Vektör veritabanı yönetimi

### Veritabanı

- MongoDB
  - Kullanıcı bilgileri
  - Repo meta verileri
  - Vektör indeksleri
  - Sohbet geçmişi

## Güvenlik Gereksinimleri

- GitHub OAuth 2.0 güvenli kimlik doğrulama
- API anahtarlarının güvenli yönetimi
- Rate limiting ve DDoS koruması
- Kullanıcı verilerinin şifrelenmesi

## Performans Gereksinimleri

- Sayfa yüklenme süresi < 2 saniye
- AI yanıt süresi < 3 saniye
- Concurrent kullanıcı desteği
- Ölçeklenebilir veritabanı yapısı

## API Endpoints

### Auth Endpoints

```http
POST /api/auth/github/login     # GitHub OAuth başlatma
GET  /api/auth/github/callback  # GitHub OAuth callback
POST /api/auth/logout          # Oturum kapatma
GET  /api/auth/me              # Mevcut kullanıcı bilgisi
```

### GitHub Endpoints

```http
GET  /api/github/repos                    # Kullanıcının repolarını listele
POST /api/github/repos/index              # Repo indekslemeyi başlat
GET  /api/github/repos/:owner/:repo       # Repo detaylarını getir
GET  /api/github/repos/:owner/:repo/files # Repo dosyalarını listele
GET  /api/github/repos/:owner/:repo/file  # Belirli bir dosyanın içeriğini getir
```

### Gemini AI Endpoints

```http
POST /api/ai/chat                # AI ile sohbet
POST /api/ai/analyze            # Kod analizi
POST /api/ai/suggest            # Kod önerisi
POST /api/ai/fix                # Hata düzeltme
GET  /api/ai/chat/history       # Sohbet geçmişi
```

### Database Endpoints

```http
GET    /api/db/vectors/:repoId  # Repo vektörlerini getir
POST   /api/db/vectors/search   # Vektör araması yap
DELETE /api/db/vectors/:repoId  # Repo vektörlerini sil
```

### WebSocket Endpoints

```websocket
ws://api/ws/indexing  # İndeksleme durumu takibi
ws://api/ws/chat     # Gerçek zamanlı AI sohbet
```

## Kurulum

```bash
# Frontend kurulumu
cd frontend
npm install
npm run dev

# Backend kurulumu
cd backend
npm install
npm run dev
```

## Ortam Değişkenleri

```env
# Backend
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GEMINI_API_KEY=
MONGODB_URI=

# Frontend
VITE_API_URL=
```

## Katkıda Bulunma

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Lisans

MIT License
