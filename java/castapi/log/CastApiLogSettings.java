package aoms.pm.castapi.log;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class CastApiLogSettings {
    private final Set<String> enabledTypes = new HashSet<>();

    public CastApiLogSettings(List<CastApiLogSetting> settings) {
        for (CastApiLogSetting setting : settings) {
            if ("Y".equals(setting.getUseYn())) {
                enabledTypes.add(setting.getCastLogTypeCd());
            }
        }
    }

    public boolean isEnabled(String castLogTypeCd) {
        return enabledTypes.contains(castLogTypeCd);
    }
}
