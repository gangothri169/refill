import subprocess

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
routes = [
    "/dashboard",
    "/cases",
    "/cases/RX-10482",
    "/analytics",
    "/audit",
    "/integrations",
    "/knowledge",
    "/growth",
    "/notifications",
    "/settings"
]

results = []
for r in routes:
    url = "https://refill-one-mu.vercel.app" + r
    res = subprocess.run(
        [chrome_path, "--headless=new", "--dump-dom", "--virtual-time-budget=3000", url],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="ignore"
    )
    html = res.stdout
    rendered = len(html) > 5000 and "root" in html
    has_rx10482 = "RX-10482" in html
    has_table = "<table" in html
    results.append(f"{r:20} -> Rendered: {rendered} | Bytes: {len(html)} | RX-10482: {has_rx10482} | Table: {has_table}")

with open("c:/refill/vercel_report.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(results) + "\n")

print("\n".join(results))
