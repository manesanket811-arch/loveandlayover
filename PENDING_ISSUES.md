# Pending Issues & Tech Debt

Last Updated: 2026-06-04

## 🔴 High Priority

### 1. Itinerary PDF Download Feature
**Status:** `Built but disconnected`
**Description:** Lambda endpoint `/download-itinerary` exists and is functional, but no HTML page has a "Download PDF" button.
**Location:** 
- Backend: `lambda_handler.py:188-234` (download_itinerary function)
- S3 Bucket: `love-and-layovers-itineraries-{account-id}`
- Missing: Frontend integration (button + JavaScript fetch logic)

**What needs to be done:**
- [ ] Add "Download as PDF" button to `destinations/*.html` pages
- [ ] Add JavaScript fetch logic to call `/download-itinerary` endpoint
- [ ] Test PDF downloads work end-to-end
- [ ] Add email capture/subscribe prompt before download

**Expected effort:** 2-3 hours

---

### 2. Instagram Feed API Integration
**Status:** `Deferred - Using Elfsight - 2026-06-04`
**Description:** Instagram credentials not shared for direct API integration. Continuing with Elfsight widget for now.
**Location:**
- Frontend: `index.html:574-576` (Elfsight widget restored)
- Backend: `lambda_handler.py` (no /instagram-feed endpoint)
- Infrastructure: `template.yaml` (no Secrets Manager permissions or API routes)

**Why deferred:**
- User not comfortable sharing Instagram API credentials at this time
- Elfsight widget provides sufficient functionality (refresh rate acceptable)

**Future implementation possible:**
If you decide to implement direct API integration later, the architecture plan is documented in git history. Code removes were reverted on 2026-06-04.

---

## 🟡 Medium Priority

### 3. Infrastructure Cleanup
**Status:** `Identified`
**Description:** Terraform files are redundant; only SAM template is actively deployed. Remove Terraform to avoid confusion.
**Location:** `terraform/` directory

**What needs to be done:**
- [ ] Verify current deployment uses SAM only
- [ ] Delete `terraform/` directory
- [ ] Update deployment docs to reference SAM only

**Expected effort:** 30 minutes

---

### 4. CloudFront Removal
**Status:** `Identified`
**Description:** CloudFront is disabled in Terraform state; not needed since using GitHub Pages for frontend.
**Location:** `terraform/cloudfront.tf`, `terraform/variables.tf`

**What needs to be done:**
- [ ] Verify CloudFront is not deployed
- [ ] Remove CloudFront terraform code
- [ ] Remove website S3 bucket (GitHub Pages is used instead)

**Expected effort:** 15 minutes

---

## 🟢 Low Priority / Future

### 5. Blog Image Reliability
**Status:** `Fixed (Temporarily)`
**Description:** Blog card images use `picsum.photos` service which may have uptime issues in the future.
**Location:** `blog.html:129-226` (all image URLs)

**Long-term solution:** Consider hosting images on S3 instead of external service.

---

### 6. Unused S3 Bucket
**Status:** `Identified`
**Description:** S3 bucket `love-and-layovers-website-{account-id}` is created by Terraform but not used (GitHub Pages hosts the website).
**Location:** `terraform/s3.tf:1-11`

**Impact:** Minimal monthly cost but adds infrastructure clutter.

---

### 7. Email Rate Limiting
**Status:** `Needs Planning`
**Description:** SES has rate limits (14 emails/second by default). If newsletter grows, may need to increase limits or implement queuing.

**Note:** Only implement if newsletter subscriber count exceeds 5,000.

---

### 8. Lambda Cold Starts
**Status:** `Not Critical`
**Description:** Lambda takes ~1-2 seconds on first invocation after idle period.

**Potential improvements:**
- [ ] Configure Lambda provisioned concurrency
- [ ] Add CloudWatch alarms for cold start frequency

---

## 📊 Summary

| Category | Count | Status |
|----------|-------|--------|
| High Priority | 2 | 1 in progress, 1 pending |
| Medium Priority | 2 | 2 pending |
| Low Priority | 4 | Informational |

---

## How to Update This File

When adding new issues:
1. Add to appropriate priority section
2. Include: Status, Description, Location, What needs to be done, Expected effort
3. Use checkboxes for sub-tasks
4. Update "Last Updated" date

When resolving issues:
1. Change Status to `Resolved - {date}`
2. Keep entry in file for historical context
3. Move to bottom under "✅ Resolved Issues" section

---

## ✅ Resolved Issues

(None yet - first issues being tracked!)

