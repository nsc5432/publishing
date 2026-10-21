package aoms.pm.castrest.service;

import aoms.pm.castrest.log.CastRestLogEntry;
import aoms.pm.castrest.log.CastRestLogSettings;

public interface CastRestLogService {
    CastRestLogSettings retrieveSettings(String apiTypeCd);
    void saveLog(CastRestLogEntry entry);
}
