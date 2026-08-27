package aoms.pm.cast.domains;

import java.util.function.Supplier;

public class AggBuffer<T extends AggData> {
	private int wtngPsgCnt; // 대기인원
	private int prcsHr; // 처리시간
	private int wtngHr; // 대기시간
	private int count; // 갯수

	private final Supplier<T> factory;

	public AggBuffer(T data, Supplier<T> factory) {
		this.wtngPsgCnt = data.getWtngPsgCnt();
		this.prcsHr = data.getPrcsHr();
		this.wtngHr = data.getWtngHr();
		this.count = 1;
		this.factory = factory;
	}

	public void merge(T data) {
		if (data == null) {
			return;
		}

		if (this.wtngPsgCnt < data.getWtngPsgCnt()) {
			this.wtngPsgCnt = data.getWtngPsgCnt();
		}

		this.prcsHr += data.getPrcsHr();
		this.wtngHr += data.getWtngHr();
		this.count++;
	}

	public T toData(String hhmm) {
		T result = factory.get();
		result.setTime(hhmm);
		result.setWtngPsgCnt(wtngPsgCnt);
		result.setPrcsHr(prcsHr / count);
		result.setWtngHr(wtngHr / count);
		return result;
	}
}
