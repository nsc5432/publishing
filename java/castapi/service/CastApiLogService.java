package aoms.pm.castapi.service;

import aoms.pm.castapi.log.CastApiLogEntry;
import aoms.pm.castapi.log.CastApiLogSettings;

public interface CastApiLogService {
    CastApiLogSettings retrieveSettings(String castApiTypeCd);
    void saveLog(CastApiLogEntry entry);
}
