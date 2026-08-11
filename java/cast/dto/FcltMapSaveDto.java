package aoms.pm.cast.dto;

import java.util.List;

import aoms.framework.cmmn.dto.AomsDefaultDto;
import aoms.pm.cast.enums.TerminalKind;

import lombok.Getter;
import lombok.Setter;

/**
 * 시설물 매핑 저장 요청.
 * 화면이 바꾼 시설만 모아 한 번에 보낸다 — 한 칸 고칠 때마다 부르지 않는다.
 */
@Getter
@Setter
public class FcltMapSaveDto extends AomsDefaultDto {
	private static final long serialVersionUID = 1L;

	private TerminalKind tmnlId; // T1 / T2 — 터미널 코드 변환은 TerminalKind 안에서만 한다
	private String fcltTmnlId; // TerminalKind 가 변환한 DB 터미널 코드 (P01/P03). 서비스가 채운다
	private List<FcltMapSaveItemDto> itemList;
}
