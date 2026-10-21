package aoms.pm.castrest.log;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class CastRestLogSettings {
    private final Set<String> enabledTypes = new HashSet<>();

    public CastRestLogSettings(List<CastRestLogSetting> settings) {
        for (CastRestLogSetting setting : settings) {
            if ("Y".equals(setting.getUseYn())) {
                enabledTypes.add(setting.getMsgTypeCd());
            }
        }
    }

    public boolean isEnabled(String msgTypeCd) {
        return enabledTypes.contains(msgTypeCd);
    }
}
