# Love and Layovers - Go Live Checklist

Complete this checklist before launching your website to production.

---

## 🔧 Pre-Deployment Setup

- [ ] AWS Account created and verified
- [ ] AWS credentials configured locally
- [ ] AWS CLI installed and working
- [ ] SAM CLI installed and working
- [ ] Python 3.9+ installed
- [ ] Git repository initialized
- [ ] All files committed to git

---

## 🌐 Domain & DNS

- [ ] Domain name purchased (loveandlayovers.com)
- [ ] Domain registrar selected (GoDaddy, Namecheap, Route53, etc.)
- [ ] Domain DNS records accessible
- [ ] SSL certificate plan decided (CloudFront default or custom)

---

## 📧 Email Configuration

- [ ] AWS SES email verified: `hello@loveandlayovers.com`
- [ ] Check verification email received and confirmed
- [ ] SES sandbox request submitted (for production sending)
  - [ ] Application approved
  - [ ] Sandbox mode disabled
- [ ] Bounce and complaint emails configured (recommended)
- [ ] Alternative email for backups configured (optional)

---

## 📋 Content & Configuration

- [ ] Brand name updated (Love and Layovers ✓)
- [ ] Logo/emoji updated (❤️ ✓)
- [ ] Hero section text customized
- [ ] YouTube channel URL updated: `https://www.youtube.com/@LoveAndLayover` ✓
- [ ] Instagram link updated: `https://www.instagram.com/loveandlayover/` ✓
- [ ] Email address updated: `hello@loveandlayovers.com` ✓
- [ ] Singapore itineraries created (3 PDFs)
  - [ ] Singapore Food & Culture (4 days)
  - [ ] Singapore Gardens & Nature (3 days)
  - [ ] Singapore City Explorer (5 days)
- [ ] Google Analytics ID obtained and updated (G-XXXXXXXXXX)
- [ ] All placeholder text removed

---

## ☁️ AWS Deployment

- [ ] Template.yaml reviewed and customized
- [ ] Lambda function code reviewed
- [ ] DynamoDB table names confirmed
- [ ] S3 bucket names generated (unique)
- [ ] SAM template built successfully
  ```bash
  sam build
  ```
- [ ] Stack deployed successfully
  ```bash
  sam deploy --guided
  ```
- [ ] CloudFormation outputs saved:
  - [ ] API Endpoint URL
  - [ ] Website S3 bucket name
  - [ ] Itineraries S3 bucket name
  - [ ] CloudFront distribution ID

---

## 💾 Upload Files to S3

- [ ] Website files uploaded to S3
  ```bash
  aws s3 cp index.html s3://$WEBSITE_BUCKET/
  ```
- [ ] Itinerary PDFs created
- [ ] Singapore itineraries uploaded
  ```bash
  aws s3 cp singapore-food-culture.pdf s3://$ITINERARY_BUCKET/singapore/
  aws s3 cp singapore-gardens-nature.pdf s3://$ITINERARY_BUCKET/singapore/
  aws s3 cp singapore-city-explorer.pdf s3://$ITINERARY_BUCKET/singapore/
  ```
- [ ] S3 bucket permissions verified (private with CloudFront access)
- [ ] CloudFront origin access identity configured

---

## 🔗 API Integration

- [ ] API endpoint URL determined
- [ ] API endpoint URL added to index.html:
  ```javascript
  const API_ENDPOINT = 'https://YOUR_API_ENDPOINT/Prod';
  ```
- [ ] Website re-uploaded to S3
- [ ] CORS headers configured in API
- [ ] Lambda environment variables set correctly

---

## 🧪 Testing (Critical!)

### Subscribe Function
- [ ] Test subscription form locally
  ```bash
  curl -X POST $API_ENDPOINT/subscribe \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","source":"test"}'
  ```
- [ ] Confirmation email received
- [ ] Email in DynamoDB table
- [ ] Test with invalid email (should fail gracefully)

### Contact Form
- [ ] Test contact form locally
- [ ] Email received at hello@loveandlayovers.com
- [ ] User confirmation email sent
- [ ] Data appears in DynamoDB

### Itinerary Download
- [ ] Test download with valid email
- [ ] PDF downloads correctly
- [ ] Download logged in DynamoDB
- [ ] Test with invalid email (should prompt signup)
- [ ] Test with non-existent destination (should fail gracefully)

### Website
- [ ] All links working
- [ ] Navigation smooth
- [ ] Mobile responsive (test on phone)
- [ ] Images load correctly
- [ ] Forms display properly
- [ ] No console errors
- [ ] Google Analytics firing events

---

## 📊 Analytics Setup

- [ ] Google Analytics account created
- [ ] Measurement ID obtained
- [ ] Measurement ID added to index.html
- [ ] Website re-uploaded to S3
- [ ] Analytics loading (check browser console)
- [ ] Test events firing:
  - [ ] Page views
  - [ ] Email subscription
  - [ ] Contact submission
  - [ ] Itinerary download
  - [ ] YouTube click
  - [ ] Instagram link click

---

## 🌐 Domain Setup

- [ ] CloudFront distribution configured with custom domain
- [ ] ACM certificate created (HTTPS)
  - [ ] Certificate requested
  - [ ] CNAME records added to DNS
  - [ ] Certificate validated
- [ ] CloudFront origin headers configured
- [ ] DNS CNAME pointing to CloudFront domain
  ```
  loveandlayovers.com → dXXXXXXXXXXXXXX.cloudfront.net
  ```
- [ ] DNS propagation verified (5-30 mins)
- [ ] HTTPS working (lock icon in browser)

---

## 🔒 Security Review

- [ ] S3 buckets set to private (no public access)
- [ ] CloudFront accessing S3 only via OAI
- [ ] IAM role permissions minimal (least privilege)
- [ ] SES verified email only (no sandbox)
- [ ] API Gateway CORS configured correctly
- [ ] No secrets in code or git
- [ ] No test/demo data in production databases
- [ ] HTTPS enforced everywhere
- [ ] Cookies/data storage policy added (if needed)

---

## 📈 Monitoring Setup

- [ ] CloudWatch logs configured
- [ ] Lambda error alerts set up (optional)
- [ ] DynamoDB monitoring enabled
- [ ] S3 cost monitoring enabled
- [ ] Budget alerts configured (to avoid surprises)
- [ ] SAM CLI logs working locally
  ```bash
  sam logs -n APIFunction -t
  ```

---

## 📱 Marketing Checklist

- [ ] YouTube channel linked from website
- [ ] Instagram account linked from website
- [ ] Email verification working
- [ ] Test unsubscribe flow
- [ ] Privacy policy added (if required)
- [ ] Terms of service added (if required)
- [ ] About page content finalized
- [ ] Contact info all verified

---

## 🚀 Final Pre-Launch

- [ ] Full end-to-end test (sign up → download itinerary)
- [ ] All team members test on their devices
- [ ] Mobile (iOS + Android) testing
- [ ] Desktop (Chrome, Firefox, Safari) testing
- [ ] Test on slow internet (simulate poor connection)
- [ ] Load test (simulate multiple users)
- [ ] Backup DynamoDB data
- [ ] Backup S3 files
- [ ] Document all URLs and passwords (secure location)

---

## 📢 Launch Day

- [ ] Check all services healthy:
  - [ ] CloudFront serving website
  - [ ] Lambda responding
  - [ ] DynamoDB accessible
  - [ ] SES ready to send
- [ ] Do one final test from your phone
- [ ] Monitor logs for first 1 hour
- [ ] Check Google Analytics for visitors
- [ ] Be ready for support emails

---

## 🎉 Post-Launch (First Week)

- [ ] Monitor daily (logs, analytics, errors)
- [ ] Respond to first subscriber emails
- [ ] Check for any bugs or issues
- [ ] Monitor AWS costs
- [ ] Promote on YouTube & Instagram
- [ ] Share with friends and family
- [ ] Gather feedback

---

## 📝 Maintenance Plan

- [ ] Weekly: Check logs for errors
- [ ] Weekly: Monitor AWS costs
- [ ] Monthly: Review subscriber list
- [ ] Monthly: Update content/new destinations
- [ ] Monthly: Check analytics trends
- [ ] Quarterly: Review security settings
- [ ] Quarterly: Backup data to safe location

---

## 🆘 Emergency Contacts

- [ ] AWS Support phone number
- [ ] AWS Account manager (if applicable)
- [ ] Registrar support for domain issues
- [ ] Email provider support (SES)

---

## 📚 Documentation

- [ ] README.md updated with launch info
- [ ] AWS_DEPLOYMENT_GUIDE.md completed
- [ ] QUICK_REFERENCE.md saved for daily use
- [ ] Credentials stored securely (password manager)
- [ ] DNS records documented
- [ ] SSL certificate details saved
- [ ] API endpoints documented

---

## ✅ Launch Sign-Off

- [ ] All checklist items completed
- [ ] No known bugs or issues
- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Monitoring in place
- [ ] Ready to launch!

**Launch Date: _______________**

**Launched by: ________________**

**Notes:**
```




```

---

## Post-Launch Support

### First Issues & Fixes

If something breaks:

1. **API not responding**
   ```bash
   sam logs -n APIFunction -t | tail -50
   ```

2. **Website not updating**
   ```bash
   aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
   ```

3. **Emails not sending**
   - Check SES sandbox status
   - Verify sender email confirmed
   - Check Lambda logs

4. **Database issues**
   - Check DynamoDB write/read capacity
   - Monitor for hot partitions

---

**You're ready to launch!** 🚀

Remember: Start with Singapore, then add more destinations. Build gradually and listen to user feedback.

Happy travels! ✈️
