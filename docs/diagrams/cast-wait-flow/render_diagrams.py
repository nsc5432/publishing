from pathlib import Path
from html import escape
import math

from PIL import Image, ImageDraw, ImageFont


OUT = Path(__file__).resolve().parent
W = 2800
BG = '#F2F5FA'
INK = '#182C46'
MUTED = '#56677D'
NAVY = '#142B49'
BLUE = '#2863C6'
TEAL = '#087D80'
ORANGE = '#C66527'
LINE = '#D6DFEB'
WHITE = '#FFFFFF'
PALE_BLUE = '#EAF1FF'
PALE_TEAL = '#E5F4F1'
PALE_ORANGE = '#FFF1E5'
FONT = 'C:/Windows/Fonts/malgun.ttf'
BOLD = 'C:/Windows/Fonts/malgunbd.ttf'


class Canvas:
    def __init__(self, height):
        self.height = height
        self.img = Image.new('RGB', (W, height), BG)
        self.draw = ImageDraw.Draw(self.img)
        self.svg = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{height}" viewBox="0 0 {W} {height}">', f'<rect width="{W}" height="{height}" fill="{BG}"/>']
        self.overflow = []

    def rect(self, x, y, w, h, fill=WHITE, radius=24, stroke=None):
        self.draw.rounded_rectangle((x, y, x+w, y+h), radius, fill=fill, outline=stroke, width=2)
        self.svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke or "none"}" stroke-width="2"/>')

    def text(self, x, y, text, size=38, color=INK, bold=False):
        font = ImageFont.truetype(BOLD if bold else FONT, size)
        self.draw.text((x, y), text, fill=color, font=font, anchor='lt')
        self.svg.append(f'<text x="{x}" y="{y}" font-family="Malgun Gothic, sans-serif" font-size="{size}" font-weight="{700 if bold else 400}" fill="{color}" dominant-baseline="text-before-edge">{escape(text)}</text>')
        if x + self.draw.textlength(text, font=font) > W-45:
            self.overflow.append(text)

    def para(self, x, y, text, width, size=38, color=INK, bold=False, leading=1.48):
        font = ImageFont.truetype(BOLD if bold else FONT, size)
        lines = []
        for paragraph in text.split('\n'):
            current = ''
            for char in paragraph:
                if current and self.draw.textlength(current + char, font=font) > width:
                    lines.append(current.rstrip())
                    current = char.lstrip()
                else:
                    current += char
            lines.append(current)
        for line in lines:
            self.text(x, y, line, size, color, bold)
            y += size * leading
        return y

    def line(self, points, color=LINE, width=4, arrow=False):
        self.draw.line(points, fill=color, width=width, joint='curve')
        coords = ' '.join(f'{x},{y}' for x,y in points)
        self.svg.append(f'<polyline points="{coords}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round"/>')
        if arrow:
            (x0,y0),(x,y) = points[-2:]
            a = math.atan2(y-y0,x-x0)
            tip = [(x,y),(x-20*math.cos(a-.55),y-20*math.sin(a-.55)),(x-20*math.cos(a+.55),y-20*math.sin(a+.55))]
            self.draw.polygon(tip, fill=color)
            self.svg.append(f'<polygon points="{" ".join(f"{px},{py}" for px,py in tip)}" fill="{color}"/>')

    def chip(self, x, y, label, color=BLUE, fill=PALE_BLUE, width=None):
        font = ImageFont.truetype(BOLD, 31)
        width = width or int(self.draw.textlength(label, font=font)+42)
        self.rect(x,y,width,58,fill,15)
        self.text(x+21,y+11,label,31,color,True)

    def header(self, num, title, subtitle):
        self.rect(0,0,W,245,NAVY,0)
        self.text(100,38,f'CAST / PM   PROCESS GUIDE     {num}',29,'#AFC5E6',True)
        self.text(100,91,title,65,WHITE,True)
        self.text(103,183,subtitle,32,'#D5E1F2')

    def footer(self, number, source):
        y = self.height-92
        self.line([(100,y-20),(2700,y-20)],LINE,2)
        self.text(100,y,source,26,MUTED)
        self.text(2330,y,f'2026.10.28  /  {number}',26,MUTED)

    def item(self, x, y, number, title, body, width=1170, color=BLUE, size=36):
        self.chip(x,y,number,color,PALE_BLUE if color==BLUE else PALE_TEAL)
        self.text(x+92,y+5,title,42,INK,True)
        return self.para(x+92,y+77,body,width-92,size,MUTED)+36

    def save(self, name):
        assert not self.overflow, self.overflow
        self.img.save(OUT / f'{name}.png', optimize=True)
        (OUT / f'{name}.svg').write_text('\n'.join(self.svg + ['</svg>']), encoding='utf-8')


def overview():
    c = Canvas(2200)
    c.header('01 / 03','CAST 대기 결과에서 시설 추천까지','먼저 전체 흐름을 보고, 다음 두 장에서 저장과 계산을 자세히 따라갑니다.')
    c.rect(100,295,2600,165,PALE_TEAL)
    c.text(145,330,'핵심 흐름',36,TEAL,True)
    c.text(405,330,'실행 결과 → 10분 재료 저장 → 조회 때 공통 예측 → 카드와 팝업',45,INK,True)
    c.text(405,402,'추천 수량과 해소시간은 조회할 때 계산합니다.',32,MUTED)

    xs = [100,1000,1900]
    colors = [BLUE,TEAL,ORANGE]
    fills = [PALE_BLUE,PALE_TEAL,PALE_ORANGE]
    titles = ['결과 수신 · 저장','통계 조회 · 준비','예측 · 화면 표시']
    for i,x in enumerate(xs):
        c.rect(x,525,800,1045,WHITE,24,LINE)
        c.chip(x+38,561,chr(65+i),colors[i],fills[i])
        c.text(x+135,568,titles[i],47,INK,True)
    c.line([(912,1030),(985,1030)],BLUE,6,True)
    c.line([(1812,1030),(1885,1030)],TEAL,6,True)

    c.rect(138,674,724,155,PALE_BLUE)
    c.text(175,704,'CAST 결과 XML 수신',41,BLUE,True)
    c.text(175,765,'REQ_SetResource.do',34,BLUE)
    c.line([(500,843),(500,890)],BLUE,5,True)
    c.text(155,916,'원천 상세 결과 저장',43,INK,True)
    c.para(155,989,'체크인: 아일랜드 공용 줄 재계산\n출국장: SC + SR 결과 합산',690,37)
    c.line([(500,1124),(500,1172)],BLUE,5,True)
    c.rect(138,1190,724,164,PALE_BLUE)
    c.text(175,1220,'시설별 10분 통계 저장',41,BLUE,True)
    c.text(175,1284,'TN_PM_SMLT_FCLT_WTNG_RSLT',29,BLUE)
    c.para(155,1400,'원천 + 10분 통계를 함께 커밋\nT1 · T2 × 체크인 · 출국장',690,35,MUTED)

    c.rect(1038,674,724,155,PALE_TEAL)
    c.text(1075,704,'선택 시각 t 직전 30분',41,TEAL,True)
    c.text(1075,765,'10분 통계 3개를 읽음',34,TEAL)
    c.line([(1400,843),(1400,890)],TEAL,5,True)
    c.text(1055,916,'현재 상태와 예측 재료 산출',41,INK,True)
    c.para(1055,989,'평균 대기시간 W · 현재 대기 Q0\n분당 유입 λ · 시설당 처리율 μ\n현재 운영 수 s · 보유 수',690,37)
    c.line([(1400,1180),(1400,1227)],TEAL,5,True)
    c.rect(1038,1245,724,109,PALE_TEAL)
    c.text(1075,1278,'공통 평가: FcltWtngDay',36,TEAL,True)
    c.para(1055,1400,'저장행이 없거나 불완전하면\n원천으로 다시 계산해 응답',690,35,MUTED)

    c.rect(1938,674,724,155,PALE_ORANGE)
    c.text(1975,704,'시설 수를 바꾸며 예측',41,ORANGE,True)
    c.text(1975,765,'1분씩 FIFO로 줄을 처리',34,ORANGE)
    c.line([(2300,843),(2300,890)],ORANGE,5,True)
    c.text(1955,916,'같은 예측 엔진을 공유',43,INK,True)
    c.para(1955,989,'카드: 30분 목표 추천 총수량\n팝업 COUNT: 수량 → 해소시간\n팝업 TIME: 목표시간 → 수량',690,37)
    c.line([(2300,1180),(2300,1227)],ORANGE,5,True)
    c.rect(1938,1245,724,109,PALE_ORANGE)
    c.text(1975,1278,'FcltQueueScenarioModal',36,ORANGE,True)
    c.para(1955,1400,'입력 변경 → 서버에서 재계산\nReact는 결과를 표시',690,35,MUTED)

    c.text(100,1640,'세 가지 시간을 구분하면 구조가 보입니다',48,INK,True)
    for x,large,label,body,color,fill in [
        (100,'10분','저장 단위','시설별 기초 통계를 묶는 크기',BLUE,PALE_BLUE),
        (1000,'30분','관측 창','시각 t 직전에 처리된 여객 평가',TEAL,PALE_TEAL),
        (1900,'1분','예측 간격','시설 수 변경 후 미래를 진행',ORANGE,PALE_ORANGE),
    ]:
        c.rect(x,1740,800,250,fill)
        c.text(x+35,1772,large,72,color,True)
        c.text(x+260,1794,label,40,INK,True)
        c.para(x+35,1882,body,730,33,MUTED)
    c.footer('1 / 3','근거: CastApiServiceImpl · CastFcltWtngServiceImpl · FcltQueueClearance')
    c.save('01-overview')


def storage():
    c = Canvas(2600)
    c.header('02 / 03','저장: CAST 결과를 10분 재료로 바꾸기','체크인은 공용 줄을 다시 만들고, 출국장은 원천 실적을 묶습니다.')
    c.rect(100,295,2600,310,WHITE,24,LINE)
    c.chip(140,330,'공통 입력',BLUE,PALE_BLUE)
    c.text(390,338,'REQ_SetResource.do → XML 해석 → 실행·모델·시설 매핑',44,INK,True)
    c.para(145,427,'현재 대기인원 + 구간 처리인원 + 평균 처리시간 + 평균 대기시간 + 결과시각',2470,39)
    c.text(145,505,'설정 STNG · 원천 결과 RSLT_DTL 저장',39,BLUE,True)
    c.text(145,561,'미매핑 시설은 별도 제외 테이블로 분리합니다. FinishedClients_Abs는 구간 처리인원입니다.',31,MUTED)
    c.line([(1400,619),(1400,650),(735,650),(735,690)],BLUE,5,True)
    c.line([(1400,650),(2065,650),(2065,690)],TEAL,5,True)

    for x,color,fill,title,subtitle in [
        (100,BLUE,PALE_BLUE,'체크인 CHKN','CC 유인 카운터만 · CK / SBD 제외'),
        (1430,TEAL,PALE_TEAL,'출국장 DEP','SC + SR 합산 · LGT 제외'),
    ]:
        c.rect(x,710,1270,1065,WHITE,24,LINE)
        c.rect(x,710,1270,180,fill,24)
        c.text(x+38,744,title,50,color,True)
        c.text(x+38,820,subtitle,33,color)
    y=930
    y=c.item(140,y,'1','부스별 원천 + 실행 배정표','같은 아일랜드의 부스별 대기·처리인원을 합칩니다. 실행에 연결된 배정표로 운영 부스 수를 구합니다.',1170,BLUE,35)
    y=c.item(140,y,'2','유입을 역산 → 1분 공용 FIFO','유입 = 종료대기 - 직전 종료대기 + 처리인원\n1분씩 유입시키고, 먼저 온 사람부터 처리합니다.',1170,BLUE,35)
    y=c.item(140,y,'3','1분 결과 10개 → 10분 통계','대기시간도 공용 FIFO에서 다시 계산합니다.\n처리용량 = 운영 부스 수 × 60 ÷ 처리초',1170,BLUE,35)
    c.para(178,1650,'처리시간이 없으면 최근 평균·터미널 평균·관측 처리량 순으로 보완합니다.',1110,30,MUTED)
    assert y<1680,y
    y=930
    y=c.item(1470,y,'1','출국장별 원천 + 실행 운영 수','SC·SR 처리인원과 대기를 출국장 단위로 합칩니다. 운영 수는 실행 보안검색 리소스에서 읽습니다.',1170,TEAL,35)
    y=c.item(1470,y,'2','인원 가중합으로 시간 보존','대기초 합 = Σ(평균 대기초 × 처리인원)\n처리초 합도 같은 방법으로 만듭니다.',1170,TEAL,35)
    y=c.item(1470,y,'3','결과시각 e → 직전 10분에 배치','e = 10:00이면 09:50~10:00 통계입니다.\n양 끝 결과시각이 있어야 관측 Y입니다.',1170,TEAL,35)
    c.para(1508,1650,'출국장은 평균끼리 단순 평균하지 않고, 처리인원이 많은 결과에 더 큰 비중을 줍니다.',1110,30,MUTED)
    assert y<1680,y
    c.line([(735,1790),(735,1820),(1400,1820),(1400,1850)],BLUE,5,True)
    c.line([(2065,1790),(2065,1820),(1400,1820)],TEAL,5)

    c.rect(100,1870,2600,410,NAVY)
    c.text(145,1907,'TN_PM_SMLT_FCLT_WTNG_RSLT',55,WHITE,True)
    c.text(145,1985,'한 행 = 실행 + 모델 + 터미널 + 시설유형 + 시설단위 + 10분 시작시각',37,'#D5E1F2')
    cols=[(145,'줄 상태','종료 대기인원 · 운영 수'),(1000,'처리·대기 실적','처리인원 · 시간합 · 유효인원'),(1855,'보조 재료','표본 · 처리용량 · 관측 Y/N')]
    for x,title,body in cols:
        c.text(x,2075,title,39,'#8DD6DA',True)
        c.para(x,2140,body,790,32,'#D5E1F2')

    c.rect(100,2320,2600,145,PALE_ORANGE)
    c.text(145,2350,'함께 커밋',38,ORANGE,True)
    c.text(430,2350,'원천 저장 + 10분 통계 저장이 같은 트랜잭션입니다.',40,INK,True)
    c.text(430,2410,'실패 시 함께 롤백 / 등급·추천·해소시간은 이 테이블에 저장하지 않습니다.',32,MUTED)
    c.footer('2 / 3','근거: createInitialResult · ChknQueueCalculator · ChknWtngSecBuilder · DepWtngSecBuilder')
    c.save('02-storage')


def calculation():
    c=Canvas(3100)
    c.header('03 / 03','계산: 시설을 몇 개 운영하면 언제 해소될까?','같은 재료와 같은 FIFO 예측을 카드·팝업 COUNT·팝업 TIME이 나눠 씁니다.')
    c.rect(100,295,2600,360,WHITE,24,LINE)
    c.text(140,330,'관측과 예측의 시간축',44,INK,True)
    c.text(140,402,'예: 기준시각 t = 10:00',34,MUTED)
    start=790
    for i,label in enumerate(['09:30~09:40','09:40~09:50','09:50~10:00']):
        x=start+365*i
        c.rect(x,405,350,100,PALE_TEAL,14)
        c.text(x+32,438,label,32,TEAL,True)
    c.line([(1900,385),(1900,595)],ORANGE,5)
    c.text(1940,429,'10:01 → 10:02 → …',37,ORANGE,True)
    c.text(1940,503,'1분씩 미래 예측',34,ORANGE)
    c.text(800,545,'10분 행 3개: 직전 30분 [t-30, t)',35,TEAL,True)
    c.text(1940,562,'t부터 시설 수 변경',32,MUTED)

    c.text(100,710,'1. 먼저 현재 상태와 유입·처리속도를 구합니다',47,INK,True)
    c.rect(100,793,2600,475,WHITE,24,LINE)
    rows=[
        ('현재 대기 Q0','10:00 직전 10분 행의 종료 대기인원'),
        ('현재 평균 대기 W','직전 30분 대기초 합 ÷ 그 30분 처리인원'),
        ('분당 유입 λ','(Q0 - 09:30 시작대기 + 30분 처리인원) ÷ 30'),
        ('시설 1개당 처리율 μ','체크인: 처리용량 합 ÷ 유효 운영부스·분 합'),
        ('','출국장: 60 ÷ 인원 가중평균 처리초'),
    ]
    for i,(label,value) in enumerate(rows):
        y=827+i*78
        if i in [0,2,3]: c.rect(119,y-9,2562,76,'#F6F8FC',5)
        c.text(145,y,label,36,TEAL,True)
        c.text(770,y,value,37,INK)
    c.text(145,1224,'※ 설명용 단위는 명/분입니다. 서버 내부는 λ·μ를 명/시간으로 계산합니다.',29,MUTED)

    c.text(100,1323,'2. 같은 시작 상태에서 시설 수 s를 바꿔 예측합니다',47,INK,True)
    c.rect(100,1405,1270,900,WHITE,24,LINE)
    c.chip(140,1440,'공통 예측 엔진',ORANGE,PALE_ORANGE)
    c.text(140,1532,'과거 이력 + 남은 줄의 도착시각 복원',39,INK,True)
    c.para(140,1602,'10분 통계를 1분씩 균등 분배합니다. 남은 대기자는 이미 기다린 시간을 이어 셉니다.',1180,35,MUTED)
    c.line([(735,1724),(735,1770)],ORANGE,5,True)
    c.rect(140,1787,1190,160,PALE_ORANGE)
    c.text(178,1818,'매분 λ명 유입 → 오래 기다린 순서로 s × μ명 처리',36,ORANGE,True)
    c.text(178,1881,'시설 수는 즉시 변경 · 유입률과 시설당 처리율은 일정',31,ORANGE)
    c.line([(735,1960),(735,2002)],ORANGE,5,True)
    c.text(140,2020,'미래시각 u 직전 30분 평균 W(u) 계산',39,INK,True)
    c.para(140,2090,'창 안의 과거는 실제 처리 이력, 미래는 예측값입니다.\nW(u) < NORMAL 상한이 되는 첫 시각 = 해소시각',1180,35,MUTED)
    c.text(140,2243,'기준 상한은 등급표에서 읽습니다. 예: 40분 미만.',32,ORANGE,True)

    c.rect(1430,1405,1270,900,WHITE,24,LINE)
    c.chip(1470,1440,'이 엔진을 쓰는 세 경로',BLUE,PALE_BLUE)
    c.text(1470,1532,'팝업 COUNT: 수량을 입력',41,BLUE,True)
    c.para(1470,1605,'입력 수량 s로 해소시간·30분 후 평균 대기를 계산합니다. 첫 화면은 현재 운영 수량입니다.',1170,35,MUTED)
    c.line([(1470,1730),(2660,1730)],LINE,2)
    c.text(1470,1768,'팝업 TIME: 목표시간 H를 입력',41,TEAL,True)
    c.para(1470,1841,'수량을 작은 값부터 바꿔가며, 목표를 만족하는 최소 총수량 reqCnt를 찾습니다.',1170,35,MUTED)
    c.text(1470,1980,'추천 조건',35,TEAL,True)
    c.para(1690,1980,'H 안에 해소 + H 시각에도 목표 충족\n처리능력 s × μ > 유입 λ',970,34,INK)
    c.line([(1470,2110),(2660,2110)],LINE,2)
    c.text(1470,2148,'대시보드 카드 = TIME 목표 30분',41,ORANGE,True)
    c.text(1470,2215,'예: 상한 40분일 때, 30분 안에 평균 대기 40분 미만',31,MUTED)
    c.text(1470,2265,'추천 총수량 + 그 수량 적용 시 해소시각을 표시',31,MUTED)

    c.rect(100,2360,2600,335,PALE_TEAL)
    c.text(140,2394,'숫자로 읽는 예시',43,TEAL,True)
    c.text(720,2404,'아래 숫자는 이해를 위한 예시이며 실측 결과가 아닙니다.',30,MUTED)
    c.text(145,2482,'시작대기 60명 → 현재대기 90명 / 30분 처리 270명',40,INK,True)
    c.text(145,2555,'λ = (90 - 60 + 270) ÷ 30 = 10명/분',39,TEAL,True)
    c.text(145,2624,'대기초 합 810,000초 ÷ 270명 = 평균 50분',36,INK)
    c.text(1620,2482,'μ가 2명/분이면',38,INK,True)
    c.text(1620,2555,'안정 조건만 보면 최소 6개',39,TEAL,True)
    c.para(1620,2624,'최종 추천은 FIFO 목표시간까지 확인해 결정',1020,31,MUTED)

    c.rect(100,2740,2600,205,PALE_ORANGE)
    c.text(140,2775,'헷갈리기 쉬운 세 가지',38,ORANGE,True)
    c.text(140,2840,'해소 = 평균 대기 기준 충족',35,INK,True)
    c.text(1030,2840,'reqCnt = 현재 운영분 포함 총수',35,INK,True)
    c.text(2030,2840,'Erlang C = 참고지표',35,INK,True)
    c.text(140,2898,'줄이 0명이 되어도 과거 처리 이력이 창에 남아 평균이 늦게 내려갈 수 있습니다.',30,MUTED)
    c.footer('3 / 3','근거: FcltWtngDay · FcltQueueClearance · WaitAvgForecast · CastFcltQueueScenarioServiceImpl')
    c.save('03-calculation')


if __name__ == '__main__':
    overview()
    storage()
    calculation()
    pages = [Image.open(OUT/f'{name}.png') for name in ['01-overview','02-storage','03-calculation']]
    poster = Image.new('RGB',(W,sum(p.height for p in pages)+80*(len(pages)-1)), '#DCE4EF')
    y=0
    for page in pages:
        poster.paste(page,(0,y))
        y += page.height+80
    poster.save(OUT/'cast-wait-flow-all.png',optimize=True)
    preview = pages[0].copy()
    preview.thumbnail((1600,1600))
    preview.save(OUT/'overview-preview.png', optimize=True)
    print('Rendered 3 diagrams, combined poster, and preview.')
