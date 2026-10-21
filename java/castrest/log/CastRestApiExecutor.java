package aoms.pm.castrest.log;

import java.util.Collections;
import java.util.function.Function;

import org.apache.ibatis.exceptions.PersistenceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.TransactionException;

import aoms.pm.castrest.service.CastRestLogService;

@Component
public class CastRestApiExecutor {
    public static final String GET_RESOURCE_INFORMATION = "GetResourceInformation";
    public static final String GET_RESOURCE = "GetResource";
    public static final String SET_RESOURCE = "SetResource";

    private static final Logger LOGGER = LoggerFactory.getLogger(CastRestApiExecutor.class);

    private final CastRestLogService castRestLogService;

    public CastRestApiExecutor(CastRestLogService castRestLogService) {
        this.castRestLogService = castRestLogService;
    }

    public String execute(String apiTypeCd, String payload, Function<CastRestApiContext, String> action) {
        CastRestApiContext context = new CastRestApiContext();
        CastRestLogSettings settings = retrieveSettings(apiTypeCd);
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

    private CastRestLogSettings retrieveSettings(String apiTypeCd) {
        try {
            return castRestLogService.retrieveSettings(apiTypeCd);
        } catch (DataAccessException | TransactionException | PersistenceException
                | IllegalStateException | IllegalArgumentException e) {
            LOGGER.error("CAST REST log settings failed. API_TYPE_CD=" + apiTypeCd, e);
            return new CastRestLogSettings(Collections.emptyList());
        }
    }

    private void saveLog(CastRestLogSettings settings, String apiTypeCd,
            String msgTypeCd, String logCn) {
        if (!settings.isEnabled(msgTypeCd)) {
            return;
        }
        try {
            castRestLogService.saveLog(new CastRestLogEntry(apiTypeCd, msgTypeCd, logCn));
        } catch (DataAccessException | TransactionException | PersistenceException
                | IllegalStateException | IllegalArgumentException e) {
            LOGGER.error("CAST REST log insert failed. API_TYPE_CD=" + apiTypeCd
                    + ", MSG_TYPE_CD=" + msgTypeCd, e);
        }
    }
}
