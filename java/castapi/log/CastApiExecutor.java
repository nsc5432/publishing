package aoms.pm.castapi.log;

import java.util.Collections;
import java.util.function.Function;

import org.apache.ibatis.exceptions.PersistenceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.TransactionException;

import aoms.pm.castapi.service.CastApiLogService;

@Component
public class CastApiExecutor {
    public static final String GET_RESOURCE_INFORMATION = "GetResourceInformation";
    public static final String GET_RESOURCE = "GetResource";
    public static final String SET_RESOURCE = "SetResource";

    private static final Logger LOGGER = LoggerFactory.getLogger(CastApiExecutor.class);

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
        } catch (DataAccessException | TransactionException | PersistenceException
                | IllegalStateException | IllegalArgumentException | SecurityException e) {
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
        } catch (DataAccessException | TransactionException | PersistenceException
                | IllegalStateException | IllegalArgumentException e) {
            LOGGER.error("CAST REST log settings failed. API_TYPE_CD=" + apiTypeCd, e);
            return new CastApiLogSettings(Collections.emptyList());
        }
    }

    private void saveLog(CastApiLogSettings settings, String apiTypeCd,
            String msgTypeCd, String logCn) {
        if (!settings.isEnabled(msgTypeCd)) {
            return;
        }
        try {
            castApiLogService.saveLog(new CastApiLogEntry(apiTypeCd, msgTypeCd, logCn));
        } catch (DataAccessException | TransactionException | PersistenceException
                | IllegalStateException | IllegalArgumentException e) {
            LOGGER.error("CAST REST log insert failed. API_TYPE_CD=" + apiTypeCd
                    + ", MSG_TYPE_CD=" + msgTypeCd, e);
        }
    }
}
