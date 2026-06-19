import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime
from flask import Flask, jsonify, render_template

app = Flask(__name__)

# Namespace for Atom feed
ATOM_NAMESPACE = {'atom': 'http://www.w3.org/2005/Atom'}
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    try:
        # Fetch the feed XML
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        req = urllib.request.Request(FEED_URL, headers=headers)
        with urllib.request.urlopen(req) as response:
            xml_data = response.read()
        
        # Parse XML
        root = ET.fromstring(xml_data)
        releases = []
        
        for entry in root.findall('atom:entry', ATOM_NAMESPACE):
            title_el = entry.find('atom:title', ATOM_NAMESPACE)
            updated_el = entry.find('atom:updated', ATOM_NAMESPACE)
            content_el = entry.find('atom:content', ATOM_NAMESPACE)
            link_el = entry.find('atom:link', ATOM_NAMESPACE)
            id_el = entry.find('atom:id', ATOM_NAMESPACE)
            
            title = title_el.text if title_el is not None else "No Title"
            updated_raw = updated_el.text if updated_el is not None else ""
            content = content_el.text if content_el is not None else ""
            link = link_el.attrib.get('href', '') if link_el is not None else ""
            entry_id = id_el.text if id_el is not None else ""
            
            # Format date for display
            formatted_date = ""
            if updated_raw:
                try:
                    # Parse typical ISO format (e.g. 2024-03-12T15:30:00Z)
                    dt = datetime.fromisoformat(updated_raw.replace('Z', '+00:00'))
                    formatted_date = dt.strftime('%B %d, %Y')
                except Exception:
                    formatted_date = updated_raw
            
            releases.append({
                'id': entry_id,
                'title': title,
                'date': formatted_date,
                'raw_date': updated_raw,
                'content': content,
                'link': link
            })
            
        return releases, None
    except Exception as e:
        return [], str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    releases, error = fetch_and_parse_feed()
    if error:
        return jsonify({'success': False, 'error': error}), 500
    return jsonify({'success': True, 'releases': releases})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
