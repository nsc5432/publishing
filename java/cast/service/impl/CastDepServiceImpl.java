package aoms.pm.cast.service.impl;

import static java.util.stream.Collectors.toList;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.framework.cmmn.service.SessionService;
import aoms.pm.cast.config.ConditionalOnCastDb;
import aoms.pm.cast.dto.DepFcltRawDto;
import aoms.pm.cast.dto.DepGateDto;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.dto.JsonResponse;
import aoms.pm.cast.dto.OprTimeDto;
import aoms.pm.cast.dto.ScCntRawDto;
import aoms.pm.cast.dto.ScPlanDto;
import aoms.pm.cast.dto.SmltKpiDto;
import aoms.pm.cast.dto.SmltStngDto;
import aoms.pm.cast.dto.UserDepOperHrRawDto;
import aoms.pm.cast.dto.UserScPlanRawDto;
import aoms.pm.cast.dto.UserSmltDepDto;
import aoms.pm.cast.dto.UserSmltDepSaveDto;
import aoms.pm.cast.dto.UserSmltDepSearchDto;
import aoms.pm.cast.dto.WaitPsgDto;
import aoms.pm.cast.enums.TerminalKind;
import aoms.pm.cast.mapper.CastDepMapper;
import aoms.pm.cast.service.CastDepService;
import aoms.pm.cast.service.CastSmltService;
import aoms.pm.utils.SessionUtils;
import aoms.pm.utils.TimeBucketUtils;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastDepServiceImpl.java
 * @Description : 출국장 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 03. 12. / 노세찬 / 최초작성
 * 2026. 08. 11. / 노세찬 / 사용자 저장분을 재조회에 반영, 시간대별 검색대 대수를 운영계획에서 읽도록 수정
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service
@ConditionalOnCastDb
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastDepServiceImpl implements CastDepService {
	private static final List<String> UP_PSG_FCLT_CD_LIST = List.of("LGT"); // 출국장
	private static final String OPR_YN_Y = "Y";
	private static final String OPR_YN_N = "N";
	private static final String DEFAULT_HM = "0000";
	private static final String ZERO_MIN = "00";
	private static final int HOUR_PER_DAY = 24;
	private static final int PERCENT = 100;
	private static final int FIRST_PLAN_SN = 1;

	private final CastSmltService castSmltService;
	private final CastDepMapper castDepMapper;
	private final SessionService sessionService;

	@Override
	public UserSmltDepDto retrieveDepInfo(UserSmltDepSearchDto searchDto) {
		UserSmltDepDto result = new UserSmltDepDto();
		TerminalKind tmnlId = searchDto.getTmnlId();
		String fcltTmnlId = tmnlId.getFcltTmnlId();

		List<DepGateDto> depList = getGateList(searchDto.getSmltId(), fcltTmnlId);
		List<Integer> oprScCntList = getOprScCntList(depList);
		List<WaitPsgDto> waitList = castSmltService.retrieveWaitPsgList(searchDto.getSmltId(), fcltTmnlId, UP_PSG_FCLT_CD_LIST);

		SmltKpiDto kpi = castSmltService.retrieveSmltKpi(searchDto.getSmltId(), fcltTmnlId, UP_PSG_FCLT_CD_LIST);
		kpi.setUtilRate(getUtilRate(depList));

		result.setTmnlId(tmnlId.getValue());
		result.setPeakScCnt(oprScCntList.stream().mapToInt(Integer::intValue).max().orElse(0));
		result.setWaitMaxCnt(waitList.stream().mapToInt(WaitPsgDto::getWaitPsgCnt).max().orElse(0));
		result.setDepList(depList);
		result.setWaitList(waitList);
		result.setKpi(kpi);

		return result;
	}

	/*
	 * 저장 전략 — 전체 교체(delete-then-insert).
	 */
	@Override
	public JsonResponse saveDepInfo(UserSmltDepSaveDto saveDto) {
		SessionUtils.setUserContext(saveDto, sessionService);

		JsonResponse invalid = validate(saveDto);

		if (invalid != null) {
			return invalid;
		}

		saveDto.setFcltTmnlId(saveDto.getTmnlId().getFcltTmnlId());
		saveDto.setDepList(normalizeDepList(saveDto.getDepList()));

		// 자식부터 지운다
		castDepMapper.deleteUserScPlanList(saveDto);
		castDepMapper.deleteUserDepOperHrList(saveDto);
		castDepMapper.deleteUserDepList(saveDto);

		if (saveDto.getDepList().isEmpty()) {
			return new JsonResponse();
		}

		castDepMapper.insertUserDepList(saveDto);

		// INSERT ALL 은 INTO 절이 0개면 문법 오류다. 비어 있으면 호출하지 않는다
		if (saveDto.getDepList().stream().anyMatch(x -> !x.getOprTimeList().isEmpty())) {
			castDepMapper.insertUserDepOperHrList(saveDto);
		}

		if (saveDto.getDepList().stream().anyMatch(x -> !x.getPlanList().isEmpty())) {
			castDepMapper.insertUserScPlanList(saveDto);
		}

		return new JsonResponse();
	}

	// 검증은 서비스 안에서 명시적으로 한다. 통과하면 null
	private JsonResponse validate(UserSmltDepSaveDto saveDto) {
		if (saveDto.getLoginUserId() == null) {
			return new JsonResponse().error("로그인을 진행해주세요.");
		}

		if (saveDto.getSmltId() == null || saveDto.getSmltId().isEmpty() || saveDto.getTmnlId() == null) {
			return new JsonResponse().error("저장 대상 시뮬레이션이 지정되지 않았습니다.");
		}

		return null;
	}

	// null 을 그대로 바인딩하면 Oracle 이 JdbcType 을 못 정한다. 빈 목록·기본값으로 채워 넘긴다
	private List<DepGateDto> normalizeDepList(List<DepGateDto> depList) {
		if (depList == null) {
			return new ArrayList<>();
		}

		List<DepGateDto> result = depList.stream()
				.filter(x -> x.getDepNum() != null && !x.getDepNum().isEmpty())
				.collect(toList());

		for (DepGateDto dep : result) {
			dep.setOprYn(OPR_YN_Y.equals(dep.getOprYn()) ? OPR_YN_Y : OPR_YN_N);
			dep.setOprTimeList(dep.getOprTimeList() != null ? dep.getOprTimeList() : new ArrayList<>());
			dep.setPlanList(dep.getPlanList() != null ? dep.getPlanList() : new ArrayList<>());
		}

		return result;
	}

	/*
	 * 화면 초기값은 기준 데이터 위에 사용자 저장분을 덮어쓴 결과다.
	 * 마스터 목록(TN_PM_SMLT_PSG_FCLT)이 줄 순서와 시설명을 정하고, 저장분이 있는 출국장만
	 * 운영여부 · 운영시간 · 검색대 구성 · 운영계획을 저장값으로 바꾼다.
	 * 마스터에 없는 출국장(화면에서 새로 만든 것)은 뒤에 이어 붙인다.
	 */
	private List<DepGateDto> getGateList(String smltId, String fcltTmnlId) {
		List<DepGateDto> baseList = getBaseGateList(smltId, fcltTmnlId);
		Map<String, DepGateDto> savedMap = getSavedGateMap(smltId, fcltTmnlId);

		if (savedMap.isEmpty()) {
			return baseList;
		}

		List<DepGateDto> result = new ArrayList<>();

		for (DepGateDto base : baseList) {
			DepGateDto saved = savedMap.remove(base.getDepNum());

			if (saved == null) {
				result.add(base);
				continue;
			}

			// 시설명은 사용자 테이블에 없다 — 마스터 값을 그대로 물려준다
			saved.setDepNm(base.getDepNm());
			result.add(saved);
		}

		result.addAll(savedMap.values());

		return result;
	}

	private List<DepGateDto> getBaseGateList(String smltId, String fcltTmnlId) {
		SmltStngDto smltStng = castSmltService.retrieveSmltStngByKey(smltId);

		List<DepFcltRawDto> fcltList = castDepMapper.retrieveDepFcltList(fcltTmnlId);
		Map<String, List<DepOperHrRawDto>> operHrMap = castDepMapper
				.retrieveDepOperHrList(fcltTmnlId, smltStng.getFcltyOpngTblDgRsrcId(), smltStng.getExcnYmd())
				.stream().collect(Collectors.groupingBy(DepOperHrRawDto::getDepNum));
		Map<String, Integer> scCntMap = castDepMapper
				.retrieveScCntList(fcltTmnlId, smltStng.getFcltyOpngTblScrtyCntrlRsrcId())
				.stream().collect(Collectors.toMap(ScCntRawDto::getDepNum, ScCntRawDto::getScCnt, (first, ignored) -> first));

		return getGateDatas(fcltList, operHrMap, scCntMap);
	}

	// 저장분 재조회 — 부모 1건에 자식 2종을 출국장 번호로 붙인다. 키 순서는 DEP_NUM 오름차순이다
	private Map<String, DepGateDto> getSavedGateMap(String smltId, String fcltTmnlId) {
		Map<String, DepGateDto> result = new LinkedHashMap<>();
		List<DepGateDto> savedList = castDepMapper.retrieveUserDepList(smltId, fcltTmnlId);

		if (savedList.isEmpty()) {
			return result;
		}

		Map<String, List<UserDepOperHrRawDto>> operHrMap = castDepMapper.retrieveUserDepOperHrList(smltId, fcltTmnlId)
				.stream().collect(Collectors.groupingBy(UserDepOperHrRawDto::getDepNum));
		Map<String, List<UserScPlanRawDto>> planMap = castDepMapper.retrieveUserScPlanList(smltId, fcltTmnlId)
				.stream().collect(Collectors.groupingBy(UserScPlanRawDto::getDepNum));

		for (DepGateDto saved : savedList) {
			saved.setDepNm(saved.getDepNum());
			saved.setOprTimeList(operHrMap.getOrDefault(saved.getDepNum(), new ArrayList<>()).stream()
					.map(x -> new OprTimeDto().withBgnHour(x.getBgnHour()).withEndHour(x.getEndHour()))
					.collect(toList()));
			saved.setPlanList(planMap.getOrDefault(saved.getDepNum(), new ArrayList<>()).stream()
					.map(x -> new ScPlanDto()
							.withPlanSn(x.getPlanSn())
							.withBgnHour(x.getBgnHour())
							.withEndHour(x.getEndHour())
							.withScCnt(x.getScCnt()))
					.collect(toList()));

			result.put(saved.getDepNum(), saved);
		}

		return result;
	}

	private List<DepGateDto> getGateDatas(
			List<DepFcltRawDto> fcltList,
			Map<String, List<DepOperHrRawDto>> operHrMap,
			Map<String, Integer> scCntMap
	) {
		List<DepGateDto> result = new ArrayList<>();

		for (DepFcltRawDto fclt : fcltList) {
			String depNum = fclt.getDepNum();
			List<OprTimeDto> oprTimeList = toOprTimeList(operHrMap.getOrDefault(depNum, new ArrayList<>()));
			int scCnt = scCntMap.getOrDefault(depNum, 0);

			DepGateDto item = new DepGateDto();
			item.setDepNum(depNum);
			item.setDepNm(fclt.getDepNm());
			item.setOprYn(fclt.getUseYn());
			item.setScCnt(scCnt);
			// 일반/스마트패스 구분 컬럼이 없다 — 4단계에서 컬럼 신설 후 채운다
			item.setNormalCnt(0);
			item.setSmartPassCnt(0);
			item.setOprTimeList(oprTimeList);
			item.setPlanList(toPlanList(oprTimeList, scCnt));

			result.add(item);
		}

		return result;
	}

	private List<OprTimeDto> toOprTimeList(List<DepOperHrRawDto> operHrList) {
		return operHrList.stream()
				.map(x -> new OprTimeDto().withBgnHour(toBgnHour(x.getBgnHm())).withEndHour(toEndHour(x.getBgnHm(), x.getEndHm())))
				.sorted((a, b) -> a.getBgnHour() - b.getBgnHour())
				.collect(toList());
	}

	/*
	 * 기준 데이터의 검색대 대수는 시간축이 없는 단일 값이라, 저장 이력이 없을 때의 초기값은
	 * 운영시간 전체를 덮는 구간 1개다 (G7). 시간대별로 갈라지는 것은 사용자가 격자에서
	 * 편집해 저장한 뒤부터이며 그때는 TN_PM_SMLT_SC_PLAN 을 읽는다.
	 */
	private List<ScPlanDto> toPlanList(List<OprTimeDto> oprTimeList, int scCnt) {
		List<ScPlanDto> result = new ArrayList<>();

		if (oprTimeList.isEmpty()) {
			return result;
		}

		int bgnHour = oprTimeList.stream().mapToInt(OprTimeDto::getBgnHour).min().orElse(0);
		int endHour = oprTimeList.stream().mapToInt(OprTimeDto::getEndHour).max().orElse(0);

		result.add(new ScPlanDto().withPlanSn(FIRST_PLAN_SN).withScCnt(scCnt).withBgnHour(bgnHour).withEndHour(endHour));

		return result;
	}

	private int toBgnHour(String hhmm) {
		return Integer.parseInt(defaultHm(hhmm).substring(0, 2));
	}

	// 종료 시각은 분이 남으면 다음 시로 올린다. 자정 넘김(RON)은 당일 24시로 자른다
	private int toEndHour(String bgnHm, String endHm) {
		String value = defaultHm(endHm);
		int hour = Integer.parseInt(value.substring(0, 2));

		if (!ZERO_MIN.equals(value.substring(2, 4))) {
			hour++;
		}

		return hour <= toBgnHour(bgnHm) ? HOUR_PER_DAY : hour;
	}

	private String defaultHm(String hhmm) {
		return hhmm != null && hhmm.length() >= 4 ? hhmm : DEFAULT_HM;
	}

	/*
	 * 시간대별 검색대 대수 — 그 시간의 운영계획 구간 값을 쓴다.
	 * scCnt(피크 고정값)를 시간마다 그대로 더하면 시간대별 조정이 요약에 전혀 반영되지 않는다.
	 * 화면 격자(ScGrid)의 합계 줄과 같은 계산이어야 두 숫자가 어긋나지 않는다.
	 */
	private List<Integer> getOprScCntList(List<DepGateDto> depList) {
		List<Integer> result = new ArrayList<>();

		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			result.add(depList.stream().filter(x -> isOpr(x, hourValue)).mapToInt(x -> getScCnt(x, hourValue)).sum());
		}

		return result;
	}

	// 운영시간 안인데 운영계획이 없는 시간은 0 대다 — 화면은 이것을 붉은 0 으로 그린다
	private int getScCnt(DepGateDto gate, int hour) {
		return gate.getPlanList().stream()
				.filter(x -> x.getBgnHour() <= hour && hour < x.getEndHour())
				.mapToInt(ScPlanDto::getScCnt)
				.findFirst()
				.orElse(0);
	}

	private boolean isOpr(DepGateDto gate, int hour) {
		return OPR_YN_Y.equals(gate.getOprYn())
				&& gate.getOprTimeList().stream().anyMatch(x -> x.getBgnHour() <= hour && hour < x.getEndHour());
	}

	// 가동률 = 운영 출국장·시간 합 / (전체 출국장 수 × 24시간)
	private int getUtilRate(List<DepGateDto> depList) {
		if (depList.isEmpty()) {
			return 0;
		}

		int oprGateHour = 0;

		for (String hour : TimeBucketUtils.hourList()) {
			int hourValue = Integer.parseInt(hour);
			oprGateHour += (int) depList.stream().filter(x -> isOpr(x, hourValue)).count();
		}

		return oprGateHour * PERCENT / (depList.size() * HOUR_PER_DAY);
	}
}