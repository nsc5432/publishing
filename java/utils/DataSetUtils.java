package aoms.pm.utils;

import java.util.ArrayList;
import java.util.List;

import aoms.framework.nexacro.dto.DataSetObject;

public class DataSetUtils {
	private DataSetUtils() {
		throw new UnsupportedOperationException("DataSetUtils Class is Utility class.");
	}

	public static <T> List<T> getList(DataSetObject dsObj) {
		List<T> result = new ArrayList<>();

		if (dsObj == null) {
			return result;
		}

		for (int index = 0; index < dsObj.size(); index++) {
			@SuppressWarnings("unchecked") // 클라이언트에서 제네릭을 명시하기에 문제없음
			T item = (T) dsObj.get(index);
			result.add(item);
		}

		return result;
	}
}
