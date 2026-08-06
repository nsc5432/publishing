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
	
	public UserConfigChknDto factory(List<ChknRawDto> chknList) {
		ChknRawDto first = chknList.get(0);
		
		this.alnCd = first.getAlnCd();
		this.counterNum = first.getCounterNum();
		this.timeRanges = SmltUtils.mergeTimeRanges(chknList.stream().map(x -> new TimeRange(x.getStart(), x.getEnd())).collect(toList()));
		
		return this;
	}
}
