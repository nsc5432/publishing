package aoms.pm.cast.dto;

import static java.util.stream.Collectors.toList;

import java.util.List;

import aoms.pm.utils.SmltUtils;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserConfigChknDto {
	private String alnCd;
	private int counterNum;
	private List<TimeRange> timeRanges;

	// 같은 카운터의 배정 구간 여러 건을 1건으로 접는다 (항공사·번호는 어느 행이나 같다)
	public UserConfigChknDto factory(List<ChknRawDto> chknList) {
		ChknRawDto first = chknList.get(0);

		this.alnCd = first.getAlnCd();
		this.counterNum = first.getCounterNum();
		this.timeRanges = SmltUtils.mergeTimeRanges(chknList.stream()
				.map(chkn -> new TimeRange(chkn.getStart(), chkn.getEnd()))
				.collect(toList()));

		return this;
	}
}
