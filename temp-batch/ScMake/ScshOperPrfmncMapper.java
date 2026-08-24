package batch;

import java.util.List;

import org.apache.ibatis.annotations.Param;

public interface ScshOperPrfmncMapper {

    List<ScshWtngRawDto> retrieveScshWtngList(@Param("ymd") String ymd);

    void upsertList(@Param("list") List<ScshOperPrfmncDto> list, @Param("regId") String regId,
            @Param("regIp") String regIp);
}
