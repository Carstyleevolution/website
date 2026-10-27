"""Build the Car Style Evolution website.

Run it from this folder with:  python3 build.py

What it does:
  - reads the site data in sorgente/dati/ (business details, menu, pages, projects),
  - wraps each page body in sorgente/pagine/ with the shared layout in sorgente/layout/,
  - generates the project pages from sorgente/dati/progetti.json and the photo folders
    in assets/img/progetti/,
  - writes the finished .html pages, sitemap.xml and robots.txt into this folder,
    which is the folder GitHub Pages publishes.

Only the Python standard library is used. On a Mac it also creates missing gallery
thumbnails with the built-in `sips` tool.
"""

import datetime
import html
import json
import os
import re
import shutil
import subprocess
import urllib.parse

PROJECT_FOLDER = os.path.dirname(os.path.abspath(__file__))
SOURCE_FOLDER = os.path.join(PROJECT_FOLDER, "sorgente")
IMAGE_FOLDER = os.path.join(PROJECT_FOLDER, "assets", "img")
OUTPUT_FOLDER = PROJECT_FOLDER

# First line of every generated file. Before each build, .html files carrying it are
# deleted; files without it are left alone.
GENERATED_MARK = "<!-- Generato da build.py: non modificare questo file, modifica sorgente/ e riesegui build.py -->"

THUMBNAIL_SIZE = 640
PLACEHOLDER_PATTERN = re.compile(r"\{\{\s*([a-z_]+)\s*\}\}")


# ---------------------------------------------------------------------------
# Small helpers
# ---------------------------------------------------------------------------

def load_json(file_name):
    with open(os.path.join(SOURCE_FOLDER, "dati", file_name), encoding="utf-8") as json_file:
        return json.load(json_file)


def read_source(*path_parts):
    with open(os.path.join(SOURCE_FOLDER, *path_parts), encoding="utf-8") as source_file:
        return source_file.read()


def escape(text):
    """Make plain text safe to place inside HTML (turns < > & " into entities)."""
    return html.escape(text, quote=True)


def fill_placeholders(template, values, template_name):
    """Replace every {{ name }} in the template with values[name].

    Stops with an error if the template uses a name that is not in values.
    """
    def replace(match):
        name = match.group(1)
        if name not in values:
            raise SystemExit(f"Errore: {template_name} usa {{{{ {name} }}}}, che non esiste.")
        return values[name]

    return PLACEHOLDER_PATTERN.sub(replace, template)


def write_output(file_name, content):
    with open(os.path.join(OUTPUT_FOLDER, file_name), "w", encoding="utf-8") as output_file:
        output_file.write(content)


def remove_previous_build():
    for file_name in os.listdir(OUTPUT_FOLDER):
        if not file_name.endswith(".html"):
            continue
        path = os.path.join(OUTPUT_FOLDER, file_name)
        with open(path, encoding="utf-8") as existing_file:
            generated = GENERATED_MARK in existing_file.read(500)
        if generated:
            os.remove(path)


# ---------------------------------------------------------------------------
# Shared values: business details and generated blocks used by many pages
# ---------------------------------------------------------------------------

def build_shared_values(site, categories):
    business = site["business"]
    values = {}
    for key in ("name", "tagline", "phone_display", "phone_link", "whatsapp_number", "email",
                "street", "town", "province", "vat_number", "facebook", "instagram"):
        values[key] = escape(business[key])

    full_address = f"{business['street']}, {business['town']} {business['province']}"
    values["site_url"] = escape(site["site_url"])
    values["whatsapp_link"] = escape("https://wa.me/" + business["whatsapp_number"])
    values["maps_link"] = escape("https://www.google.com/maps/search/?api=1&query="
                                 + urllib.parse.quote(full_address))
    values["year"] = str(datetime.date.today().year)

    hour_lines = [f"          <p>{escape(line)}</p>" for line in business["opening_hours"]]
    values["hours"] = "\n".join(hour_lines)

    footer_links = []
    for item in site["menu"]:
        footer_links.append(f'            <li><a href="{item["page"]}.html">{escape(item["label"])}</a></li>')
    values["footer_menu"] = "\n".join(footer_links)

    values["project_categories"] = render_category_cards(categories)

    # The contact block contains placeholders itself, so it is filled first.
    values["contact_block"] = fill_placeholders(read_source("layout", "blocco-contatti.html"),
                                                values, "layout/blocco-contatti.html")
    return values


def render_menu(menu, current_page):
    lines = []
    for item in menu:
        current = ' aria-current="page"' if item["page"] == current_page else ""
        lines.append(f'        <li><a href="{item["page"]}.html"{current}>{escape(item["label"])}</a></li>')
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Project galleries
# ---------------------------------------------------------------------------

def list_photos(category_slug, project_folder):
    """Return the photo file names of a project, sorted by name (01.jpg, 02.jpg, ...)."""
    folder = os.path.join(IMAGE_FOLDER, "progetti", category_slug, project_folder)
    if not os.path.isdir(folder):
        print(f"  attenzione: cartella foto mancante {folder}")
        return []
    names = [name for name in os.listdir(folder) if name.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))]
    return sorted(names)


def make_missing_thumbnails(category_slug, project_folder, photo_names):
    """Create mini/<photo> for photos that do not have a thumbnail yet (Mac only)."""
    folder = os.path.join(IMAGE_FOLDER, "progetti", category_slug, project_folder)
    thumbnail_folder = os.path.join(folder, "mini")
    can_resize = shutil.which("sips") is not None
    for name in photo_names:
        thumbnail_path = os.path.join(thumbnail_folder, name)
        if os.path.exists(thumbnail_path):
            continue
        if not can_resize:
            print(f"  attenzione: manca la miniatura {thumbnail_path} (verrà usata la foto grande)")
            continue
        os.makedirs(thumbnail_folder, exist_ok=True)
        subprocess.run(["sips", "-Z", str(THUMBNAIL_SIZE), "-s", "format", "jpeg", "-s", "formatOptions", "72",
                        os.path.join(folder, name), "--out", thumbnail_path],
                       capture_output=True, check=True)
        print(f"  creata miniatura {thumbnail_path}")


def thumbnail_or_photo(category_slug, project_folder, name):
    base = f"assets/img/progetti/{category_slug}/{project_folder}"
    if os.path.exists(os.path.join(PROJECT_FOLDER, base, "mini", name)):
        return f"{base}/mini/{name}"
    return f"{base}/{name}"


def render_gallery(category_slug, project, photo_names):
    label = project["title"] or "Lavoro"
    items = []
    for number, name in enumerate(photo_names, start=1):
        full_photo = f"assets/img/progetti/{category_slug}/{project['folder']}/{name}"
        thumbnail = thumbnail_or_photo(category_slug, project["folder"], name)
        alt_text = escape(f"{label}, foto {number}")
        items.append(
            f'        <a class="galleria__voce" href="{full_photo}" data-galleria>'
            f'<img src="{thumbnail}" alt="{alt_text}" loading="lazy" decoding="async"></a>'
        )
    return '      <div class="galleria">\n' + "\n".join(items) + "\n      </div>"


def render_category_body(category):
    slug = category["slug"]
    parts = [
        '<section class="intestazione">',
        '  <div class="contenitore">',
        '    <p class="intestazione__sopra"><a href="progetti.html">Progetti</a></p>',
        f'    <h1 class="intestazione__titolo">{escape(category["title"])}</h1>',
    ]
    for paragraph in category["intro"]:
        parts.append(f'    <p class="intestazione__sottotitolo">{escape(paragraph)}</p>')

    titled_projects = [project for project in category["projects"] if project["title"]]
    if len(titled_projects) > 1:
        parts.append('    <ul class="salti">')
        for project in titled_projects:
            parts.append(f'      <li><a href="#{project["folder"]}">{escape(project["title"])}</a></li>')
        parts.append("    </ul>")
    parts += ["  </div>", "</section>", ""]

    if not category["projects"]:
        parts += [
            '<section class="sezione">',
            '  <div class="contenitore in-aggiornamento">',
            "    <p>Pagina in aggiornamento: presto troverai qui le foto dei nostri lavori.</p>",
            "    <p>Nel frattempo puoi vedere i nostri servizi o chiederci un preventivo.</p>",
            '    <p class="centrato">',
            '      <a class="pulsante pulsante--contorno" href="i-nostri-servizi.html">I nostri servizi</a>',
            '      <a class="pulsante" href="contatti.html#preventivo">Richiedi preventivo</a>',
            "    </p>",
            "  </div>",
            "</section>",
        ]
        return "\n".join(parts)

    for index, project in enumerate(category["projects"]):
        photo_names = list_photos(slug, project["folder"])
        make_missing_thumbnails(slug, project["folder"], photo_names)
        dark = " sezione--scura" if index % 2 == 1 else ""
        parts.append(f'<section class="sezione progetto{dark}" id="{project["folder"]}">')
        parts.append('  <div class="contenitore">')
        if project["title"]:
            parts.append(f'    <h2 class="progetto__titolo">{escape(project["title"])}</h2>')
        for line in project["description"]:
            parts.append(f'    <p class="progetto__descrizione">{escape(line)}</p>')
        parts.append(render_gallery(slug, project, photo_names))
        parts.append("  </div>")
        parts.append("</section>")

    if category["closing_note"]:
        parts.append('<section class="sezione">')
        parts.append(f'  <p class="contenitore nota-finale">{escape(category["closing_note"])}</p>')
        parts.append("</section>")
    return "\n".join(parts)


def render_category_cards(categories):
    cards = ['    <div class="categorie">']
    for category in categories:
        photo_count = 0
        for project in category["projects"]:
            photo_count += len(list_photos(category["slug"], project["folder"]))
        if photo_count:
            detail = f"{photo_count} foto"
        else:
            detail = "In aggiornamento"
        cards.append(
            f'      <a class="categoria" href="{category["slug"]}.html">'
            f'<img src="assets/img/{category["cover"]}" alt="" loading="lazy">'
            f'<span class="categoria__titolo">{escape(category["title"])}</span>'
            f'<span class="categoria__dettaglio">{detail}</span></a>'
        )
    cards.append("    </div>")
    return "\n".join(cards)


# ---------------------------------------------------------------------------
# Writing pages
# ---------------------------------------------------------------------------

def write_page(site, shared_values, file_name, title, description, body, menu_page):
    layout = read_source("layout", "base.html")
    if file_name == "index":
        canonical_url = site["site_url"] + "/"
    else:
        canonical_url = f"{site['site_url']}/{file_name}"
    page_values = dict(shared_values)
    page_values["page_title"] = escape(title)
    page_values["page_description"] = escape(description)
    page_values["canonical_url"] = escape(canonical_url)
    page_values["menu"] = render_menu(site["menu"], menu_page)
    page_values["body"] = body
    # Precarica soltanto la copertina presente nella pagina, senza richieste esterne.
    hero = re.search(r"background-image:\s*url\('([^']+)'\)", body)
    page_values["hero_preload"] = (
        f'  <link rel="preload" as="image" href="{escape(hero.group(1))}" fetchpriority="high">'
        if hero else ""
    )
    page = fill_placeholders(layout, page_values, "layout/base.html")
    write_output(f"{file_name}.html", GENERATED_MARK + "\n" + page)


def write_redirect(old_name, new_name):
    """A tiny page at the old address that sends visitors (and Google) to the new one."""
    content = (
        f"{GENERATED_MARK}\n<!doctype html>\n<html lang=\"it\">\n<head>\n"
        f"  <meta charset=\"utf-8\">\n  <title>Pagina spostata</title>\n"
        f"  <link rel=\"canonical\" href=\"{new_name}.html\">\n"
        f"  <meta http-equiv=\"refresh\" content=\"0; url={new_name}.html\">\n"
        f"</head>\n<body>\n  <p>Questa pagina è stata spostata: <a href=\"{new_name}.html\">vai alla nuova pagina</a>.</p>\n"
        f"</body>\n</html>\n"
    )
    write_output(f"{old_name}.html", content)


def write_sitemap_and_robots(site, page_names):
    today = datetime.date.today().isoformat()
    entries = []
    for name in page_names:
        address = site["site_url"] + "/" if name == "index" else f"{site['site_url']}/{name}"
        entries.append(f"  <url>\n    <loc>{escape(address)}</loc>\n    <lastmod>{today}</lastmod>\n  </url>")
    sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
               '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
               + "\n".join(entries) + "\n</urlset>\n")
    write_output("sitemap.xml", sitemap)
    write_output("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {site['site_url']}/sitemap.xml\n")


def main():
    site = load_json("sito.json")
    categories = load_json("progetti.json")["categories"]
    shared_values = build_shared_values(site, categories)

    remove_previous_build()
    published_pages = []

    for page in site["pages"]:
        body_template = read_source("pagine", page["body"])
        body = fill_placeholders(body_template, shared_values, f"pagine/{page['body']}")
        write_page(site, shared_values, page["file"], page["title"], page["description"], body, page["menu_page"])
        if not page.get("hidden"):
            published_pages.append(page["file"])
        print(f"pagina {page['file']}.html")

    for category in categories:
        body = render_category_body(category)
        write_page(site, shared_values, category["slug"], category["page_title"], category["description"],
                   body, "progetti")
        published_pages.append(category["slug"])
        print(f"pagina {category['slug']}.html")

    for redirect in site["redirects"]:
        write_redirect(redirect["from"], redirect["to"])
        print(f"reindirizzamento {redirect['from']}.html -> {redirect['to']}.html")

    write_sitemap_and_robots(site, published_pages)

    # An empty .nojekyll file stops GitHub Pages from running Jekyll on the folder.
    nojekyll_path = os.path.join(OUTPUT_FOLDER, ".nojekyll")
    if not os.path.exists(nojekyll_path):
        open(nojekyll_path, "w").close()

    print("Fatto.")


if __name__ == "__main__":
    main()
