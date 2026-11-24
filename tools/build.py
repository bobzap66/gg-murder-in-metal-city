"""Validate and package runtime files. Development builds use an independent manifest."""
import argparse
import json
import re
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--dev-run', type=int, help='Monotonically increasing GitHub Actions run number')
parser.add_argument('--repository', default='bobzap66/gg-murder-in-metal-city')
args = parser.parse_args()
manifest = json.loads((root / 'module.json').read_text(encoding='utf-8'))
assert manifest['id'] == 'gg-murder-in-metal-city'
assert re.fullmatch(r'\d+\.\d+\.\d+', manifest['version'])
assert manifest['download'].endswith(f"/v{manifest['version']}/module.zip")
if args.dev_run is not None:
    assert args.dev_run > 0
    assert re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', args.repository)
    major, minor, patch = map(int, manifest['version'].split('.'))
    assert patch == 0, 'Development channel requires a zero patch baseline; reserve the next minor for stable.'
    manifest['version'] = f'{major}.{minor}.{args.dev_run}'
    base = f'https://raw.githubusercontent.com/{args.repository}/dev-release'
    manifest['manifest'] = f'{base}/module.json'
    manifest['download'] = f'{base}/packages/{manifest["version"]}/module.zip'
    manifest['title'] += ' (Development)'
    manifest['description'] = 'TEST BUILD — not live-tested. ' + manifest['description']
for key in ('esmodules', 'scripts', 'styles'):
    for path in manifest.get(key, []):
        assert (root / path).is_file(), f'Missing manifest file: {path}'
for pack in manifest.get('packs', []):
    assert (root / pack['path']).exists(), f"Missing pack: {pack['path']}"
files = [root / name for name in ('README.md', 'ATTRIBUTION.md', 'CHANGELOG.md', 'LICENSE') if (root / name).is_file()]
for dirname in ('scripts', 'assets', 'features', 'packs', 'styles', 'lang', 'templates'):
    files.extend(p for p in (root / dirname).rglob('*') if p.is_file() and not any(part.startswith('.') for part in p.relative_to(root).parts))
dist = root / 'dist'
dist.mkdir(exist_ok=True)
manifest_text = json.dumps(manifest, indent=2, ensure_ascii=False) + '\n'
(dist / 'module.json').write_text(manifest_text, encoding='utf-8')
with ZipFile(dist / 'module.zip', 'w', ZIP_DEFLATED) as archive:
    archive.writestr('module.json', manifest_text)
    for file in sorted(files):
        assert not file.is_symlink(), f'Symlink excluded: {file}'
        archive.write(file, file.relative_to(root).as_posix())
with ZipFile(dist / 'module.zip') as archive:
    assert archive.testzip() is None
    assert archive.read('module.json') == (dist / 'module.json').read_bytes()
print(f"Built {manifest['id']} {manifest['version']} ({len(files)+1} files)")
