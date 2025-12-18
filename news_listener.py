import time
import feedparser
import schedule
from newspaper import Article
from pymongo import MongoClient
from datetime import datetime
import ssl

# --- 1. SSL FIX ---
# This fixes "Certificate Verify Failed" errors when scraping
if hasattr(ssl, '_create_unverified_context'):
    ssl._create_default_https_context = ssl._create_unverified_context

# --- 2. CONFIGURATION ---

# amazonq-ignore-next-line
MONGO_URI = "mongodb+srv://premzade12:zadeprem1234@disasterresponse.poetiqv.mongodb.net/?retryWrites=true&w=majority&appName=DisasterResponse"

try:
    print("⏳ Connecting to MongoDB Cloud...")
    # amazonq-ignore-next-line
    client = MongoClient(MONGO_URI)
    
    # Send a ping to confirm a successful connection
    client.admin.command('ping')
    print("✅ Successfully connected to MongoDB Atlas!")
    
    db = client["disaster_db"]
    collection = db["reports"]
    
except Exception as e:
    print(f"❌ Database Connection Error: {e}")
    print("TIP: Did you replace <db_password> with your real password?")
    exit(1)

# Google News RSS URL (Targeting India, English, Last 24 hours)
RSS_URL = "https://news.google.com/rss/search?q=flood+OR+earthquake+OR+cyclone+OR+landslide+India+when:1d&hl=en-IN&gl=IN&ceid=IN:en"

def verify_with_news(disaster_type, location):
    """Check if disaster type and location match recent news"""
    try:
        # Search for specific disaster type and location in news
        search_query = f"{disaster_type.lower()}+{location.replace(' ', '+')}+India+when:1d"
        news_url = f"https://news.google.com/rss/search?q={search_query}&hl=en-IN&gl=IN&ceid=IN:en"
        
        feed = feedparser.parse(news_url)
        
        # Check if any recent news matches the disaster type and location
        for entry in feed.entries[:10]:
            title_lower = entry.title.lower()
            if (disaster_type.lower() in title_lower and 
                (location.lower() in title_lower or 'india' in title_lower)):
                return True
        
        return False
    except Exception as e:
        print(f"News verification error: {e}")
        return False

def scrape_google_news():
    current_time = datetime.now().strftime('%H:%M:%S')
    print(f"\n--- 📰 Scraping Google News at {current_time} ---")
    
    try:
        # 1. Fetch the RSS Feed
        feed = feedparser.parse(RSS_URL)
        print(f"   Found {len(feed.entries)} articles in feed...")

        if len(feed.entries) == 0:
            print("   ⚠️ No articles found. Check your Internet or RSS URL.")
            return

        # Process top 5 latest news to save time
        for entry in feed.entries[:5]: 
            try:
                # Check if we already have this link (Avoid Duplicates)
                # We use 'find_one' which is faster than count_documents for this check
                if collection.find_one({"link": entry.link}):
                    print(f"   [Skip] Already exist: {entry.title[:30]}...")
                    continue

                print(f"   [New] Downloading: {entry.title[:30]}...")
                
                # 2. Web Scrape the Full Article Content
                article = Article(entry.link)
                article.download()
                article.parse()
                
                # Extract disaster type from title (exclude military exercises)
                title_lower = entry.title.lower()
                disaster_type = "Unknown"
                
                # Skip military exercises and non-disaster news
                if any(word in title_lower for word in ['exercise', 'military', 'drill', 'training', 'desert cyclone']):
                    continue
                    
                # Only classify as disaster if it has disaster context
                has_disaster_context = any(word in title_lower for word in 
                    ['damage', 'destroyed', 'killed', 'injured', 'evacuated', 'relief', 'rescue', 'emergency', 'alert', 'warning', 'magnitude', 'richter', 'seismic', 'strikes', 'hits'])
                
                if has_disaster_context:
                    if 'flood' in title_lower:
                        disaster_type = "Flood"
                    elif 'earthquake' in title_lower:
                        disaster_type = "Earthquake"
                    elif 'cyclone' in title_lower:
                        disaster_type = "Cyclone"
                    elif 'landslide' in title_lower:
                        disaster_type = "Landslide"
                    elif 'wildfire' in title_lower or 'fire' in title_lower:
                        disaster_type = "Wildfire"
                
                # 3. Create the Report Object
                report = {
                    "source": "Google News",
                    "author": entry.source.title if 'source' in entry else "News Agency",
                    "title": entry.title,
                    "text": article.text, # The full scraped body text
                    "summary": article.text[:200] + "...", # First 200 chars for preview
                    "link": entry.link,
                    "timestamp": datetime.now(),
                    "image_url": article.top_image, # Scrape the main image too!
                    "status": "Verified" if disaster_type != "Unknown" else "Pending Review",
                    "disaster_type": disaster_type,
                    "location": "India"  # Default to India for news reports
                }
                
                # 4. Save to MongoDB
                collection.insert_one(report)
                print("   ✅ Saved to Database!")

            except Exception as e:
                print(f"   ⚠️ Error processing article '{entry.title[:15]}': {e}")
                
    except Exception as e:
        print(f"❌ Critical Scraping Error: {e}")

# --- SCHEDULER ---
# Run every 5 minutes
schedule.every(5).minutes.do(scrape_google_news)

print("✅ Real-Time News Scraper Started...")
print("Scanning Google News for: Flood, Earthquake, Cyclone...")
print("Press Ctrl+C to stop.")

# Run once immediately to verify it works
scrape_google_news()

# Keep the script running
while True:
    schedule.run_pending()
    time.sleep(1)