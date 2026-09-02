package aoms.pm.cast.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.CastConfigAplyHstryDtlDto;
import aoms.pm.cast.dto.CastConfigAplyHstryDto;
import aoms.pm.cast.dto.CastConfigAtrbRawDto;
import aoms.pm.cast.dto.CastConfigCategoryDto;
import aoms.pm.cast.dto.CastConfigCategorySaveDto;

@Mapper
public interface CastConfigMapper {
	List<CastConfigCategoryDto> retrieveCategoryList(
			@Param("baseFixAtrbGroupId") String baseFixAtrbGroupId,
			@Param("prePrcsFixAtrbGroupId") String prePrcsFixAtrbGroupId
	);

	CastConfigCategoryDto retrieveCategoryForUpdate(@Param("fixAtrbGroupId") String fixAtrbGroupId);

	int retrieveCategoryCnt(@Param("fixAtrbGroupId") String fixAtrbGroupId);

	int insertCategory(CastConfigCategorySaveDto saveDto);

	List<CastConfigAtrbRawDto> retrievePsgAtrbList(
			@Param("tableNm") String tableNm,
			@Param("fixAtrbGroupId") String fixAtrbGroupId,
			@Param("tmnlId") String tmnlId,
			@Param("rootCdList") List<String> rootCdList
	);

	List<CastConfigAtrbRawDto> retrieveSrvcAtrbList(
			@Param("fixAtrbGroupId") String fixAtrbGroupId,
			@Param("fcltySeCdList") List<String> fcltySeCdList
	);

	List<CastConfigAtrbRawDto> retrieveCknctTypeAtrbList(@Param("fixAtrbGroupId") String fixAtrbGroupId);

	/** value 는 대상 컬럼 타입에 맞춰 String 또는 BigDecimal 로 넘긴다. */
	int updateAtrbValue(
			@Param("tableNm") String tableNm,
			@Param("columnNm") String columnNm,
			@Param("value") Object value,
			@Param("groupColumnNm") String groupColumnNm,
			@Param("fixAtrbGroupId") String fixAtrbGroupId,
			@Param("keyCd") String keyCd,
			@Param("dtlSeCd") String dtlSeCd,
			@Param("keyColumnNm") String keyColumnNm,
			@Param("dtlColumnNm") String dtlColumnNm,
			@Param("loginUserId") String loginUserId,
			@Param("loginIpAddr") String loginIpAddr
	);

	int copyFromGroup(
			@Param("tableNm") String tableNm,
			@Param("valueColumnList") List<String> valueColumnList,
			@Param("groupColumnNm") String groupColumnNm,
			@Param("srcFixAtrbGroupId") String srcFixAtrbGroupId,
			@Param("fixAtrbGroupId") String fixAtrbGroupId,
			@Param("keyCd") String keyCd,
			@Param("dtlSeCd") String dtlSeCd,
			@Param("keyColumnNm") String keyColumnNm,
			@Param("dtlColumnNm") String dtlColumnNm,
			@Param("loginUserId") String loginUserId,
			@Param("loginIpAddr") String loginIpAddr
	);

	int insertFromBaseGroup(
			@Param("tableNm") String tableNm,
			@Param("valueColumnList") List<String> valueColumnList,
			@Param("groupColumnNm") String groupColumnNm,
			@Param("fixAtrbGroupId") String fixAtrbGroupId,
			@Param("keyColumnNm") String keyColumnNm,
			@Param("dtlColumnNm") String dtlColumnNm,
			@Param("loginUserId") String loginUserId,
			@Param("loginIpAddr") String loginIpAddr
	);

	long retrieveAplyHstrySn();

	int insertAplyHstry(CastConfigAplyHstryDto hstryDto);

	int insertAplyHstryDtl(
			@Param("aplySn") long aplySn,
			@Param("tableNm") String tableNm,
			@Param("valueColumnList") List<String> valueColumnList,
			@Param("groupColumnNm") String groupColumnNm,
			@Param("srcFixAtrbGroupId") String srcFixAtrbGroupId,
			@Param("tgtFixAtrbGroupId") String tgtFixAtrbGroupId,
			@Param("keyCd") String keyCd,
			@Param("dtlSeCd") String dtlSeCd,
			@Param("keyColumnNm") String keyColumnNm,
			@Param("dtlColumnNm") String dtlColumnNm
	);

	List<CastConfigAplyHstryDto> retrieveAplyHstryList(
			@Param("tgtFixAtrbGroupId") String tgtFixAtrbGroupId,
			@Param("tmnlId") String tmnlId,
			@Param("sheetNm") String sheetNm
	);

	CastConfigAplyHstryDto retrieveAplyHstry(@Param("aplySn") long aplySn);

	List<CastConfigAplyHstryDtlDto> retrieveAplyHstryDtlList(@Param("aplySn") long aplySn);

	int updateAplyHstryCancel(
			@Param("aplySn") long aplySn,
			@Param("loginUserId") String loginUserId
	);
}
