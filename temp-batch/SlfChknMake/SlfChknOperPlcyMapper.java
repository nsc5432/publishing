package batch;

import org.apache.ibatis.annotations.Param;

public interface SlfChknOperPlcyMapper {

    int countOverlengthIstrId(@Param("ymd") String ymd);

    int insertNew(@Param("ymd") String ymd);

    int deleteStartedMissing(@Param("ymd") String ymd);

    int closeMissing(@Param("ymd") String ymd);

    int reopenObserved(@Param("ymd") String ymd);
}
