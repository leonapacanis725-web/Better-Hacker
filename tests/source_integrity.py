from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

class Parser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.hash_links = []
        self.local_links = []
        self.script_sources = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.append(attrs["id"])
        if tag == "script" and "src" in attrs:
            self.script_sources.append(attrs["src"])
        for attribute in ("href", "src"):
            if attribute not in attrs:
                continue
            href = attrs[attribute]
            if href.startswith("#"):
                self.hash_links.append(href[1:])
            elif "://" not in href and not href.startswith("mailto:"):
                self.local_links.append(href.split("#", 1)[0])

for filename in ("index.html", "privacy.html", "terms.html"):
    html = Path(filename).read_text()
    parser = Parser()
    parser.feed(html)
    duplicates = [item for item, count in Counter(parser.ids).items() if count > 1]
    assert not duplicates, f"duplicate IDs in {filename}: {duplicates}"
    assert not set(parser.hash_links) - set(parser.ids), f"broken hash links in {filename}"
    for link in parser.local_links:
        if link:
            # Site-root URLs (for example, /favicon.svg) are relative to the repository root,
            # not the runner operating system root.
            local_path = link.lstrip("/") if link.startswith("/") else link
            assert Path(local_path).exists(), f"missing local page {link} from {filename}"

index = Path("index.html").read_text()
script = Path("script.js").read_text()
assert index.count('class="card lesson-card"') == 8
assert script.count('id: "') >= 14
assert "betterHackerCourseReviewResult" in script
assert index.count('id="course-review"') == 1
assert 'https://formspree.io/f/xdeobdjl' in script
assert 'querySelector(".lab-challenge")' not in script
assert index.index('src="learner-state.js"') < index.index('src="challenges.js"') < index.index('src="achievements.js"') < index.index('src="companion.js"') < index.index('src="script.js"')
index_parser = Parser()
index_parser.feed(index)
assert len(index_parser.script_sources) == len(set(index_parser.script_sources)), f"duplicate script includes: {index_parser.script_sources}"
assert 'checkout.js' not in index_parser.script_sources, "inactive checkout script must not load on the public beta"
print("HTML parsed; IDs, links, legal pages, curriculum, endpoint, and Course Review integrity checks passed.")
