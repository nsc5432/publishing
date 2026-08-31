package batch;

import org.apache.ibatis.annotations.Param;

public interface SlfChknOperPlcyMapper {

    int countOverlengthIstrId(@Param("ymd") String ymd);

    int upsert(@Param("ymd") String ymd);

    int deleteMissing(@Param("ymd") String ymd);
}
