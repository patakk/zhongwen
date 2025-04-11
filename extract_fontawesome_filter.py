import execjs
import json

INPUT_FILE = "original_fontawesome_others_data.js"
OUTPUT_FILE = "filtered_icons.js"
KEEP_ICONS = {
    'user', 'person-through-window', 'pen-fancy', 'tasks', 'list', 'poo', 'pause', 'right-from-bracket',
    'braille', 'xmark', 'check-square', 'caret-down', 'puzzle-piece', 'book', 'copy', 'backward',
    'file-signature', 'arrow-right-arrow-left', 'backward-step', 'magnifying-glass', 'caret-right',
    'vial-circle-check', 'th-large', 'eye', 'circle-play', 'volume-low', 'i-cursor', 'circle-question',
    'keyboard', 'hand', 'circle-info', 'forward-step', 'circle-plus', 'envelope', 'pen', 'landmark', 'key'
}

def load_js_variables(js_file):
    with open(js_file, "r", encoding="utf-8") as file:
        js_content = file.read()
    context = execjs.compile(js_content)
    return context.eval("v")

def filter_icons(icon_data):
    to_keep = set(KEEP_ICONS)
    checked = set()

    def mark_for_keep(icon_name):
        if icon_name not in checked:
            checked.add(icon_name)
            to_keep.add(icon_name)
            for ref in icon_data.get(icon_name, [None, None, []])[2]:
                mark_for_keep(ref)

    for icon in KEEP_ICONS:
        mark_for_keep(icon)

    return {k: v for k, v in icon_data.items() if k in to_keep}

def save_filtered_icons(filtered_data):
    with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
        file.write("var v = {\n")
        for icon_name, values in filtered_data.items():
            file.write(f'    "{icon_name}": [\n')
            for value in values:
                file.write(f'        {json.dumps(value)},\n')
            file.write("    ],\n")
        file.write("};\n")

def main():
    icon_data = load_js_variables(INPUT_FILE)
    filtered_icons = filter_icons(icon_data)
    save_filtered_icons(filtered_icons)
    print("Filtering complete. Saved to:", OUTPUT_FILE)

if __name__ == "__main__":
    main()
