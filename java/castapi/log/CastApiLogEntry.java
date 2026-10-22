package aoms.pm.castapi.log;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CastApiLogEntry {
    private final String castApiTypeCd;
    private final String castLogTypeCd;
    private final String logCn;
}
