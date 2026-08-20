package batch;

import java.util.List;

import org.apache.ibatis.annotations.Param;

public interface PsgDptcnyTrnsPrfmncMapper {
    void upsertList(@Param("list") List<PsgDptcnyTrnsPrfmncDto> list, @Param("regId") String regId,
            @Param("regIp") String regIp);
}
