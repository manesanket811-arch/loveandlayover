# Love and Layovers 🌍✈️

Real travel stories, honest tips, and ready-to-use itineraries. Your companion for planning unforgettable trips.

Website: [loveandlayovers.com](https://loveandlayovers.com)  
YouTube: [@LoveAndLayover](https://www.youtube.com/@LoveAndLayover)  
Instagram: [@loveandlayover](https://www.instagram.com/loveandlayover/)  

---

## 📋 Project Structure

```
website/
├── index.html                    # Main website (single-page app)
├── lambda_handler.py             # AWS Lambda backend
├── template.yaml                 # AWS SAM infrastructure
├── requirements.txt              # Python dependencies
├── AWS_DEPLOYMENT_GUIDE.md      # Complete deployment instructions
├── README.md                     # This file
├── /itineraries/                # PDF itineraries (not tracked)
└── /assets/                     # Images, fonts, etc.
```

---

## ✨ Features

### Website
- **Responsive Design**: Beautiful on desktop, tablet, and mobile
- **Hero Section**: Eye-catching introduction with travel stats
- **Video Section**: Latest YouTube videos (auto-integrated)
- **Destination Guides**: Detailed itineraries (Singapore featured)
- **Email Subscription**: Free signup for updates
- **Contact Form**: Message us directly
- **Analytics Tracking**: Google Analytics integration
- **Instagram Integration**: @loveandlayover feed link

### Backend (AWS)
- **Email Service**: AWS SES for confirmations
- **Database**: DynamoDB for subscribers, contacts, and download tracking
- **File Storage**: S3 for PDF itineraries
- **API**: Lambda + API Gateway for all operations
- **CDN**: CloudFront for fast global delivery
- **Analytics**: Track subscriptions, downloads, and user behavior

---

## 🚀 Quick Start

### Local Testing

1. **Open website locally**:
   ```bash
   # Just open index.html in your browser
   open index.html
   # Or use a simple server
   python -m http.server 8000
   ```

2. **Update YouTube channel URL** in `index.html`:
   ```javascript
   const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@LoveAndLayover';
   ```

3. **Update API endpoint** (after AWS deployment):
   ```javascript
   const API_ENDPOINT = 'https://YOUR_API_ENDPOINT';
   ```

### Deploy to AWS

Follow the **[AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md)** for:
1. Setting up AWS SES
2. Deploying Lambda backend
3. Uploading to S3 + CloudFront
4. Configuring custom domain
5. Testing everything

---

## 🌍 Current Destinations

### Singapore (Featured)
- **Food & Culture Tour** (4 days)
- **Gardens & Parks** (3 days)  
- **Complete City Explorer** (5 days)

More destinations coming soon!

---

## 📊 Analytics & Tracking

### What We Track
- Visitor analytics (Google Analytics)
- Email subscriptions
- Contact form submissions
- Itinerary downloads
- YouTube video clicks
- Instagram link visits

### Dashboard
Access analytics at [Google Analytics](https://analytics.google.com) with your account.

---

## 💬 Forms & Emails

### Email Signup
- Subscribers saved to DynamoDB
- Confirmation email sent via SES
- Users can download itineraries

### Contact Form
- Submissions saved to DynamoDB
- Email sent to `hello@loveandlayovers.com`
- User gets confirmation email

### Download Itinerary
- Email required to download
- Download logged for analytics
- PDF fetched from S3

---

## 🛠️ Customization

### Colors & Branding
Edit CSS variables in `index.html`:
```css
:root {
  --ink: #1a2332;          /* Primary dark color */
  --accent: #ff6b35;       /* Main accent (was coral) */
  --secondary: #f7931e;    /* Secondary accent (was tang) */
  --teal: #0fb6a8;         /* Teal accent */
}
```

### Hero Section
Update headline, description, and stats in the hero section HTML.

### Itineraries
Add new destination section:
```html
<a class="gcard reveal" href="#contact" data-destination="tokyo" data-itinerary="food-crawl">
  <div class="gtop t1"><span class="badge">🍜 Food</span><div class="days"><span class="nn">5</span><span class="dd">days</span></div></div>
  <div class="gbody"><h3>Tokyo Street Food</h3><p>Description...</p><span class="link">Download →</span></div>
</a>
```

### Contact Info
Update in the Contact section:
```html
<a class="chan" href="mailto:hello@loveandlayovers.com">
  <div class="ic em">✉</div>
  <div><div class="t">Email</div><div class="s">hello@loveandlayovers.com</div></div>
</a>
```

---

## 📱 Performance Optimizations

- **Lazy Loading**: Images load on scroll
- **CSS Optimization**: Minified inline styles
- **CloudFront CDN**: Fast global delivery
- **Compression**: Gzip enabled
- **Caching**: 1 year for static assets

---

## 🔒 Security

- **HTTPS**: CloudFront enforces HTTPS
- **CORS**: Configured for API requests
- **Email Validation**: Server-side validation
- **DynamoDB**: No public access
- **S3**: Private buckets with CloudFront access only

---

## 🚨 Important: Before Going Live

1. ✅ **Verify SES email** or request production access
2. ✅ **Update Google Analytics ID** (replace G-XXXXXXXXXX)
3. ✅ **Set API endpoint** in index.html
4. ✅ **Upload itinerary PDFs** to S3
5. ✅ **Test all forms** (subscription, contact, download)
6. ✅ **Set custom domain** (optional but recommended)
7. ✅ **Enable CloudFront invalidation** for faster updates
8. ✅ **Monitor AWS costs** (should be $5-20/month)

---

## 📞 Support & Next Steps

### For More Features
- **YouTube API Integration**: Auto-fetch latest videos
- **Blog System**: Add travel articles
- **Newsletter**: Send email campaigns to subscribers
- **Analytics Dashboard**: Build custom dashboard
- **Mobile App**: React Native or Flutter

### Get Help
- AWS: [docs.aws.amazon.com](https://docs.aws.amazon.com)
- SES: [AWS SES Console](https://console.aws.amazon.com/ses)
- Lambda: [AWS Lambda Console](https://console.aws.amazon.com/lambda)

---

## 📈 Growth Ideas

1. **Content**: Add 5-10 more destination guides
2. **Engagement**: Monthly newsletter with travel tips
3. **Community**: Add comment section for itineraries
4. **Monetization**: Affiliate links for hotels/flights
5. **Analytics**: Track which destinations are most popular
6. **Social**: Share buttons for each itinerary

---

## 📄 License

Created with love for travel enthusiasts. Feel free to customize and adapt!

---

**Happy travels!** ✈️

Made with ❤️ by Love and Layovers
