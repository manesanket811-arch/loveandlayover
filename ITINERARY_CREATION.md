# Creating Itinerary PDFs for Love and Layovers

This guide explains how to create the itinerary PDF files that visitors can download.

---

## Overview

Visitors can download three Singapore itineraries:

1. **Singapore Food Tour** (4 days) - `singapore-food-culture.pdf`
2. **Singapore Gardens & Parks** (3 days) - `singapore-gardens-nature.pdf`
3. **Singapore Complete Guide** (5 days) - `singapore-city-explorer.pdf`

---

## Method 1: Using Google Docs (Easy)

### Steps:

1. **Create a Google Doc**
   - Go to [docs.google.com](https://docs.google.com)
   - Click "Blank document"
   - Title: "Singapore Food Tour"

2. **Add content** (structured format):
   ```
   # Singapore Food Tour - 4 Days
   
   ## Day 1: Hawker Heaven
   - Morning: Arrive at Singapore airport
   - Mid-day: Check into hotel in Tanjong Pagar
   - Afternoon: Explore Chinatown (2 hours)
     - Visit Thean Hou Temple
     - Walk Smith Street for street food
   - Evening: Dinner at Amoy Street Food Center
     - Try laksa, chicken rice, carrot cake
     - Budget: SGD 10-15
   
   ## Day 2: Local Markets & Temples
   - Morning: Breakfast at Tiong Bahru Market
   - Mid-morning: Visit Buddha Tooth Relic Temple
   - Afternoon: Kampong Glam district
     - Arab Street for textiles and souvenirs
     - Masjid Sultan mosque
   - Evening: Dinner at Jalan Alor nearby
   
   ...more days...
   
   ## Tips & Budget
   - Best time: Nov-Jan (cooler weather)
   - Transport: Use EZ-Link card for MRT/buses
   - Budget: SGD 100-150/day for food & transport
   - Dress code: Modest when visiting temples
   ```

3. **Format the document**
   - Use heading styles (Heading 1, Heading 2)
   - Add images from Google Images
   - Add a map screenshot

4. **Download as PDF**
   - Click "File" → "Download" → "PDF Document"
   - Save as `singapore-food-culture.pdf`

---

## Method 2: Using Microsoft Word

### Steps:

1. **Create a Word document**
   - Open Microsoft Word
   - Start with a template or blank document

2. **Add content** with formatting:
   - Title, dates, overview
   - Day-by-day breakdown
   - Restaurants and attractions
   - Budget breakdown
   - Maps and images

3. **Save as PDF**
   - File → Save As
   - Format: PDF
   - Filename: `singapore-food-culture.pdf`

---

## Method 3: Using Canva (Nice Design)

### Steps:

1. **Go to [canva.com](https://canva.com)**
   - Sign up or log in
   - Search for "travel guide" template

2. **Customize template**
   - Add your itinerary text
   - Insert photos from Canva library
   - Use brand colors (orange #ff6b35, teal #0fb6a8)

3. **Download**
   - Click "Download" → "PDF"
   - Filename: `singapore-food-culture.pdf`

---

## Method 4: Using Python (Professional)

### Create PDF with reportlab:

```python
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak

# Create PDF
pdf = SimpleDocTemplate("singapore-food-culture.pdf", pagesize=letter)
story = []
styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor='#ff6b35',
    spaceAfter=30
)

# Add content
story.append(Paragraph("Singapore Food Tour", title_style))
story.append(Paragraph("4 Days of Culinary Heaven", styles['Heading2']))
story.append(Spacer(1, 0.2*inch))

# Day 1
story.append(Paragraph("Day 1: Hawker Heaven", styles['Heading3']))
story.append(Paragraph("""
<b>Morning:</b> Arrive at Singapore airport<br/>
<b>Afternoon:</b> Check in and explore Chinatown<br/>
<b>Evening:</b> Dinner at Amoy Street Food Center<br/>
<b>Budget:</b> SGD 50-70
""", styles['Normal']))

story.append(Spacer(1, 0.2*inch))

# Build PDF
pdf.build(story)
print("✓ PDF created: singapore-food-culture.pdf")
```

Run this with:
```bash
pip install reportlab
python create_itinerary.py
```

---

## Sample Content Structure

Each itinerary should include:

### Header
- Title
- Duration (e.g., "4 Days")
- Tagline
- Created date

### Overview
- Best time to visit
- Budget estimate
- Weather info
- What to bring

### Day-by-Day
For each day:
- Time of day
- What to do
- Location/address
- Estimated cost
- Tips

### Practical Info
- Getting there (flights)
- Getting around (transport)
- Where to stay (hotel recommendations)
- Money & budgeting
- Cultural tips
- Safety info
- Emergency contacts

### Eating & Drinking
- Must-try restaurants
- Local dishes
- Average prices
- Dietary considerations

### Attractions Map
- Marked locations
- Opening hours
- Entry fees

### Final Tips
- What locals love
- What to skip
- Best photo spots

---

## File Naming Convention

Save PDFs with this format:

```
singapore-food-culture.pdf
singapore-gardens-nature.pdf
singapore-city-explorer.pdf
```

The website expects:
- **Folder**: `singapore`
- **Filename**: `{itinerary-type}.pdf`

Where `itinerary-type` matches the `data-itinerary` attribute in HTML:
- `food-culture`
- `gardens-nature`
- `city-explorer`

---

## Upload to AWS S3

Once you have the PDFs:

```bash
# Set bucket name
ITINERARY_BUCKET="love-and-layovers-itineraries-XXXXXXXXXXXX"

# Upload PDFs
aws s3 cp singapore-food-culture.pdf s3://$ITINERARY_BUCKET/singapore/
aws s3 cp singapore-gardens-nature.pdf s3://$ITINERARY_BUCKET/singapore/
aws s3 cp singapore-city-explorer.pdf s3://$ITINERARY_BUCKET/singapore/

# Verify upload
aws s3 ls s3://$ITINERARY_BUCKET/singapore/
```

---

## Tips for Great Itineraries

1. **Be Specific**
   - Include exact addresses
   - Mention opening hours
   - Add prices and costs

2. **Add Personality**
   - Share your honest reviews
   - Include local tips
   - Tell stories from your trip

3. **Be Practical**
   - Include maps
   - Mention transport times
   - Add budget breakdowns
   - Note dietary info

4. **Include Visuals**
   - Photos from your trip
   - Maps with pins
   - Food pictures
   - Scenic shots

5. **Keep It Organized**
   - Clear day-by-day structure
   - Headings and subheadings
   - Consistent formatting
   - Easy to follow

---

## Template: Singapore Food Tour (4 Days)

```
═══════════════════════════════════════
SINGAPORE FOOD TOUR
4 Days of Culinary Heaven
═══════════════════════════════════════

OVERVIEW
--------
Best Time: Nov-Jan (cooler weather)
Budget: SGD 400-600 (food + transport)
Vibe: Food-focused, casual exploration

DAY 1: HAWKER HAVEN
-------------------
⏰ Morning (8am)
📍 Changi Airport → Tanjong Pagar Hotel
- Arrive at Singapore airport
- Take MRT to hotel (30 min, SGD 3)
- Check in and rest

⏰ Afternoon (2pm)
📍 Chinatown
- Walk around Chinatown
- Visit Thean Hou Temple (free entry)
- Explore Smith Street for hawker stalls

⏰ Evening (6pm)
📍 Amoy Street Food Center
🍜 Must Try:
  - Laksa (Hock Lam Beef Noodles) - SGD 4
  - Chicken Rice (Tian Tian) - SGD 3
  - Carrot Cake (fried) - SGD 2
💰 Budget: SGD 50-70

DAY 2: LOCAL MARKETS & TEMPLES
------------------------------
⏰ Morning (8am)
📍 Tiong Bahru Market
🍜 Breakfast: Tiong Bahru Laksa - SGD 4
- Watch locals shopping
- Explore wet market (interesting!)

⏰ Mid-morning (10am)
📍 Buddha Tooth Relic Temple
- Beautiful temple in Chinatown
- Free entry
- Dress modestly (covered knees/shoulders)

⏰ Afternoon (1pm)
📍 Kampong Glam
- Arab Street (textiles, souvenirs)
- Masjid Sultan mosque
- Haji Lane (cafes & shops)

⏰ Evening (6pm)
📍 Dinner at Jalan Alor area
🍜 Try: Sambal Stingray, Satay
💰 Budget: SGD 50-70

DAY 3: FOOD CULTURE & NEIGHBORHOODS
-----------------------------------
[Continue with Day 3 & 4...]

BUDGET BREAKDOWN
----------------
Food: SGD 200-250
Transport: SGD 30
Attractions: Free - SGD 20
Accommodation: SGD 150-200 (per night)
Total: SGD 400-600

INSIDER TIPS
-----------
✓ Download MRT map app
✓ Try food at wet markets early
✓ Carry small bills (coins)
✓ Don't miss: Maxwell Food Centre
✗ Avoid: Overly touristy Orchard Road

BEST PHOTO SPOTS
----------------
- Chinatown lanterns (evening)
- Temple interiors
- Hawker center chaos
- Arab Street shops

═══════════════════════════════════════
Created by Love and Layovers
Join us: @loveandlayover
═══════════════════════════════════════
```

---

## Next Steps

1. ✅ Create itinerary PDFs (choose your method above)
2. ✅ Name them correctly (singapore-{type}.pdf)
3. ✅ Deploy website and backend
4. ✅ Upload PDFs to S3 bucket
5. ✅ Test the download functionality

---

## Support

Need help creating PDFs?
- Use Canva templates: [canva.com/templates](https://canva.com/templates)
- Download free PDF software: [PDFtk](https://www.pdftk.com/)
- Create online: [lucidchart.com](https://lucidchart.com)

Happy creating! ✈️
