package aoms.pm.cast.dto;

import aoms.pm.cast.enums.CongestionStatus;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PsgPrcsGrd {
	private CongestionStatus cgnStatus;
	private int minVl;
	private int maxVl;
}
