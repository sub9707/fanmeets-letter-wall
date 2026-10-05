# 교촌 폰트 사용 규정에 맞춘 웹폰트(WOFF2)를 만든다.
#   국문 | 윤고딕 300대, 장평 93 / 자간 -50
#   영문·숫자·기호 | DIN
#   굵게: 윤고딕 320~330 + DIN Medium, 보통: 윤고딕 310 + DIN Light
# 원본에 그림 없이 연결만 된 글자는 빼서 브라우저가 대체 폰트로 그리게 한다 (drop_blank_mappings).
# CSS 로는 장평을 줄일 수 없어서 윤고딕 글리프를 가로 93% 로 줄이고 자간 -50(1000 단위 기준)을 글자 폭에 넣는다.
#   pip install fonttools brotli
#   python scripts/build-fonts.py   (assets-src/fonts 원본 → src/assets/fonts)
import unicodedata
from pathlib import Path

from fontTools.ttLib import TTFont

SRC = Path('assets-src/fonts')
OUT = Path('src/assets/fonts')

KOREAN_SCALE_X = 0.93  # 장평 93
KOREAN_TRACKING = -50  # 자간 -50 (1000 단위)

KOREAN = {'윤고딕310.ttf': 'yoon-310', '윤고딕320.ttf': 'yoon-320', '윤고딕330.ttf': 'yoon-330'}
LATIN = {'DIN-Light.ttf': 'din-light', 'DIN-Medium.ttf': 'din-medium'}


def condense(font: TTFont) -> None:
    upm = font['head'].unitsPerEm
    tracking = round(KOREAN_TRACKING * upm / 1000)
    glyf = font['glyf']
    hmtx = font['hmtx']
    for name in font.getGlyphOrder():
        glyph = glyf[name]
        if glyph.isComposite():
            for component in glyph.components:
                component.x = round(component.x * KOREAN_SCALE_X)
        elif glyph.numberOfContours > 0:
            glyph.coordinates.scale((KOREAN_SCALE_X, 1))
            glyph.coordinates.toInt()
    for name in font.getGlyphOrder():
        glyph = glyf[name]
        glyph.recalcBounds(glyf)
        advance, lsb = hmtx[name]
        # 폭이 없는 글자(결합 문자 등)에는 자간을 넣지 않는다
        advance = max(0, round(advance * KOREAN_SCALE_X) + tracking) if advance else 0
        hmtx[name] = (advance, getattr(glyph, 'xMin', round(lsb * KOREAN_SCALE_X)))
    if 'kern' in font:
        for table in font['kern'].kernTables:
            table.kernTable = {pair: round(v * KOREAN_SCALE_X) for pair, v in table.kernTable.items()}
    font['hhea'].advanceWidthMax = max(aw for aw, _ in hmtx.metrics.values())


def drop_blank_mappings(font: TTFont) -> int:
    """그림이 없는 빈 글리프에 연결된 글자를 cmap 에서 뺀다.
    윤고딕 300 은 완성형 2350자만 그려져 있고 나머지 한글(뷁, 햏, 갂 …)은 빈 글리프에 연결돼 있어서,
    그대로 두면 브라우저가 '글자가 있다'고 보고 다른 폰트로 넘기지 않아 글자가 통째로 안 보인다."""
    glyf = font['glyf']
    blank = {
        cp
        for cp, name in font.getBestCmap().items()
        if glyf[name].numberOfContours == 0 and not unicodedata.category(chr(cp)).startswith(('Z', 'C'))
    }
    for table in font['cmap'].tables:
        table.cmap = {cp: name for cp, name in table.cmap.items() if cp not in blank}
    return len(blank)


def load(path: Path) -> TTFont:
    font = TTFont(path)
    # 윤고딕 원본은 loca 의 마지막 값(glyf 끝 위치)이 0 으로 깨져 있어 그대로는 읽히지 않는다. 마지막 글리프를 빈 글리프로 둔다
    loca = font['loca']
    if loca.locations[-1] < loca.locations[-2]:
        loca.locations[-1] = loca.locations[-2]
    return font


def build(file: str, out: str, korean: bool) -> None:
    font = load(SRC / file)
    dropped = drop_blank_mappings(font)
    if korean:
        condense(font)
    font.flavor = 'woff2'
    path = OUT / f'{out}.woff2'
    font.save(path)
    print(f'{path}  {path.stat().st_size // 1024} KB  (빈 글자 {dropped}개 제외)')


OUT.mkdir(parents=True, exist_ok=True)
for file, out in KOREAN.items():
    build(file, out, True)
for file, out in LATIN.items():
    build(file, out, False)
