import urllib.request
import json
import os
import xml.etree.ElementTree as ET

# Unicode range for Hiragana: 3041-3096
# We will focus on basic 46 chars (A to N)
# 3042(あ) to 3093(ん), skipping variations like small letters or voiced marks for the core grid.
# Core hiragana list mapping (code -> char)
core_chars = {
    '3042': 'あ', '3044': 'い', '3046': 'う', '3048': 'え', '304a': 'お',
    '304b': 'か', '304d': 'き', '304f': 'く', '3051': 'け', '3053': 'こ',
    '3055': 'さ', '3057': 'し', '3059': 'す', '305b': 'せ', '305d': 'そ',
    '305f': 'た', '3061': 'ち', '3064': 'つ', '3066': 'て', '3068': 'と',
    '306a': 'な', '306b': 'に', '306c': 'ぬ', '306d': 'ね', '306e': 'の',
    '306f': 'は', '3072': 'ひ', '3075': 'ふ', '3078': 'へ', '307b': 'ほ',
    '307e': 'ま', '307f': 'み', '3080': 'む', '3081': 'め', '3082': 'も',
    '3084': 'や', '3086': 'ゆ', '3088': 'よ',
    '3089': 'ら', '308a': 'り', '308b': 'る', '308c': 'れ', '308d': 'ろ',
    '308f': 'わ', '3092': 'を', '3093': 'ん'
}

baseUrl = "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/{code}.svg"

result_data = {}

def fetch_svg(code):
    padded_code = code.zfill(5)
    url = baseUrl.format(code=padded_code)
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        response = urllib.request.urlopen(req)
        svg_content = response.read().decode('utf-8')
        return svg_content
    except Exception as e:
        print(f"Error fetching {code}: {e}")
        return None

def extract_paths(svg_string):
    paths = []
    try:
        root = ET.fromstring(svg_string)
        # Find all path elements. Namespace might be present: {http://www.w3.org/2000/svg}path
        # But let's just use string operations to be safe against namespace issues
        import re
        path_matches = re.findall(r'<path[^>]*d="([^"]+)"', svg_string)
        for i, d in enumerate(path_matches):
            paths.append(d)
    except Exception as e:
        print("Parse error:", e)
    return paths

print("Fetching SVG data...")
for code, char in core_chars.items():
    print(f"Fetching {char} ({code})...")
    svg_str = fetch_svg(code)
    if svg_str:
        paths = extract_paths(svg_str)
        result_data[char] = {
            "code": code,
            "paths": paths
        }

# Generate data.js
with open("data.js", "w", encoding="utf-8") as f:
    f.write("const hiraganaData = ")
    json.dump(result_data, f, ensure_ascii=False, indent=2)
    f.write(";\n")

print("Done generating data.js")
