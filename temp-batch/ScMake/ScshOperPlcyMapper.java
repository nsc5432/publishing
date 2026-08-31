package batch;

import java.util.List;

import org.apache.ibatis.annotations.Param;

public interface ScshOperPlcyMapper {

    List<ScshWtngRawDto> retrieveScshWtngList(@Param("ymd") String ymd);

    void upsertList(@Param("list") List<ScshOperPlcyDto> list, @Param("regId") String regId,
            @Param("regIp") String regIp);
}
