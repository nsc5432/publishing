package aoms.pm.cast.mapper;

import java.time.LocalDateTime;
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.FcltWtngRsltDto;
import aoms.pm.cast.dto.FcltWtngSrcDto;

@Mapper
public interface CastFcltWtngRsltMapper {
	int insertFcltWtngRsltList(@Param("list") List<FcltWtngRsltDto> list, @Param("loginIpAddr") String loginIpAddr);

	List<FcltWtngRsltDto> retrieveFcltWtngRsltList(
			@Param("smltId") String smltId,
			@Param("smltMdlSn") int smltMdlSn,
			@Param("tmnlId") String tmnlId,
			@Param("fcltTypeCd") String fcltTypeCd
	);

	List<FcltWtngSrcDto> retrieveFcltWtngSrcList(
			@Param("smltId") String smltId,
			@Param("smltMdlSn") int smltMdlSn,
			@Param("tmnlId") String tmnlId,
			@Param("fcltTypeCd") String fcltTypeCd,
			@Param("upPsgFcltCdList") List<String> upPsgFcltCdList,
			@Param("bgnDt") LocalDateTime bgnDt,
			@Param("endDt") LocalDateTime endDt
	);

	int retrieveSrcExcnDtCnt(@Param("smltId") String smltId, @Param("smltMdlSn") int smltMdlSn);
}
