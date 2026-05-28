# 🏠 Emlak CRM - Mobil Portföy Yönetimi

Modern, mobil-uyumlu gayrimenkul CRM uygulaması. İlanlar, müşteriler ve otomatik eşleştirme sistemi ile yönetin.

## ✨ Özellikler

- 📋 **İlan Yönetimi** - İlan ekle, düzenle, sil ve ara
- 👥 **Müşteri Yönetimi** - Müşteri bilgileri ve bütçe takibi
- 🔗 **Otomatik Eşleştirme** - Müşteri ve ilanları manuel olarak eşleştir
- 💾 **LocalStorage** - Tüm veriler tarayıcıda kaydediliyor
- 📱 **Mobil Responsive** - Tüm cihazlarda mükemmel çalışır
- 🎨 **Modern Tasarım** - Dark mode arayüz

## 📁 Dosyalar

- `index.html` - Ana HTML dosyası
- `style.css` - Stil dosyası
- `app.js` - JavaScript mantığı

## 🚀 Kurulum

1. Üç dosyayı (`index.html`, `style.css`, `app.js`) aynı klasöre koy
2. `index.html` dosyasını bir tarayıcıda aç
3. Hazır! 🎉

## 💻 Kullanım

### Portföy Sekmesi
- **+** butonuna tıklayıp yeni ilanlar ekle
- Başlık, fiyat, şehir ve fotoğraf ekle
- Arama çubuğundan ilanları ara
- Düzenle/Sil butonlarıyla değişiklikleri yapabilir

### Müşteri Sekmesi
- **+** butonuna tıklayıp müşteri ekle
- Ad, telefon, email, bütçe ve tercih bilgileri gir
- Müşteri düzenle ve silebilir

### Eşleşme Sekmesi
- Müşteri ve İlan seç
- **Eşleştir** butonuna tıkla
- Tüm eşleşmeleri listede gör
- İhtiyaç duyarsan eşleştirmeyi silebilir

## 🛠️ Teknik

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: Browser LocalStorage
- **Icons**: Font Awesome 6.4.0
- **Responsive**: Mobile First Design

## 📊 Veri Yapısı

```json
{
  "portfolio": [
    {
      "id": 1234567890,
      "title": "Merkez İçi 3+1 Apartman",
      "price": 550000,
      "city": "İstanbul",
      "desc": "Yeni demirbaş",
      "photo": "data:image/..."
    }
  ],
  "customers": [
    {
      "id": 1234567890,
      "name": "Ahmet Yılmaz",
      "phone": "0555123456",
      "email": "ahmet@example.com",
      "budget": 600000,
      "preferences": "İstanbul Merkez, 3+ oda"
    }
  ],
  "matches": [
    {
      "id": 1234567890,
      "customerId": 1234567890,
      "propertyId": 1234567890
    }
  ]
}
```

## 🎯 Özellikler Güncelleme

Kendi ihtiyaçlarına göre kod özelleştirebilirsin:

1. **Renkleri Değiştir** - `style.css`'de `#fbbf24` (sarı) rengini değiştir
2. **Başlık Değiştir** - `index.html`'de "Emlak CRM" metnini değiştir
3. **Alanlar Ekle** - `app.js` ve `index.html` dosyalarına yeni input alanları ekle

## 📄 Lisans

Açık kaynak - İstediğin gibi kullanabilirsin

## 💡 İpuçları

- Tüm veriler localStorage'da saklandığından hiçbir hesap oluşturmana gerek yok
- Tarayıcı cache'ini temizlemesen tüm veriler korunur
- Mobil cihazda "Ekranı Kaydet" ile web uygulaması gibi kullanabilirsin

---

**Not**: Veriler sadece tarayıcında saklanıyor. Cihazı değiştirirsen veriler kaybolur. Yedek almak için dışa aktarma özelliği ekleyebilirsin.
