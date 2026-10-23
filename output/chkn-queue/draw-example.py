from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).parent
W, H = 1800, 2130
im = Image.new('RGB', (W, H), '#F5F7FB')
d = ImageDraw.Draw(im)
NAVY, MUTED, BLUE, TEAL, AMBER = '#172B46', '#52647A', '#2563B6', '#087C73', '#A36012'
def font(size=30, bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/malgunbd.ttf' if bold else 'C:/Windows/Fonts/malgun.ttf', size)
def txt(x, y, s, size=30, color=NAVY, bold=False):
    d.text((x, y), s, font=font(size, bold), fill=color)
def box(x, y, w, h, fill='white', outline=None, r=20):
    d.rounded_rectangle((x, y, x+w, y+h), radius=r, fill=fill, outline=outline, width=2)
def center(x, y, s, size=30, color=NAVY, bold=False):
    f = font(size, bold)
    width = d.textlength(s, font=f)
    d.text((x-width/2, y), s, font=f, fill=color)
def section(y, num, title, ref):
    box(70, y, 49, 49, NAVY, r=14)
    center(94, y+4, str(num), 30, 'white', True)
    txt(138, y-1, title, 36, bold=True)
    txt(138, y+50, ref, 23, MUTED)
def arrow(x1, y1, x2, y2, color=MUTED, width=4):
    d.line((x1,y1,x2,y2), fill=color, width=width)
    if x2 > x1:
        d.polygon([(x2,y2),(x2-15,y2-9),(x2-15,y2+9)], fill=color)
    else:
        d.polygon([(x2,y2),(x2-9,y2-15),(x2+9,y2-15)], fill=color)

txt(70, 48, '숫자로 따라가는 calculate', 58, bold=True)
txt(73, 132, '4분짜리 구간 하나로 유입·소수 이월·선입선출을 확인합니다.', 31, MUTED)
box(70, 203, 1660, 175)
txt(100, 224, '설명용 입력', 29, BLUE, True)
txt(100, 276, '09:00부터 4분  |  직전 원본 종료 대기 0명  |  이번 원본 종료 대기 5명', 31)
txt(100, 326, '원본 구간 처리 6명  |  적용 부스 1대  |  처리시간 40초/명  |  초기 줄·carry = 0', 29)

section(414, 1, '총 11명이 왔다고 역산 → 4분에 나눠 넣기', 'L73, L105–107, L120')
box(70, 511, 1660, 155, '#EAF2FE')
txt(104, 533, '유입 = 종료 대기 5 - 직전 종료 대기 0 + 처리 6 = 11명', 39, BLUE, True)
txt(104, 595, '11 ÷ 4 = 몫 2, 나머지 3  →  앞의 세 분에 1명씩 더 배분  →  3 · 3 · 3 · 2명', 29)

section(705, 2, '매분 “유입을 추가한 뒤” 처리하고 남은 줄을 기록', 'L110–150 · 분당 처리량 = 1대 × 60초 ÷ 40초 = 1.5명')
xs = [70, 277, 484, 732, 984, 1240, 1488, 1730]
heads = ['시각', '새 유입', '이전 줄', '처리 전 줄', 'carry 계산', '처리', '남은 줄']
box(70, 810, 1660, 361, 'white')
d.rectangle((70,810,1730,881), fill=NAVY)
for i, h in enumerate(heads):
    center((xs[i]+xs[i+1])/2, 828, h, 29, 'white', True)
rows = [
    ['09:00', '3명', '0명', '0 + 3 = 3', '0 + 1.5', '1명', '2명'],
    ['09:01', '3명', '2명', '2 + 3 = 5', '0.5 + 1.5', '2명', '3명'],
    ['09:02', '3명', '3명', '3 + 3 = 6', '0 + 1.5', '1명', '5명'],
    ['09:03', '2명', '5명', '5 + 2 = 7', '0.5 + 1.5', '2명', '5명'],
]
for r, row in enumerate(rows):
    y = 882 + r*72
    if r%2 == 0:
        d.rectangle((71,y,1729,y+71), fill='#F1F5FA')
    for c, v in enumerate(row):
        col = BLUE if c == 1 else TEAL if c == 5 else AMBER if c == 6 else NAVY
        center((xs[c]+xs[c+1])/2, y+16, v, 29, col, c in [1,5,6])
txt(85, 1190, 'carry는 소수만 보관: 0.5 → 0 → 0.5 → 0.  실제 처리는 min(처리 전 줄, 정수 용량).', 27, MUTED)

section(1257, 3, '09:03에는 누가 처리될까? 가장 먼저 온 묶음부터', 'L123, L131–143 · 묶음 = [도착 분, 인원]')
txt(85, 1350, '09:03 유입 직후의 줄: 총 7명', 29, bold=True)
groups = [(82, 575, '#EAF2FE', BLUE, '09:01 도착 · 2명', '앞쪽: 이번 분에 처리'),
          (687, 502, '#E9F5F2', TEAL, '09:02 도착 · 3명', '아직 기다림'),
          (1219, 502, '#FFF2DE', AMBER, '09:03 도착 · 2명', '아직 기다림')]
for x, width, fill, col, title, sub in groups:
    box(x, 1405, width, 148, fill)
    center(x+width/2, 1421, title, 33, col, True)
    center(x+width/2, 1485, sub, 26, col)
arrow(370,1561,370,1594,BLUE)
box(82, 1600, 1639, 134, 'white')
txt(107, 1618, '처리한 2명의 대기시간 = 09:03 - 09:01 = 각 2분', 34, bold=True)
txt(107, 1675, '09:03의 waitMinSum = 2분 × 2명 = 4인·분   /   waitDistribution[2]에 2명 추가', 29)

section(1773, 4, '이 구간의 기록: 처리 6명, 남은 줄 5명', '최종 반환 배열의 해당 4분 값')
box(70, 1874, 1660, 122, NAVY)
txt(102, 1889, 'processed = [1, 2, 1, 2]     queue = [2, 3, 5, 5]     waitMinSum = [0, 2, 1, 4]', 31, 'white', True)
txt(102, 1945, '대기 분포: 0분 1명 · 1분 3명 · 2분 2명    |    아직 줄에 남은 5명은 분포에 포함되지 않음', 27, '#D6E0EF')
txt(76, 2020, '주의: 이 예시는 마지막 줄이 원본과 같지만, 일반적으로 두 값이 같도록 강제하지는 않습니다.', 27, MUTED)
txt(76, 2070, 'ChknQueueCalculator.java · 현재 로컬 코드 기준 · 설명용 숫자이며 실제 운영자료가 아닙니다.', 23, MUTED)
ROOT.mkdir(parents=True, exist_ok=True)
im.save(ROOT / 'calculate-example.png')
print(ROOT / 'calculate-example.png')
