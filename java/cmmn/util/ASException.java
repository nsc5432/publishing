package aoms.pm.cmmn.util;

/**
 * Created by YOO JIN-HYUNG on 2015-08-05.
 */
public final class ASException extends RuntimeException {
    public static final int ERR0R_DUPLICATE = 0;

    public static final String ERROR_DUPLICATE_MSG_ID = "FWIN09";

    private final int errorCode;

    private final String errorMsgId;

    public ASException(int errorCode) {
        this.errorCode = errorCode;
        if (errorCode == ERR0R_DUPLICATE) {
        	this.errorMsgId = ERROR_DUPLICATE_MSG_ID;
        } else {
        	this.errorMsgId = "";
        }
    }

    public int getErrorCode() {
        return errorCode;
    }

    public String getErrorMsgId() {
        return errorMsgId;
    }
}