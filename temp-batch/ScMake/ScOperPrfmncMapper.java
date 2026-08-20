package batch;

import java.util.List;

import org.apache.ibatis.annotations.Param;

public interface ScOperPrfmncMapper {

    List<ScWtngRawDto> retrieveScWtngList(@Param("ymd") String ymd);

    void upsertList(@Param("list") List<ScOperPrfmncDto> list, @Param("regId") String regId,
            @Param("regIp") String regIp);
}
