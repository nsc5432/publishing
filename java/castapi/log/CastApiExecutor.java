package aoms.pm.castapi.log;

import java.util.Collections;
import java.util.function.Function;

import org.apache.ibatis.exceptions.PersistenceException;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.TransactionException;

import aoms.pm.castapi.service.CastApiLogService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class CastApiExecutor {
    private final CastApiLogService castApiLogService;

    public CastApiExecutor(CastApiLogService castApiLogService) {
        this.castApiLogService = castApiLogService;
    }

    public String execute(String apiTypeCd, String payload, Function<CastApiContext, String> action) {
        CastApiContext context = new CastApiContext();
        CastApiLogSettings settings = retrieveSettings(apiTypeCd);
        saveLog(settings, apiTypeCd, "payload", payload);

        try {
            String result = action.apply(context);
            if (result != null) {
                saveLog(settings, apiTypeCd, "result", result);
            }
            return result;
        } catch (DataAccessException | TransactionException | PersistenceException | NumberFormatException e) {
            context.addException(e);
            throw e;
        } finally {
            if (settings.isEnabled("errorMsg") && context.hasErrors()) {
                saveLog(settings, apiTypeCd, "errorMsg", context.formatErrors(apiTypeCd));
            }
        }
    }

    private CastApiLogSettings retrieveSettings(String apiTypeCd) {
        try {
            return castApiLogService.retrieveSettings(apiTypeCd);
        } catch (DataAccessException | TransactionException | PersistenceException e) {
            log.error("CAST REST 로그 설정 조회에 실패했습니다. API 유형 코드=" + apiTypeCd, e);
            return new CastApiLogSettings(Collections.emptyList());
        }
    }

    private void saveLog(CastApiLogSettings settings, String apiTypeCd, String msgTypeCd, String logCn) {
        if (!settings.isEnabled(msgTypeCd)) {
            return;
        }

        try {
            castApiLogService.saveLog(new CastApiLogEntry(apiTypeCd, msgTypeCd, logCn));
        } catch (DataAccessException | TransactionException | PersistenceException e) {
            log.error("CAST REST 로그 저장에 실패했습니다. API 유형 코드=" + apiTypeCd + ", 메시지 유형 코드=" + msgTypeCd, e);
        }
    }
}
