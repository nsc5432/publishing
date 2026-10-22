package aoms.pm.castapi.log;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CastApiLogEntry {
    private final String apiTypeCd;
    private final String msgTypeCd;
    private final String logCn;
}
