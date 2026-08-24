package aoms.pm.utils;

import java.util.ArrayList;
import java.util.List;

import aoms.framework.nexacro.dto.DataSetObject;

public class DataSetUtils {
	private DataSetUtils() {
		throw new UnsupportedOperationException("DataSetUtils Class is Utility class.");
	}

	public static <T> List<T>  getList(DataSetObject dsObj) {
		List<T> res = new ArrayList<>();
		
		if (dsObj != null) {
			for (int i = 0; i < dsObj.size(); i++) {
				@SuppressWarnings("unchecked") // 클라이언트에서 제네릭을 명시하기에 문제없음
				T item = (T) dsObj.get(i);
				res.add(item);
			}
		}
		
		return res;
	}
}
