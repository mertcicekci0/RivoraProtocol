# ML Model Training Guide

Bu rehber, Stellar wallet verilerinden ML modeli eğitmek için gereken adımları açıklar.

## 🎯 Genel Bakış

Sistem iki neural network modeli eğitir:
- **Risk Score Model**: Wallet güvenilirliğini 0-100 arası tahmin eder
- **Health Score Model**: Portfolio sağlığını 0-100 arası tahmin eder

## 📋 Gereksinimler

- Node.js 18+
- npm veya yarn
- İnternet bağlantısı (Horizon API erişimi için)

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükle

```bash
npm install
```

### 2. Veri Toplama

Stellar network'ten otomatik olarak wallet verilerini topla:

```bash
npm run collect-data
```

Bu script:
- Horizon API'den aktif wallet adresleri bulur
- Her wallet için portfolio verilerini çeker
- Features ve scores hesaplar
- `training-data.json` dosyasına kaydeder

**Not**: İlk çalıştırmada script otomatik olarak wallet adresleri bulmaya çalışır. Eğer yeterli veri bulamazsa, `scripts/collect-training-data.ts` dosyasındaki `getFallbackWalletAddresses()` fonksiyonuna gerçek Stellar wallet adresleri ekleyebilirsiniz.

### 3. Model Eğitimi

Toplanan verilerle modelleri eğit:

```bash
npm run train-model
```

Bu script:
- `training-data.json` dosyasını okur
- Risk ve Health score modellerini eğitir
- Model sonuçlarını konsola yazdırır

### 4. Her İkisini Birden

Veri toplama ve eğitimi tek komutla yap:

```bash
npm run ml-setup
```

## 📊 Veri Formatı

Training data JSON formatı:

```json
[
  {
    "features": {
      "accountAgeDays": 365,
      "totalTransactions": 245,
      "transactionFrequency": 81.67,
      "pathPaymentRatio": 0.3,
      "assetCount": 6,
      "portfolioConcentration": 0.42,
      "trustedAssetRatio": 0.83,
      "successRate": 1.0
    },
    "riskScore": 72.5,
    "healthScore": 68.3
  }
]
```

### Features Açıklaması

- **accountAgeDays**: Hesap yaşı (gün)
- **totalTransactions**: Toplam transaction sayısı
- **transactionFrequency**: Aylık transaction frekansı
- **pathPaymentRatio**: Path payment (smart swap) oranı
- **assetCount**: Farklı asset sayısı
- **portfolioConcentration**: Portfolio konsantrasyonu (HHI index)
- **trustedAssetRatio**: Güvenilir asset oranı
- **successRate**: İşlem başarı oranı

## 🔧 Manuel Wallet Adresi Ekleme

Eğer otomatik veri toplama yeterli veri bulamazsa:

1. [Stellar Explorer](https://stellar.expert/explorer/public) adresine git
2. Public wallet adreslerini bul
3. `scripts/collect-training-data.ts` dosyasını aç
4. `getFallbackWalletAddresses()` fonksiyonuna adresleri ekle:

```typescript
function getFallbackWalletAddresses(count: number): string[] {
  const knownWallets = [
    'GABC123...', // Gerçek Stellar public key (56 karakter)
    'GDEF456...',
    // ... daha fazla
  ];
  return knownWallets.slice(0, count);
}
```

## 🎓 Model Mimarisi

Her model basit bir neural network:
- **Input Layer**: 9 normalized features
- **Hidden Layer 1**: 16 units (ReLU)
- **Hidden Layer 2**: 8 units (ReLU)
- **Output Layer**: 1 unit (Linear, 0-100 score)

Training parametreleri:
- **Epochs**: 100
- **Batch Size**: 32 (veya veri sayısı)
- **Optimizer**: Adam (learning rate: 0.01)
- **Loss**: Mean Squared Error

## 📈 Minimum Veri Gereksinimleri

- **Minimum**: 5 örnek
- **Önerilen**: 10-20 örnek
- **İdeal**: 50+ örnek (daha iyi genelleme için)

## 🔄 Model Kullanımı

Modeller otomatik olarak yüklenir ve API'de kullanılır:

```typescript
// API'de otomatik kullanım
const scores = await calculateScores(walletAddress);

// ML model yüklüyse kullanılır, değilse rule-based'e fallback yapar
```

## 🐛 Sorun Giderme

### "Not enough training data" Hatası

- Daha fazla wallet adresi ekle
- `getFallbackWalletAddresses()` fonksiyonunu doldur
- Manuel olarak `training-data.json` dosyası oluştur

### "Model not loaded" Durumu

- Modeller her API çağrısında yüklenmez, memory'de tutulur
- İlk eğitim sonrası modeller hazır olmalı
- Rule-based sistem her zaman fallback olarak çalışır

### Horizon API Rate Limiting

- Script'te 300ms delay var
- Çok fazla request yapıyorsan delay'i artır
- Alternatif olarak manuel veri topla

## 📝 Notlar

- Modeller in-memory tutulur (sunucu restart sonrası yeniden eğitim gerekir)
- Production'da modeli dosyaya kaydetmek için ek kod gerekir
- Bu hackathon versiyonu - production için daha fazla veri ve optimizasyon önerilir

## 🎉 Başarı!

Model eğitimi tamamlandığında, API otomatik olarak ML tahminlerini kullanmaya başlar!

