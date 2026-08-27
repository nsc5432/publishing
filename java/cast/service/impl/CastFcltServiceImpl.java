package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.cast.domains.FcltMapLayout;
import aoms.pm.cast.dto.FcltMapItemDto;
import aoms.pm.cast.dto.FcltMapListDto;
import aoms.pm.cast.dto.FcltMapSaveDto;
import aoms.pm.cast.dto.FcltMapSaveItemDto;
import aoms.pm.cast.dto.FcltMapSearchDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.MapMarkerDto;
import aoms.pm.cast.enums.FcltType;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastFcltMapper;
import aoms.pm.cast.service.CastFcltService;
import aoms.pm.utils.StringUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastFcltServiceImpl.java
 * @Description : 시설물 매핑 ServiceImpl — DB 조회 · 저장
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 12. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastFcltServiceImpl implements CastFcltService {
	private static final String EMPTY = "";
	private static final String DPTGT_MARKER_PREFIX = "dg";

	/** 상위여객시설코드 → 화면 시설구분. FcltType 이 이미 가진 대응을 뒤집어 쓴다 */
	private static final Map<String, FcltType> FCLT_TYPE_BY_UP_CD = toFcltTypeByUpCd();

	/** 상위 행이 없어 이름을 못 받은 그룹의 표시명 */
	private static final Map<FcltType, String> FCLT_TYPE_NM = Map.of(
			FcltType.CHKN, "체크인카운터",
			FcltType.SLFCHKN, "셀프체크인/백드롭",
			FcltType.DEP, "출국장",
			FcltType.SC, "보안검색대",
			FcltType.CMRC, "기타시설"
	);

	private final CastFcltMapper castFcltMapper;

	private static Map<String, FcltType> toFcltTypeByUpCd() {
		Map<String, FcltType> result = new HashMap<>();

		for (FcltType fcltType : FcltType.getList()) {
			for (String upPsgFcltCd : fcltType.getUpPsgFcltCdList()) {
				result.put(upPsgFcltCd, fcltType);
			}
		}

		return result;
	}

	@Override
	public FcltMapListDto retrieveFcltMapList(FcltMapSearchDto searchDto) {
		FcltMapListDto result = new FcltMapListDto();

		TerminalKind tmnlId = searchDto.getTmnlId();
		if (tmnlId == null) {
			return (FcltMapListDto) result.error("터미널이 지정되지 않았습니다.");
		}

		result.setTmnlId(tmnlId);

		List<FcltMapItemDto> itemList = castFcltMapper.retrieveFcltMapList(tmnlId.getFcltTmnlId());

		for (FcltMapItemDto item : itemList) {
			fillDerived(item, tmnlId);
		}

		result.setItemList(itemList);
		result.setMarkerList(getMarkerList(tmnlId, itemList));

		return result;
	}

	@Override
	public JsonResponse saveFcltMapList(FcltMapSaveDto saveDto) {
		JsonResponse validationError = validate(saveDto);

		if (validationError != null) {
			return validationError;
		}

		saveDto.setFcltTmnlId(saveDto.getTmnlId().getFcltTmnlId());

		List<FcltMapSaveItemDto> itemList = normalizeItemList(saveDto.getItemList());
		JsonResponse duplicateError = checkDuplicate(itemList);

		if (duplicateError != null) {
			return duplicateError;
		}

		for (FcltMapSaveItemDto item : itemList) {
			castFcltMapper.updateSmltFcltNm(
					item.getPsgFcltCd(),
					// 빈 값은 매핑 해제다. '' 를 그대로 넣으면 Oracle 이 어차피 NULL 로 저장한다
					item.getSmltFcltNm().isEmpty() ? null : item.getSmltFcltNm(),
					saveDto.getFcltTmnlId(),
					saveDto.getLoginUserId(),
					saveDto.getLoginIpAddr()
			);
		}

		return new JsonResponse();
	}

	// SQL 이 NVL 로 채운 공백을 빈 문자열로 되돌리고, 코드에서 알 수 있는 값을 채운다
	private void fillDerived(FcltMapItemDto item, TerminalKind tmnlId) {
		item.setTmnlId(tmnlId);
		item.setUpPsgFcltCd(StringUtils.trimToEmpty(item.getUpPsgFcltCd()));
		item.setPsgFcltNm(StringUtils.trimToEmpty(item.getPsgFcltNm()));
		item.setPsgFcltExpln(StringUtils.trimToEmpty(item.getPsgFcltExpln()));
		item.setSmltFcltNm(StringUtils.trimToEmpty(item.getSmltFcltNm()));
		item.setLastMdfrId(StringUtils.trimToEmpty(item.getLastMdfrId()));
		item.setLastMdfcnDt(StringUtils.trimToEmpty(item.getLastMdfcnDt()));

		FcltType fcltType = FCLT_TYPE_BY_UP_CD.getOrDefault(item.getUpPsgFcltCd(), FcltType.CMRC);
		item.setFcltType(fcltType);

		if (StringUtils.trimToEmpty(item.getUpPsgFcltNm()).isEmpty()) {
			item.setUpPsgFcltNm(FCLT_TYPE_NM.get(fcltType));
		}

		item.setIsland(toMarkerId(fcltType, StringUtils.trimToEmpty(item.getIsland())));
	}

	/**
	 * 시설이 걸리는 도면 마커 id.
	 * 체크인 계열은 아일랜드 문자, 출국장·보안검색대는 출국장 마커(dgN)에 함께 붙는다
	 * (검색대는 출국장 바로 앞이라 도면에서 같은 자리다).
	 */
	private String toMarkerId(FcltType fcltType, String unitCd) {
		if (unitCd.isEmpty()) {
			return EMPTY;
		}

		switch (fcltType) {
			case CHKN:
			case SLFCHKN:
				return unitCd;
			case DEP:
			case SC:
				return DPTGT_MARKER_PREFIX + unitCd;
			default:
				return EMPTY;
		}
	}

	// 목록에 실제로 걸린 구역만 도면에 그린다 — 시설이 하나도 없는 마커는 누를 이유가 없다
	private List<MapMarkerDto> getMarkerList(TerminalKind tmnlId, List<FcltMapItemDto> itemList) {
		Set<String> usedMarkerIdSet = new LinkedHashSet<>();

		for (FcltMapItemDto item : itemList) {
			if (!item.getIsland().isEmpty()) {
				usedMarkerIdSet.add(item.getIsland());
			}
		}

		List<MapMarkerDto> result = new ArrayList<>();

		for (String islandCd : FcltMapLayout.islandCdList(tmnlId)) {
			if (usedMarkerIdSet.contains(islandCd)) {
				result.add(FcltMapLayout.chknMarker(tmnlId, islandCd));
			}
		}

		for (String dptgtNo : FcltMapLayout.dptgtNoList(tmnlId)) {
			if (usedMarkerIdSet.contains(DPTGT_MARKER_PREFIX + dptgtNo)) {
				result.add(FcltMapLayout.dptgtMarker(tmnlId, dptgtNo));
			}
		}

		return result;
	}

	// 통과하면 null
	private JsonResponse validate(FcltMapSaveDto saveDto) {
		if (saveDto.getLoginUserId() == null) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		if (saveDto.getTmnlId() == null) {
			return new JsonResponse().error("터미널이 지정되지 않았습니다.");
		}

		if (saveDto.getItemList() == null || saveDto.getItemList().isEmpty()) {
			return new JsonResponse().error("저장할 변경 내용이 없습니다.");
		}

		for (FcltMapSaveItemDto item : saveDto.getItemList()) {
			if (item.getPsgFcltCd() == null || item.getPsgFcltCd().trim().isEmpty()) {
				return new JsonResponse().error("여객시설코드가 없는 항목이 있습니다.");
			}
		}

		return null;
	}

	/**
	 * 1:1 검사.
	 * 화면도 같은 검사를 하지만 그건 그 사람이 보고 있는 목록 안에서만이다.
	 * 두 사람이 동시에 같은 이름을 넣으면 화면 검사는 둘 다 통과하므로 여기서 한 번 더 막는다.
	 */
	private JsonResponse checkDuplicate(List<FcltMapSaveItemDto> itemList) {
		// 같은 요청 안에서 겹치는 경우 (DB 에는 아직 없으니 조회로는 못 잡는다)
		Set<String> smltFcltNmSet = new LinkedHashSet<>();
		List<FcltMapSaveItemDto> namedList = new ArrayList<>();

		for (FcltMapSaveItemDto item : itemList) {
			if (item.getSmltFcltNm().isEmpty()) {
				continue;
			}

			if (!smltFcltNmSet.add(item.getSmltFcltNm())) {
				return new JsonResponse().error("같은 시뮬레이션시설명을 두 시설에 지정할 수 없습니다 : " + item.getSmltFcltNm());
			}

			namedList.add(item);
		}

		if (namedList.isEmpty()) {
			return null;
		}

		// 다른 시설이 이미 쓰고 있는 경우
		List<String> duplicatedNmList = castFcltMapper.retrieveDuplicateSmltFcltNmList(namedList);

		if (duplicatedNmList != null && !duplicatedNmList.isEmpty()) {
			return new JsonResponse().error(
					"다른 시설이 이미 쓰고 있는 이름입니다 : " + String.join(", ", duplicatedNmList));
		}

		return null;
	}

	// 앞뒤 공백은 매핑을 어긋나게 하는 흔한 원인이라 저장 전에 턴다
	private List<FcltMapSaveItemDto> normalizeItemList(List<FcltMapSaveItemDto> itemList) {
		List<FcltMapSaveItemDto> result = new ArrayList<>();

		for (FcltMapSaveItemDto item : itemList) {
			FcltMapSaveItemDto normalized = new FcltMapSaveItemDto();
			normalized.setPsgFcltCd(item.getPsgFcltCd().trim());
			normalized.setSmltFcltNm(StringUtils.trimToEmpty(item.getSmltFcltNm()));
			result.add(normalized);
		}

		return result;
	}

}
