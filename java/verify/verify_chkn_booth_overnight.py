import html
from pathlib import Path
import re
import sqlite3
from datetime import date, datetime
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
RON_PATTERN = re.compile(
    r"(CASE\s+WHEN TO_NUMBER\(NVL\(A\.EST_BGNG_HM, A\.LAST_BGNG_HM\)\).*?END)\s+AS RON_YN",
    re.DOTALL,
)
END_DAY_PATTERN = re.compile(
    r"(CASE\s+WHEN Y\.RON_YN\s*=\s*'N'.*?END)\s*\|\|\s*Y\.END_HM",
    re.DOTALL,
)


def expressions(filename, statement_id):
    root = ET.parse(ROOT / "java" / "mapper" / filename).getroot()
    statement = root.find(f"./select[@id='{statement_id}']")
    if statement is None:
        raise AssertionError(f"Missing statement: {statement_id}")
    sql = re.sub(r"--[^\n]*", "", html.unescape("".join(statement.itertext())))
    ron = RON_PATTERN.search(sql)
    ending = END_DAY_PATTERN.search(sql)
    if ron is None or ending is None:
        raise AssertionError(f"Missing overnight expressions: {statement_id}")
    return ron.group(1), ending.group(1)


def evaluate(connection, expression, alias, values):
    columns = ", ".join(f"? AS {column}" for column in values)
    return connection.execute(
        f"SELECT {expression} FROM (SELECT {columns}) {alias}", tuple(values.values())
    ).fetchone()[0]


def main():
    reference = expressions("CastApiMapper.xml", "retrieveCounterAllocation")
    actual = expressions("CastChknMapper.xml", "retrieveChknBoothOperList")
    connection = sqlite3.connect(":memory:")
    connection.create_function("NVL", 2, lambda first, second: second if first is None else first)
    connection.create_function("TO_NUMBER", 1, lambda value: None if value is None else int(value))
    connection.create_function("TO_DATE", 2, lambda value, fmt: datetime.strptime(value, "%Y%m%d").date().toordinal())
    connection.create_function("TO_CHAR", 2, lambda value, fmt: date.fromordinal(int(value)).strftime("%Y%m%d"))
    columns = ("EST_BGNG_HM", "EST_END_HM", "EST_RON_YN", "LAST_BGNG_HM", "LAST_END_HM", "LAST_RON_YN")
    cases = [
        ("explicit overnight", ("0800", "1000", "Y", None, None, None), "Y", "20261024"),
        ("same day", ("0800", "1000", "N", None, None, None), "N", "20261023"),
        ("crosses midnight", ("2200", "0100", "N", None, None, None), "Y", "20261024"),
        ("last flag wins", ("0800", "1000", "N", "0800", "1000", "Y"), "Y", "20261024"),
        ("partial last times", ("0800", "1000", "Y", "0800", None, "N"), "Y", "20261024"),
        ("last time fallback", (None, None, "Y", "0800", "1000", "N"), "N", "20261023"),
        ("null flag follows CAST", ("0800", "1000", None, None, None, None), None, "20261024"),
    ]
    checks = 0
    for label, inputs, expected_ron, expected_day in cases:
        values = dict(zip(columns, inputs))
        for source, (ron_expression, end_expression) in (("CAST", reference), ("waiting", actual)):
            ron = evaluate(connection, ron_expression, "A", values)
            if ron != expected_ron:
                raise AssertionError(f"{label} {source}: expected RON={expected_ron}, actual={ron}")
            ending = evaluate(connection, end_expression, "Y", {"RON_YN": ron, "OPER_YMD": "20261023", "OPR_DT": "20261023"})
            if ending != expected_day:
                raise AssertionError(f"{label} {source}: expected end={expected_day}, actual={ending}")
            checks += 2
    connection.close()
    print(f"PASS {checks} overnight CASE checks against CAST issuance SQL (Oracle execution not covered)")


if __name__ == "__main__":
    main()
