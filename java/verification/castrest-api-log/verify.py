from pathlib import Path
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET


JAVA_ROOT = Path(__file__).resolve().parents[2]
CHECK_ROOT = Path(__file__).resolve().parent

STUBS = {
    'org/springframework/stereotype/Component.java': '''
package org.springframework.stereotype;
public @interface Component {}
''',
    'org/springframework/dao/DataAccessException.java': '''
package org.springframework.dao;
public abstract class DataAccessException extends RuntimeException {
    public DataAccessException(String message) { super(message); }
}
''',
    'org/springframework/transaction/TransactionException.java': '''
package org.springframework.transaction;
public abstract class TransactionException extends RuntimeException {
    public TransactionException(String message) { super(message); }
}
''',
    'org/apache/ibatis/exceptions/PersistenceException.java': '''
package org.apache.ibatis.exceptions;
public class PersistenceException extends RuntimeException {
    public PersistenceException(String message) { super(message); }
}
''',
    'org/slf4j/Logger.java': '''
package org.slf4j;
public interface Logger { void error(String message, Throwable error); }
''',
    'org/slf4j/LoggerFactory.java': '''
package org.slf4j;
public class LoggerFactory {
    public static final java.util.List<String> EVENTS = new java.util.ArrayList<>();
    public static Logger getLogger(Class<?> type) {
        return (message, error) -> EVENTS.add(message + error.toString());
    }
}
''',
}


def check_sources():
    for name in ('CastRestMapper.xml', 'CastRestLogMapper.xml'):
        ET.parse(JAVA_ROOT / 'mapper' / name)
    mapper = ET.parse(JAVA_ROOT / 'mapper' / 'CastRestLogMapper.xml').getroot()
    assert mapper.attrib['namespace'] == 'aoms.pm.castrest.mapper.CastRestLogMapper'
    assert {node.attrib['id'] for node in mapper} == {'retrieveSettings', 'insertLog'}
    insert_sql = mapper.find('insert').text
    assert 'jdbcType=CLOB' in insert_sql and 'ClobTypeHandler' in insert_sql
    assert 'SQ1_TH_PM_CASTREST_LOG.NEXTVAL' in insert_sql
    migration = (JAVA_ROOT / 'ddl' / '2026-10-21-castrest-api-log.sql').read_text(encoding='utf-8')
    baseline = (JAVA_ROOT / 'ddl' / 'cast-ddl.sql').read_text(encoding='utf-8')
    core = migration[migration.index('CREATE TABLE PMOWN.TN_PM_CASTREST_LOG_STNG'):]
    assert baseline.endswith(core), 'Baseline and migration differ'
    assert 'UNIQUE (CL_ID, MSG_TYPE_CD)' in core
    assert 'FOREIGN KEY' not in core and 'DROP ' not in migration and 'PURGE' not in migration
    for name in re.findall(r'(?:CONSTRAINT|SEQUENCE|INDEX)\s+(?:PMOWN\.)?(\w+)', core):
        assert len(name) <= 30, f'Oracle identifier too long: {name}'
    for path in (JAVA_ROOT / 'castrest').rglob('*.java'):
        source = path.read_text(encoding='utf-8')
        assert 'CastRestDebugService' not in source and 'insertSetResourceRequest' not in source
        for catch in re.findall(r'catch\s*\(([^)]+)\)', source):
            assert not re.search(r'\b(?:Exception|RuntimeException|Throwable|NullPointerException)\b', catch)
    controller = (JAVA_ROOT / 'castrest/controller/CastRestController.java').read_text(encoding='utf-8')
    assert controller.count('castRestApiExecutor.execute(') == 3
    assert 'return castRestService.retrieveResourceInformation(infoDto);' in controller
    assert 'return castRestService.retrieveResource(resourceDto);' in controller
    assert 'return castRestService.deleteResult(param);' in controller
    print('PASS: mapper XML, DDL consistency, API scope and concrete catches', flush=True)


def main():
    check_sources()
    with tempfile.TemporaryDirectory(prefix='castrest-api-log-') as temporary:
        work = Path(temporary)
        stub_sources = []
        for name, source in STUBS.items():
            path = work / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(source, encoding='utf-8')
            stub_sources.append(path)
        real_sources = sorted((JAVA_ROOT / 'castrest/log').glob('*.java'))
        real_sources.append(JAVA_ROOT / 'castrest/service/CastRestLogService.java')
        subprocess.run([
            'javac', '--release', '8', '-encoding', 'UTF-8', '-d', str(work),
            *map(str, stub_sources), *map(str, real_sources),
            str(CHECK_ROOT / 'CastRestApiExecutorCheck.java'),
        ], check=True)
        subprocess.run(['java', '-cp', str(work), 'CastRestApiExecutorCheck'], check=True)
        subprocess.run([
            'javac', '-encoding', 'UTF-8', '-d', str(work), str(CHECK_ROOT / 'JavaSyntaxCheck.java'),
        ], check=True)
        sources = sorted((JAVA_ROOT / 'castrest').rglob('*.java'))
        subprocess.run(['java', '-cp', str(work), 'JavaSyntaxCheck', *map(str, sources)], check=True)


if __name__ == '__main__':
    main()
