"""Validate and package only module runtime files. Standard-library Python."""
import json
import re
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / 'module.json').read_text(encoding='utf-8'))
assert manifest['id'] == 'gg-murder-in-metal-city'
assert re.fullmatch(r'\d+\.\d+\.\d+', manifest['version'])
assert manifest['download'].endswith(f"/v{manifest['version']}/module.zip")
for key in ('esmodules', 'scripts', 'styles'):
    for path in manifest.get(key, []):
        assert (root / path).is_file(), f'Missing manifest file: {path}'
for pack in manifest.get('packs', []):
    assert (root / pack['path']).exists(), f"Missing pack: {pack['path']}"
files = [root / name for name in ('module.json', 'README.md', 'ATTRIBUTION.md', 'CHANGELOG.md', 'LICENSE') if (root / name).is_file()]
for dirname in ('scripts', 'assets', 'features', 'packs', 'styles', 'lang', 'templates'):
    files.extend(p for p in (root / dirname).rglob('*') if p.is_file() and not any(part.startswith('.') for part in p.relative_to(root).parts))
dist = root / 'dist'
dist.mkdir(exist_ok=True)
(dist / 'module.json').write_text((root / 'module.json').read_text(encoding='utf-8'), encoding='utf-8')
with ZipFile(dist / 'module.zip', 'w', ZIP_DEFLATED) as archive:
    for file in sorted(files):
        assert not file.is_symlink(), f'Symlink excluded: {file}'
        archive.write(file, file.relative_to(root).as_posix())
with ZipFile(dist / 'module.zip') as archive:
    assert archive.testzip() is None
    assert 'module.json' in archive.namelist()
print(f"Built {manifest['id']} {manifest['version']} ({len(files)} files)")
