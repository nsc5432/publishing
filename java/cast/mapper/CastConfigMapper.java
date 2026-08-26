package aoms.pm.cast.mapper;

import java.math.BigDecimal;
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.egovframe.rte.psl.dataaccess.mapper.Mapper;

import aoms.pm.cast.dto.CastConfigAtrbRawDto;
import aoms.pm.cast.dto.CastConfigCategoryDto;
import aoms.pm.cast.dto.CastConfigCategorySaveDto;

@Mapper
public interface CastConfigMapper {
	List<CastConfigCategoryDto> retrieveCategoryList();

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

	int updateAtrbTextValue(
			@Param("tableNm") String tableNm,
			@Param("columnNm") String columnNm,
			@Param("value") String value,
			@Param("fixAtrbGroupId") String fixAtrbGroupId,
			@Param("keyCd") String keyCd,
			@Param("dtlSeCd") String dtlSeCd,
			@Param("keyColumnNm") String keyColumnNm,
			@Param("dtlColumnNm") String dtlColumnNm,
			@Param("loginUserId") String loginUserId,
			@Param("loginIpAddr") String loginIpAddr
	);

	int updateAtrbNumberValue(
			@Param("tableNm") String tableNm,
			@Param("columnNm") String columnNm,
			@Param("value") BigDecimal value,
			@Param("fixAtrbGroupId") String fixAtrbGroupId,
			@Param("keyCd") String keyCd,
			@Param("dtlSeCd") String dtlSeCd,
			@Param("keyColumnNm") String keyColumnNm,
			@Param("dtlColumnNm") String dtlColumnNm,
			@Param("loginUserId") String loginUserId,
			@Param("loginIpAddr") String loginIpAddr
	);

	int copyFromBaseGroup(
			@Param("tableNm") String tableNm,
			@Param("valueColumnList") List<String> valueColumnList,
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
			@Param("fixAtrbGroupId") String fixAtrbGroupId,
			@Param("keyColumnNm") String keyColumnNm,
			@Param("dtlColumnNm") String dtlColumnNm,
			@Param("loginUserId") String loginUserId,
			@Param("loginIpAddr") String loginIpAddr
	);
}
