import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import org.apache.ibatis.exceptions.PersistenceException;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.transaction.TransactionException;

import aoms.pm.castapi.log.CastApiContext;
import aoms.pm.castapi.log.CastApiExecutor;
import aoms.pm.castapi.log.CastApiLogEntry;
import aoms.pm.castapi.log.CastApiLogSetting;
import aoms.pm.castapi.log.CastApiLogSettings;
import aoms.pm.castapi.service.CastApiLogService;

public class CastApiExecutorCheck {
    private static final List<String> APIS = Arrays.asList(
            "GetResourceInformation", "GetResource", "SetResource");
    private static final List<String> TYPES = Arrays.asList("payload", "result", "errorMsg");
    private static int checks;

    private static class DbFailure extends DataAccessException {
        DbFailure(String message) { super(message); }
    }

    private static class TxFailure extends TransactionException {
        TxFailure(String message) { super(message); }
    }

    private static class FakeLogService implements CastApiLogService {
        final Map<String, List<CastApiLogSetting>> rows = new HashMap<>();
        final List<CastApiLogEntry> entries = Collections.synchronizedList(new ArrayList<>());
        final List<String> attempts = new ArrayList<>();
        final AtomicInteger reads = new AtomicInteger();
        RuntimeException readFailure;
        RuntimeException writeFailure;
        String failingType;

        void configure(String api, int mask) {
            List<CastApiLogSetting> settings = new ArrayList<>();
            for (int i = 0; i < TYPES.size(); i++) {
                CastApiLogSetting setting = new CastApiLogSetting();
                setting.setMsgTypeCd(TYPES.get(i));
                setting.setUseYn((mask & (1 << i)) == 0 ? "N" : "Y");
                settings.add(setting);
            }
            rows.put(api, settings);
        }

        public CastApiLogSettings retrieveSettings(String api) {
            reads.incrementAndGet();
            if (readFailure != null) {
                throw readFailure;
            }
            return new CastApiLogSettings(rows.getOrDefault(api, Collections.emptyList()));
        }

        public synchronized void saveLog(CastApiLogEntry entry) {
            attempts.add(entry.getMsgTypeCd());
            if (writeFailure != null && entry.getMsgTypeCd().equals(failingType)) {
                throw writeFailure;
            }
            entries.add(entry);
        }
    }

    private static void require(boolean condition, String message) {
        checks++;
        if (!condition) {
            throw new AssertionError(message);
        }
    }

    private static Map<String, CastApiLogEntry> byType(List<CastApiLogEntry> entries, String api) {
        Map<String, CastApiLogEntry> result = new HashMap<>();
        String clId = null;
        for (CastApiLogEntry entry : entries) {
            require(api.equals(entry.getApiTypeCd()), "API type changed");
            require(entry.getClId().matches("[0-9a-f]{32}"), "Invalid call ID");
            require(clId == null || clId.equals(entry.getClId()), "Call IDs differ within a request");
            require(result.put(entry.getMsgTypeCd(), entry) == null, "Duplicate message type");
            clId = entry.getClId();
        }
        return result;
    }

    private static void switchMatrix() {
        for (String api : APIS) {
            for (int mask = 0; mask < 8; mask++) {
                for (int scenario = 0; scenario < 4; scenario++) {
                    FakeLogService logs = new FakeLogService();
                    logs.configure(api, mask);
                    int currentScenario = scenario;
                    String payload = "<request>한글 &amp; \"원문\"\r\n</request>";
                    String response = scenario == 2 ? "<InvocationResult Success=\"false\"/>" : "응답\n";
                    String actual = new CastApiExecutor(logs).execute(api, payload, context -> {
                        if (currentScenario == 1 || currentScenario == 3) {
                            context.addException(new IOException("read failed", new IOException("disk cause")));
                            context.addException(new IOException("write failed"));
                        }
                        if (currentScenario == 2 || currentScenario == 3) {
                            context.addFailure("result not stored");
                        }
                        return response;
                    });
                    require(actual == response, "Response changed");
                    require(logs.reads.get() == 1, "Settings not read exactly once");
                    Map<String, CastApiLogEntry> saved = byType(logs.entries, api);
                    for (int i = 0; i < TYPES.size(); i++) {
                        boolean expected = (mask & (1 << i)) != 0 && (i != 2 || scenario != 0);
                        require(saved.containsKey(TYPES.get(i)) == expected, "Independent switch failed");
                    }
                    if (saved.containsKey("payload")) {
                        require(payload.equals(saved.get("payload").getLogCn()), "Payload changed");
                    }
                    if (saved.containsKey("result")) {
                        require(response.equals(saved.get("result").getLogCn()), "Result changed");
                    }
                    if (saved.containsKey("errorMsg")) {
                        String error = saved.get("errorMsg").getLogCn();
                        require(error.contains("API_TYPE_CD=" + api), "Error API missing");
                        require(error.contains("CL_ID=" + saved.get("errorMsg").getClId()), "Error ID missing");
                        require(!error.contains(payload) && !error.contains(response), "Body copied to error log");
                        if (scenario == 1 || scenario == 3) {
                            require(error.contains("java.io.IOException: read failed")
                                    && error.contains("Caused by: java.io.IOException: disk cause")
                                    && error.contains("write failed") && error.contains("\tat "), "Stack lost");
                        }
                        if (scenario == 2) {
                            require(error.contains("result not stored") && !error.contains("\tat "),
                                    "Business failure has a fabricated stack");
                        }
                    }
                }
            }
        }
    }

    private static void settingsAndBodies() {
        FakeLogService logs = new FakeLogService();
        CastApiExecutor executor = new CastApiExecutor(logs);
        executor.execute(APIS.get(0), "missing", context -> "ok");
        require(logs.entries.isEmpty(), "Missing settings must disable logging");
        logs.configure(APIS.get(0), 7);
        executor.execute(APIS.get(0), "snapshot", context -> {
            for (CastApiLogSetting row : logs.rows.get(APIS.get(0))) {
                row.setUseYn("N");
            }
            context.addFailure("failure");
            return "snapshot response";
        });
        require(logs.entries.size() == 3, "Settings changed within request");
        executor.execute(APIS.get(0), "next", context -> "next response");
        require(logs.entries.size() == 3 && logs.reads.get() == 3, "Next request did not refresh settings");

        logs.entries.clear();
        logs.configure(APIS.get(0), 2);
        executor.execute(APIS.get(0), "hidden", context -> "");
        require(logs.entries.size() == 1 && logs.entries.get(0).getLogCn().isEmpty(), "Empty result lost");
        logs.entries.clear();
        executor.execute(APIS.get(0), "hidden", context -> null);
        require(logs.entries.isEmpty(), "Absent result stored");

        String large = String.join("", Collections.nCopies(20000, "한글\r\n<&\"'>"));
        logs.configure(APIS.get(0), 3);
        executor.execute(APIS.get(0), large, context -> large);
        require(logs.entries.size() == 2, "Large body rows missing");
        require(logs.entries.stream().allMatch(row -> large.equals(row.getLogCn())), "Large body truncated");
    }

    private static void escapedFailures() {
        List<RuntimeException> failures = Arrays.asList(new DbFailure("DB"), new TxFailure("commit"),
                new PersistenceException("mapper"), new IllegalStateException("initialization"),
                new IllegalArgumentException("argument"), new SecurityException("file access"));
        for (RuntimeException failure : failures) {
            FakeLogService logs = new FakeLogService();
            logs.configure(APIS.get(2), 7);
            try {
                new CastApiExecutor(logs).execute(APIS.get(2), "request", context -> {
                    context.addException(new IOException("earlier file error"));
                    throw failure;
                });
                throw new AssertionError("Failure swallowed");
            } catch (DataAccessException | TransactionException | PersistenceException
                    | IllegalStateException | IllegalArgumentException | SecurityException actual) {
                require(actual == failure, "Original failure replaced");
            }
            Map<String, CastApiLogEntry> saved = byType(logs.entries, APIS.get(2));
            require(!saved.containsKey("result"), "Result fabricated after failure");
            String error = saved.get("errorMsg").getLogCn();
            require(error.contains("earlier file error") && error.contains(failure.toString()),
                    "Earlier error or final exception lost");
        }
    }

    private static void logFailures() {
        List<RuntimeException> failures = Arrays.asList(new DbFailure("DB"), new TxFailure("commit"),
                new PersistenceException("mapper"));
        for (RuntimeException failure : failures) {
            FakeLogService readLogs = new FakeLogService();
            readLogs.configure(APIS.get(0), 7);
            readLogs.readFailure = failure;
            String response = new CastApiExecutor(readLogs).execute(APIS.get(0), "request", context -> {
                context.addFailure("business error");
                return "failure XML";
            });
            require("failure XML".equals(response) && readLogs.attempts.isEmpty(), "Read outage affected API");
            for (String type : TYPES) {
                FakeLogService logs = new FakeLogService();
                logs.configure(APIS.get(1), 7);
                logs.failingType = type;
                logs.writeFailure = failure;
                response = new CastApiExecutor(logs).execute(APIS.get(1), "request", context -> {
                    context.addFailure("business error");
                    return "failure XML";
                });
                require("failure XML".equals(response), "Write outage changed response");
                require(logs.attempts.equals(TYPES), "Write outage retried recursively or skipped other types");
                require(logs.entries.size() == 2, "Unaffected message type not saved");
            }
        }
        FakeLogService logs = new FakeLogService();
        logs.configure(APIS.get(2), 7);
        logs.failingType = "errorMsg";
        logs.writeFailure = new TxFailure("log commit");
        DbFailure businessFailure = new DbFailure("business rollback");
        try {
            new CastApiExecutor(logs).execute(APIS.get(2), "request", context -> { throw businessFailure; });
            throw new AssertionError("Business failure swallowed");
        } catch (DbFailure actual) {
            require(actual == businessFailure, "Log outage replaced business exception");
        }
        require(!LoggerFactory.EVENTS.isEmpty(), "No server logger notification for outages");
    }

    private static void unhandledFailures() {
        for (boolean priorError : Arrays.asList(false, true)) {
            FakeLogService logs = new FakeLogService();
            logs.configure(APIS.get(1), 7);
            UnsupportedOperationException failure = new UnsupportedOperationException("unhandled");
            try {
                new CastApiExecutor(logs).execute(APIS.get(1), "request", context -> {
                    if (priorError) {
                        context.addException(new IOException("earlier file error"));
                    }
                    throw failure;
                });
                throw new AssertionError("Unhandled exception swallowed");
            } catch (UnsupportedOperationException actual) {
                require(actual == failure, "Unhandled exception replaced");
            }
            Map<String, CastApiLogEntry> saved = byType(logs.entries, APIS.get(1));
            require(!saved.containsKey("result"), "Result fabricated for unhandled exception");
            require(saved.containsKey("errorMsg") == priorError, "Unhandled error coverage misrepresented");
            if (priorError) {
                require(saved.get("errorMsg").getLogCn().contains("earlier file error"), "Earlier error lost");
                require(!saved.get("errorMsg").getLogCn().contains(failure.toString()), "Unknown error inferred");
            }
        }
    }

    private static void concurrentCalls() throws java.util.concurrent.ExecutionException, InterruptedException {
        FakeLogService logs = new FakeLogService();
        for (String api : APIS) {
            logs.configure(api, 7);
        }
        CastApiExecutor executor = new CastApiExecutor(logs);
        ExecutorService pool = Executors.newFixedThreadPool(8);
        try {
            List<Callable<String>> calls = new ArrayList<>();
            for (int i = 0; i < 120; i++) {
                String token = "request-" + i;
                String api = APIS.get(i % 3);
                calls.add(() -> executor.execute(api, token, context -> {
                    context.addFailure(token);
                    return "response-" + token;
                }));
            }
            for (Future<String> result : pool.invokeAll(calls)) {
                require(result.get().startsWith("response-request-"), "Concurrent response lost");
            }
        } finally {
            pool.shutdownNow();
        }
        Map<String, List<CastApiLogEntry>> groups = new HashMap<>();
        for (CastApiLogEntry entry : logs.entries) {
            groups.computeIfAbsent(entry.getClId(), ignored -> new ArrayList<>()).add(entry);
        }
        require(groups.size() == 120 && logs.reads.get() == 120, "Request ID collision or settings reuse");
        Set<String> tokens = new HashSet<>();
        for (List<CastApiLogEntry> group : groups.values()) {
            Map<String, CastApiLogEntry> saved = byType(group, group.get(0).getApiTypeCd());
            require(saved.size() == 3, "Concurrent request lost a row");
            String token = saved.get("payload").getLogCn();
            require(tokens.add(token), "Request shared multiple IDs");
            require(("response-" + token).equals(saved.get("result").getLogCn()), "Responses mixed");
            String error = saved.get("errorMsg").getLogCn();
            require(error.endsWith(token + System.lineSeparator()), "Errors mixed across requests");
        }
    }

    public static void main(String[] args) throws java.util.concurrent.ExecutionException, InterruptedException {
        switchMatrix();
        settingsAndBodies();
        escapedFailures();
        logFailures();
        unhandledFailures();
        concurrentCalls();
        require(!new CastApiContext().hasErrors(), "New context is not empty");
        System.out.println("PASS: " + checks + " executor assertions; no Spring/Oracle runtime involved");
    }
}
