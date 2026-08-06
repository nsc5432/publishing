package aoms.pm.cast.dto;

import java.util.List;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SmltSmryDto extends JsonResponse {
	private static final long serialVersionUID = 1L;
	
	private String smltId;
	private String ymd;
	private String peakTimeT1;
	private String peakTimeT2;
	
	private transient SummaryFlightDto summaryFlight;
	private List<SummaryRsltDto> xovisT1Datas;
	private List<SummaryRsltDto> xovisT2Datas;
	private List<SummaryRsltDto> castT1Datas;
	private List<SummaryRsltDto> castT2Datas;
	
	private List<SmryChknDto> chknT1Datas;
	private List<SmryChknDto> chknT2Datas;
	private List<SmryDepDto> depT1Datas;
	private List<SmryDepDto> depT2Datas;
}
