package aoms.pm.cast.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import aoms.pm.adtoper.dto.AdtOperHrMngDto;
import aoms.pm.adtoper.dto.AdtOperHrMngSearchDto;
import aoms.pm.adtoper.mapper.AdtOperHrMngMapper;
import aoms.pm.cast.dto.DepOperHrRawDto;
import aoms.pm.cast.service.CastOperHrService;

import lombok.RequiredArgsConstructor;

/**
 * @Classname : CastOperHrServiceImpl.java
 * @Description : Cast 실운영 운영시간 ServiceImpl
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 08. 20. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
@Service("castOperHrService")
@RequiredArgsConstructor
@Transactional(rollbackFor = Exception.class)
public class CastOperHrServiceImpl implements CastOperHrService {
	private static final String FCLT_SE_CD_DEP = "D"; // A:입국 / D:출국 / T:환승
	private static final int HM_LENGTH = 4;

	private final AdtOperHrMngMapper adtOperHrMngMapper;

	/*
	 * 운영시간은 출국장 1곳당 최대 3구간까지 갈라진다 (OPER_BGNG_1_HR ~ OPER_END_3_HR).
	 * 2 · 3구간은 대부분 비어 있으므로 채워진 구간만 펼쳐 담는다.
	 */
	@Override
	public Map<String, List<DepOperHrRawDto>> retrieveDepOperHrMap(String fcltTmnlId, String ymd) {
		AdtOperHrMngSearchDto searchDto = new AdtOperHrMngSearchDto();
		searchDto.setTmnlSeCd(fcltTmnlId);
		searchDto.setFcltSeCd(FCLT_SE_CD_DEP);
		searchDto.setCrtrYmd(ymd);

		Map<String, List<DepOperHrRawDto>> result = new LinkedHashMap<>();

		for (AdtOperHrMngDto raw : adtOperHrMngMapper.retrieveOperHr(searchDto)) {
			String dptgtNo = toDptgtNo(raw.getFcltyTypeId());

			if (dptgtNo.isEmpty()) {
				continue;
			}

			List<DepOperHrRawDto> operHrList = result.computeIfAbsent(dptgtNo, key -> new ArrayList<>());

			addOperHr(operHrList, dptgtNo, raw.getOperBgng1Hr(), raw.getOperEnd1Hr());
			addOperHr(operHrList, dptgtNo, raw.getOperBgng2Hr(), raw.getOperEnd2Hr());
			addOperHr(operHrList, dptgtNo, raw.getOperBgng3Hr(), raw.getOperEnd3Hr());
		}

		return result;
	}

	/*
	 * FCLTY_TYPE_ID 는 VARCHAR2(4) 인데 실제 값은 출국장 한 자리 번호다. 공백이 섞여 들어오면
	 * TN_PM_SMLT_PSG_FCLT 쪽 키(SUBSTR(PSG_FCLT_CD, 4, 1))와 어긋나 전 출국장이 조용히 빈 값이 된다.
	 */
	private String toDptgtNo(String fcltyTypeId) {
		return fcltyTypeId != null ? fcltyTypeId.trim() : "";
	}

	private void addOperHr(List<DepOperHrRawDto> operHrList, String dptgtNo, String bgnHm, String endHm) {
		String bgn = toHm(bgnHm);
		String end = toHm(endHm);

		if (bgn.isEmpty() || end.isEmpty()) {
			return;
		}

		DepOperHrRawDto operHr = new DepOperHrRawDto();
		operHr.setDptgtNo(dptgtNo);
		operHr.setBgnHm(bgn);
		operHr.setEndHm(end);

		operHrList.add(operHr);
	}

	private String toHm(String hhmm) {
		String value = hhmm != null ? hhmm.trim() : "";
		return value.length() == HM_LENGTH ? value : "";
	}
}
