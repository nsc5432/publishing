package aoms.pm.utils;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

public class ResponseUtils {
	private ResponseUtils() {
		throw new UnsupportedOperationException("ResponseUtils Class is Utility class.");
	}
	
	public static <T> ResponseEntity<T> res(T body) {
		return ResponseEntity.status(HttpStatus.OK).body(body);
	}
}
