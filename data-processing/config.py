# ── Tibero DB 접속 정보 ──────────────────────────────────────────────────────
DB_HOST     = "localhost"
DB_PORT     = 8629
DB_NAME     = "tibero"
DB_USER     = "your_username"
DB_PASSWORD = "your_password"

# Tibero JDBC 드라이버 (jaydebeapi 사용)
# pip install jaydebeapi
# jar 경로는 common.py 가 스크립트 폴더의 jar/tibero6-jdbc.jar 로 고정한다.
JDBC_DRIVER_CLASS = "com.tmax.tibero.jdbc.TbDriver"

# ── 국적사 코드 ───────────────────────────────────────────────────────────────
DOMESTIC_CARRIERS = {"KE", "OZ", "7C", "ZE", "TW", "RS", "YP", "LJ", "BX"}

# ── 경로 ─────────────────────────────────────────────────────────────────────
BASE_DIR    = "data"
QUERIES_DIR = "queries"
