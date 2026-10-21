package aoms.pm.castrest.log;

public class CastRestLogEntry {
    private final String clId;
    private final String apiTypeCd;
    private final String msgTypeCd;
    private final String logCn;

    public CastRestLogEntry(String clId, String apiTypeCd, String msgTypeCd, String logCn) {
        this.clId = clId;
        this.apiTypeCd = apiTypeCd;
        this.msgTypeCd = msgTypeCd;
        this.logCn = logCn;
    }

    public String getClId() {
        return clId;
    }

    public String getApiTypeCd() {
        return apiTypeCd;
    }

    public String getMsgTypeCd() {
        return msgTypeCd;
    }

    public String getLogCn() {
        return logCn;
    }
}
