import html
from pathlib import Path
import re
import sqlite3
from datetime import datetime, timedelta
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
STA_PATTERN = re.compile(r"(CASE\s+WHEN A\.EST_BGNG_HM IS NOT NULL[^,]*?END)\s+AS STA_HM")
END_PATTERN = re.compile(r"(CASE\s+WHEN A\.EST_BGNG_HM IS NOT NULL[^,]*?END)\s+AS END_HM")
END_DT_PATTERN = re.compile(r"(TO_DATE\(Y\.OPER_YMD \|\| Y\.END_HM.*?END)\s+AS END_DT", re.DOTALL)
SOURCES = (
    ("CAST", "CastApiMapper.xml", "retrieveCounterAllocation"),
    ("waiting", "CastChknMapper.xml", "retrieveChknBoothOperList"),
    ("dashboard", "CastDsbdMapper.xml", "retrieveChknAlnAssignmentList"),
)
DEFAULT_HOURS = ("CastChknMapper.xml", "retrieveChknList")
MINUTE_FORMAT = "%Y%m%d%H%M"


def statement_text(root, element):
    parts = [element.text or ""]
    for child in element:
        if child.tag == "include":
            fragment_id = child.get("refid").rsplit(".", 1)[-1]
            fragment = root.find(f"./sql[@id='{fragment_id}']")
            if fragment is None:
                raise AssertionError(f"Missing sql fragment: {fragment_id}")
            parts.append(statement_text(root, fragment))
        elif isinstance(child.tag, str):
            parts.append(statement_text(root, child))
        parts.append(child.tail or "")
    return "".join(parts)


def statement_sql(filename, statement_id):
    root = ET.parse(ROOT / "java" / "mapper" / filename).getroot()
    statement = root.find(f"./select[@id='{statement_id}']")
    if statement is None:
        raise AssertionError(f"Missing statement: {statement_id}")
    return re.sub(r"--[^\n]*", "", html.unescape(statement_text(root, statement)))


def search(pattern, sql, label):
    found = pattern.search(sql)
    if found is None:
        raise AssertionError(f"Missing {pattern.pattern[:40]}... in {label}")
    return found.group(1)


def normalize(expression):
    return re.sub(r"\s+", " ", expression).strip()


def to_days(value, fmt):
    moment = datetime.strptime(value, MINUTE_FORMAT)
    return moment.toordinal() + (moment.hour * 60 + moment.minute) / 1440


def from_days(value):
    days = int(value)
    minutes = round((value - days) * 1440)
    return (datetime.fromordinal(days) + timedelta(minutes=minutes)).strftime(MINUTE_FORMAT)


def evaluate(connection, expression, alias, values):
    columns = ", ".join(f"? AS {column}" for column in values)
    return connection.execute(
        f"SELECT {expression} FROM (SELECT {columns}) {alias}", tuple(values.values())
    ).fetchone()[0]


def main():
    expressions = {}
    for source, filename, statement_id in SOURCES:
        sql = statement_sql(filename, statement_id)
        expressions[source] = (
            search(STA_PATTERN, sql, statement_id),
            search(END_PATTERN, sql, statement_id),
            search(END_DT_PATTERN, sql, statement_id),
        )

    default_sql = statement_sql(*DEFAULT_HOURS)
    reference_sta, reference_end, _ = expressions["CAST"]
    for label, expression in (("start", reference_sta), ("end", reference_end)):
        if normalize(expression) not in normalize(default_sql):
            raise AssertionError(f"{DEFAULT_HOURS[1]}: {label} time selection differs from CA001")

    connection = sqlite3.connect(":memory:")
    connection.create_function("TO_NUMBER", 1, lambda value: None if value is None else int(value))
    connection.create_function("TO_DATE", 2, to_days)
    columns = ("EST_BGNG_HM", "EST_END_HM", "EST_RON_YN", "LAST_BGNG_HM", "LAST_END_HM", "LAST_RON_YN")
    cases = [
        ("same day", ("0800", "1000", "N", None, None, None), "0800", "202610231000"),
        ("crosses midnight", ("2200", "0100", "N", None, None, None), "2200", "202610240100"),
        ("RON flag ignored when same day", ("0800", "1000", "Y", None, None, None), "0800", "202610231000"),
        ("null flag ignored", ("0800", "1000", None, None, None, None), "0800", "202610231000"),
        ("estimated pair wins", ("0800", "1000", "N", "2200", "0100", "Y"), "0800", "202610231000"),
        ("last pair fallback", (None, None, "Y", "2200", "0100", "N"), "2200", "202610240100"),
        ("partial estimate uses last pair", ("0900", None, "N", "0700", "1200", "N"), "0700", "202610231200"),
        ("partial estimate crosses midnight", (None, "0300", "N", "2300", "0100", "N"), "2300", "202610240100"),
    ]
    checks = 0
    for label, inputs, expected_sta, expected_end in cases:
        values = dict(zip(columns, inputs))
        for source, (sta_expression, end_expression, end_dt_expression) in expressions.items():
            sta = evaluate(connection, sta_expression, "A", values)
            end = evaluate(connection, end_expression, "A", values)
            if sta != expected_sta:
                raise AssertionError(f"{label} {source}: expected start={expected_sta}, actual={sta}")
            end_dt = evaluate(connection, end_dt_expression, "Y", {"OPER_YMD": "20261023", "STA_HM": sta, "END_HM": end})
            actual_end = from_days(end_dt)
            if actual_end != expected_end:
                raise AssertionError(f"{label} {source}: expected end={expected_end}, actual={actual_end}")
            checks += 2
    connection.close()
    print(f"PASS {checks} overnight checks against CAST issuance SQL (Oracle execution not covered)")


if __name__ == "__main__":
    main()
