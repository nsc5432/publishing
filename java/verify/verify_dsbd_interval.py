from pathlib import Path
import re
import sqlite3
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[2]
FCLT_CODES = ("LS", "CC", "CK", "SBD", "LGT", "LC", "SC", "SR")


def main():
    mapper = ET.parse(ROOT / "java/mapper/CastDsbdMapper.xml").getroot()
    statement = mapper.find("./select[@id='retrieveRsltByIntrvl']")
    assert statement is not None
    sql = "".join(statement.itertext()).replace(
        "#{item}", ", ".join(f":fclt{index}" for index in range(len(FCLT_CODES)))
    )
    sql = re.sub(r"#\{(\w+)\}", r":\1", sql)

    connection = sqlite3.connect(":memory:")
    connection.execute("ATTACH DATABASE ':memory:' AS PMOWN")
    connection.execute("""
        CREATE TABLE PMOWN.TN_PM_SMLT_PSG_FCLT (
            PSG_FCLT_CD TEXT PRIMARY KEY, UP_PSG_FCLT_CD TEXT, TMNL_ID TEXT, USE_YN TEXT
        )
    """)
    connection.execute("""
        CREATE TABLE PMOWN.TN_PM_SMLT_RSLT_DTL (
            SMLT_ID TEXT, SMLT_MDL_SN INTEGER, SMLT_EXCN_DT TEXT, SMLT_ACTL_DT TEXT, PSG_FCLT_CD TEXT,
            WTNG_PSG_CNT INTEGER, TRNST_PSG_CNT INTEGER, AVG_WTNG_HR REAL
        )
    """)
    connection.executemany(
        "INSERT INTO PMOWN.TN_PM_SMLT_PSG_FCLT VALUES (?, ?, ?, ?)",
        [("CC_A", "CC", "1", "Y"), ("CC_B", "CC", "1", "Y"),
         ("SC_A", "SC", "1", "Y"), ("T2", "CC", "2", "Y"),
         ("CLOSED", "CC", "1", "N"), ("OTHER", "OTHER", "1", "Y")],
    )
    checks = 0

    def add(time, fclt, queue, processed, wait, model=1, simulation="1", day="2026-10-28", execution="2026-10-28 08:00:00"):
        connection.execute(
            "INSERT INTO PMOWN.TN_PM_SMLT_RSLT_DTL VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (simulation, model, execution, f"{day} {time}:00", fclt, queue, processed, wait),
        )

    def query(start="2026-10-28 09:00:00", end="2026-10-28 10:00:00", with_source_count=False):
        row = connection.execute(sql, {
            "smltId": "1", "smltMdlSn": 1, "tmnlId": "1", "bgnDt": start, "endDt": end,
            **{f"fclt{index}": code for index, code in enumerate(FCLT_CODES)},
        }).fetchone()
        return row if with_source_count else row[:3]

    def check(actual, expected, message):
        nonlocal checks
        assert actual == expected, f"{message}: {actual!r} != {expected!r}"
        checks += 1

    def clear():
        connection.execute("DELETE FROM PMOWN.TN_PM_SMLT_RSLT_DTL")

    check(query(), (None, None, None), "unobserved results remain unknown")
    add("09:00", "CC_A", 0, 99, 999)
    add("09:10", "CC_A", 0, 0, None)
    check(query(), (0, None, 0), "observed zero differs from missing and has no average")
    clear()

    add("09:00", "CC_A", 5, 999, 9999)
    add("09:00", "SC_A", 7, 999, 9999)
    add("09:10", "CC_A", 20, 2, 60)
    add("09:10", "CC_B", 10, 8, 300)
    add("09:10", "SC_A", 15, 10, 120)
    add("09:20", "CC_A", 5, 10, 60)
    add("09:20", "CC_B", 5, 0, None)
    add("09:20", "SC_A", 25, 5, 120)
    add("10:00", "CC_A", 999, 5, 180)
    add("10:00", "SC_A", 999, 5, 120)
    queue, wait, processed = query()
    check(queue, 45, "maximum of simultaneous totals excludes end snapshot")
    check(processed, 25, "stage totals exclude start and include end without summing stages")
    check(wait, (120 + 2400 + 1200 + 600 + 600 + 900 + 600) / 45,
          "average is weighted by processed passengers and ignores zero-count nulls")

    expected = query()
    for fclt in ("T2", "CLOSED", "OTHER"):
        add("09:10", fclt, 99999, 99999, None)
    add("09:10", "CC_A", 99999, 99999, None, model=2)
    add("09:10", "CC_A", 99999, 99999, None, simulation="2")
    add("09:10", "CC_A", 99999, 99999, None, day="2026-10-27")
    check(query(), expected, "model, terminal, usage, facility, simulation and date filters")
    add("09:30", "CC_A", 0, 1, None)
    check(query()[1], None, "positive processing with missing wait invalidates average")
    clear()

    add("09:00", "CC_A", 999, 999, 999)
    add("09:10", "CC_A", 5, 999, 999)
    add("09:20", "CC_A", 8, 1, 90)
    add("10:00", "CC_A", 10, 3, 30)
    add("10:10", "CC_A", 999, 2, 60)
    add("10:20", "CC_A", 999, 999, 999)
    check(query("2026-10-28 09:10:00", "2026-10-28 10:10:00"),
          (10, 50, 6), "09:10 to 10:10 uses exact moving boundaries")
    clear()

    add("23:50", "CC_A", 3, 999, 999)
    add("00:00", "CC_A", 999, 2, 30, day="2026-10-29")
    add("00:10", "CC_A", 999, 999, 999, day="2026-10-29")
    check(query("2026-10-28 23:50:00", "2026-10-29 00:00:00"),
          (3, 30, 2), "midnight clips processing to the selected day end")
    clear()

    add("09:10", "CC_A", 0, 2, 0)
    check(query(), (0, 0, 2), "known zero waiting time remains zero")
    check(query(with_source_count=True)[3], 1, "single source execution is identified")
    add("09:10", "CC_A", 0, 2, 0, execution="2026-10-28 08:30:00")
    check(query(with_source_count=True)[3], 2, "mixed source executions can be rejected by service")
    print(f"Dashboard interval SQL: {checks} checks passed (SQLite; Oracle integration required).")


if __name__ == "__main__":
    main()
