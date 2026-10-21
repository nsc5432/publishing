package aoms.pm.castrest.log;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class CastRestLogEntry {
    private final String apiTypeCd;
    private final String msgTypeCd;
    private final String logCn;
}
