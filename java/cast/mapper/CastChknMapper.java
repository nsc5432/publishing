package aoms.pm.cast.mapper;

import java.util.List;
import aoms.pm.cast.dto.UserSmltCurrentDto;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.ChknIslandDto;
import aoms.pm.cast.dto.ChknQueueRawDto;
import aoms.pm.cast.dto.CknctCntRawDto;
import aoms.pm.cast.dto.UserChknBoothRawDto;
import aoms.pm.cast.dto.UserChknOperHrRawDto;
import aoms.pm.cast.dto.UserSmltChknSaveDto;

@Mapper
public interface CastChknMapper {
    List<CknctCntRawDto> retrieveCknctCntList(@Param("tmnlId") String tmnlId, @Param("useCrgTypeCdList") List<String> useCrgTypeCdList);

    List<ChknQueueRawDto> retrieveChknQueueRawList(
            @Param("smltId") String smltId,
            @Param("tmnlId") String tmnlId,
            @Param("upPsgFcltCd") String upPsgFcltCd
    );

    List<String> retrieveAlnCdList(@Param("ymd") String ymd, @Param("tmnlId") String tmnlId);

    List<ChknIslandDto> retrieveUserChknIslandList(UserSmltCurrentDto scope);

    List<UserChknOperHrRawDto> retrieveUserChknOperHrList(UserSmltCurrentDto scope);

    List<UserChknBoothRawDto> retrieveUserChknBoothList(UserSmltCurrentDto scope);

    void deleteUserChknIslandList(UserSmltChknSaveDto saveDto);

    void deleteUserChknOperHrList(UserSmltChknSaveDto saveDto);

    void deleteUserChknBoothList(UserSmltChknSaveDto saveDto);

    void insertUserChknIslandList(UserSmltChknSaveDto saveDto);

    void insertUserChknOperHrList(UserSmltChknSaveDto saveDto);

    void insertUserChknBoothList(UserSmltChknSaveDto saveDto);
}
