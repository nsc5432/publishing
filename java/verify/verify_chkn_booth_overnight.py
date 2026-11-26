import html
from pathlib import Path
import re
import sqlite3
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
MAPPER_DIR = ROOT / "java" / "mapper"
API_NAMESPACE = "aoms.pm.castapi.mapper.CastApiMapper"
WINDOW_FRAGMENT = "cknctDailyAlotWindowRows"
ACTUAL_FRAGMENT = "cknctDailyAlotActualRows"
STA_PATTERN = re.compile(r"(CASE\s+WHEN A\.EST_BGNG_HM IS NOT NULL[^,]*?END)\s+AS ALOT_STA_HM")
END_PATTERN = re.compile(r"(CASE\s+WHEN A\.EST_BGNG_HM IS NOT NULL[^,]*?END)\s+AS ALOT_END_HM")
BGN_MIN_PATTERN = re.compile(r"(CASE WHEN REGEXP_LIKE(?:(?!\sAS ALOT_)[\s\S])*?END)\s+AS ALOT_BGN_MIN")
END_MIN_PATTERN = re.compile(r"(CASE WHEN REGEXP_LIKE(?:(?!\sAS ALOT_)[\s\S])*?END)\s+AS ALOT_END_MIN")
BGN_DT_PATTERN = re.compile(r"(TO_DATE\(L\.OPER_YMD, 'YYYYMMDD'\)[^,]*?)\s+AS ALOT_BGN_DT")
END_DT_PATTERN = re.compile(r"(TO_DATE\(L\.OPER_YMD, 'YYYYMMDD'\)[^,]*?)\s+AS ALOT_END_DT")
HHMI_CONCAT_PATTERN = re.compile(r"TO_DATE\(\s*\w+\.OPER_YMD\s*\|\|")
SOURCES = (
    ("CAST", "CastApiMapper.xml", "retrieveCounterAllocation"),
    ("waiting", "CastChknMapper.xml", "retrieveChknBoothOperList"),
    ("dashboard", "CastDsbdMapper.xml", "retrieveChknAlnAssignmentList"),
)
DEFAULT_HOURS = ("CastChknMapper.xml", "retrieveChknList")
STATEMENT_TAGS = ("select", "insert", "update", "delete")
MINUTE_FORMAT = "%Y%m%d%H%M"
OPER_YMD = "20261023"


def load_mappers():
    roots = {}
    for path in sorted(MAPPER_DIR.glob("*.xml")):
        root = ET.parse(path).getroot()
        roots[root.get("namespace")] = (path.name, root)
    return roots


def resolve_fragment(mappers, root, refid):
    if "." in refid:
        namespace, fragment_id = refid.rsplit(".", 1)
        if namespace not in mappers:
            raise AssertionError(f"Missing mapper namespace: {namespace}")
        root = mappers[namespace][1]
    else:
        fragment_id = refid
    fragment = root.find(f"./sql[@id='{fragment_id}']")
    if fragment is None:
        raise AssertionError(f"Missing sql fragment: {refid}")
    return root, fragment


def element_text(mappers, root, element):
    parts = [element.text or ""]
    for child in element:
        if child.tag == "include":
            fragment_root, fragment = resolve_fragment(mappers, root, child.get("refid"))
            parts.append(element_text(mappers, fragment_root, fragment))
        elif isinstance(child.tag, str):
            parts.append(element_text(mappers, root, child))
        parts.append(child.tail or "")
    return "".join(parts)


def clean(sql):
    return re.sub(r"--[^\n]*", "", html.unescape(sql))


def statement_sql(mappers, filename, statement_id):
    for name, root in mappers.values():
        if name != filename:
            continue
        for tag in STATEMENT_TAGS:
            statement = root.find(f"./{tag}[@id='{statement_id}']")
            if statement is not None:
                return clean(element_text(mappers, root, statement))
    raise AssertionError(f"Missing statement: {filename}#{statement_id}")


def fragment_sql(mappers, fragment_id):
    root, fragment = resolve_fragment(mappers, mappers[API_NAMESPACE][1], f"{API_NAMESPACE}.{fragment_id}")
    return clean(element_text(mappers, root, fragment))


def search(pattern, sql, label):
    found = pattern.search(sql)
    if found is None:
        raise AssertionError(f"Missing {pattern.pattern[:40]}... in {label}")
    return found.group(1)


def normalize(expression):
    return re.sub(r"\s+", " ", expression).strip()


def to_days(value, fmt):
    moment = datetime.strptime(value, "%Y%m%d" if fmt == "YYYYMMDD" else MINUTE_FORMAT)
    return moment.toordinal() + (moment.hour * 60 + moment.minute) / 1440


def from_days(value):
    if value is None:
        return None
    days = int(value)
    minutes = round((value - days) * 1440)
    return (datetime.fromordinal(days) + timedelta(minutes=minutes)).strftime(MINUTE_FORMAT)


def regexp_like(value, pattern):
    return value is not None and re.search(pattern, value) is not None


def evaluate(connection, expression, alias, values):
    columns = ", ".join(f"? AS {column}" for column in values)
    return connection.execute(
        f"SELECT {expression} FROM (SELECT {columns}) {alias}", tuple(values.values())
    ).fetchone()[0]


def check_sources(mappers):
    for _, filename, statement_id in SOURCES:
        sql = statement_sql(mappers, filename, statement_id)
        for column in ("ALOT_BGN_DT AS BGN_DT", "ALOT_END_DT AS END_DT"):
            if column not in normalize(sql):
                raise AssertionError(f"{statement_id}: does not read shared {column}")
        if HHMI_CONCAT_PATTERN.search(sql):
            raise AssertionError(f"{statement_id}: builds allocation time with TO_DATE(OPER_YMD || HHMI)")


def check_chkn_alot_with(mappers):
    checked = 0
    for name, root in mappers.values():
        for tag in STATEMENT_TAGS:
            for statement in root.findall(f"./{tag}"):
                sql = clean(element_text(mappers, root, statement))
                if re.search(r"(FROM|JOIN)\s+CHKN_ALOT\b", sql) is None:
                    continue
                if re.search(r"\bCHKN_ALOT AS \(", sql) is None:
                    raise AssertionError(f"{name}#{statement.get('id')}: reads CHKN_ALOT without gdDataChknAlotWith")
                checked += 1
    if checked == 0:
        raise AssertionError("No statement reads CHKN_ALOT")
    return checked


def main():
    mappers = load_mappers()
    window_sql = fragment_sql(mappers, WINDOW_FRAGMENT)
    actual_sql = fragment_sql(mappers, ACTUAL_FRAGMENT)
    sta_expression = search(STA_PATTERN, window_sql, WINDOW_FRAGMENT)
    end_expression = search(END_PATTERN, window_sql, WINDOW_FRAGMENT)
    bgn_min_expression = search(BGN_MIN_PATTERN, window_sql, WINDOW_FRAGMENT)
    end_min_expression = search(END_MIN_PATTERN, window_sql, WINDOW_FRAGMENT)
    bgn_dt_expression = search(BGN_DT_PATTERN, actual_sql, ACTUAL_FRAGMENT)
    end_dt_expression = search(END_DT_PATTERN, actual_sql, ACTUAL_FRAGMENT)

    check_sources(mappers)
    with_statements = check_chkn_alot_with(mappers)

    default_sql = statement_sql(mappers, *DEFAULT_HOURS)
    for label, expression in (("start", sta_expression), ("end", end_expression)):
        if normalize(expression) not in normalize(default_sql):
            raise AssertionError(f"{DEFAULT_HOURS[1]}: {label} time selection differs from CA001")

    connection = sqlite3.connect(":memory:")
    connection.create_function("TO_NUMBER", 1, lambda value: None if value is None else int(value))
    connection.create_function("TO_DATE", 2, to_days)
    connection.create_function("REGEXP_LIKE", 2, regexp_like)
    columns = ("EST_BGNG_HM", "EST_END_HM", "EST_RON_YN", "LAST_BGNG_HM", "LAST_END_HM", "LAST_RON_YN")
    cases = [
        ("same day", ("0800", "1000", "N", None, None, None), ("202610230800", "202610231000")),
        ("crosses midnight", ("2200", "0100", "N", None, None, None), ("202610232200", "202610240100")),
        ("RON flag ignored when same day", ("0800", "1000", "Y", None, None, None), ("202610230800", "202610231000")),
        ("null flag ignored", ("0800", "1000", None, None, None, None), ("202610230800", "202610231000")),
        ("estimated pair wins", ("0800", "1000", "N", "2200", "0100", "Y"), ("202610230800", "202610231000")),
        ("last pair fallback", (None, None, "Y", "2200", "0100", "N"), ("202610232200", "202610240100")),
        ("partial estimate uses last pair", ("0900", None, "N", "0700", "1200", "N"), ("202610230700", "202610231200")),
        ("partial estimate crosses midnight", (None, "0300", "N", "2300", "0100", "N"), ("202610232300", "202610240100")),
        ("24:00 end", ("2200", "2400", "N", None, None, None), ("202610232200", "202610240000")),
        ("whole day to 24:00", ("0000", "2400", "N", None, None, None), ("202610230000", "202610240000")),
        ("same start and end excluded", ("0800", "0800", "N", None, None, None), None),
        ("malformed time excluded", ("08:0", "1000", "N", None, None, None), None),
        ("missing time excluded", (None, None, None, None, "1000", None), None),
    ]
    checks = 0
    for label, inputs, expected in cases:
        values = dict(zip(columns, inputs))
        sta = evaluate(connection, sta_expression, "A", values)
        end = evaluate(connection, end_expression, "A", values)
        window = {"ALOT_STA_HM": sta, "ALOT_END_HM": end}
        bgn_min = evaluate(connection, bgn_min_expression, "T", window)
        end_min = evaluate(connection, end_min_expression, "T", window)
        minutes = {
            "OPER_YMD": OPER_YMD,
            "ALOT_BGN_MIN": None if bgn_min is None else float(bgn_min),
            "ALOT_END_MIN": None if end_min is None else float(end_min),
        }
        bgn_dt = evaluate(connection, bgn_dt_expression, "L", minutes)
        end_dt = evaluate(connection, end_dt_expression, "L", minutes)
        kept = bgn_dt is not None and end_dt is not None and bgn_dt < end_dt
        actual = (from_days(bgn_dt), from_days(end_dt)) if kept else None
        if actual != expected:
            raise AssertionError(f"{label}: expected {expected}, actual {actual}")
        checks += 2
    connection.close()
    print(
        f"PASS {checks} allocation time checks, {len(SOURCES)} sources on shared fragment, "
        f"{with_statements} CHKN_ALOT statements (Oracle execution not covered)"
    )


if __name__ == "__main__":
    main()
