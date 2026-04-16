import os

root = os.path.dirname(__file__)
paths = []
for dirpath, dirnames, filenames in os.walk(root):
    for filename in filenames:
        if filename.lower().endswith(('.html', '.htm', '.js', '.css', '.json', '.md', '.txt')):
            paths.append(os.path.join(dirpath, filename))
# Also replace in report outside HarryPotter
project_root = os.path.abspath(os.path.join(root, '..', '..'))
report_path = os.path.join(project_root, 'ОТЧЕТ_ПР6_Система_Рекомендаций.md')
if os.path.exists(report_path) and report_path not in paths:
    paths.append(report_path)
patterns = [
    ('Лафки', 'Лавки'),
    ('Лафку', 'Лавку'),
    ('Лафке', 'Лавке'),
    ('Лафкой', 'Лавкой'),
    ('Лафкою', 'Лавкою'),
    ('Лафка', 'Лавка'),
]
modified = []
for path in paths:
    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()
    new_text = text
    for old, new in patterns:
        new_text = new_text.replace(old, new)
    if new_text != text:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_text)
        modified.append(path)
print(f'MODIFIED {len(modified)} files')
for p in modified:
    print(p)
