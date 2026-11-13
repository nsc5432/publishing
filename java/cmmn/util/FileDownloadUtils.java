package aoms.pm.cmmn.util;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import javax.servlet.ServletOutputStream;
import javax.servlet.http.HttpServletResponse;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;

import aoms.framework.cmmn.exception.AomsBizException;

/**
 * @Classname : FileDownloadUtils.java
 * @Description : 서버 생성 파일 다운로드 Util
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2026. 11. 13. / 노세찬 / 최초작성
 * -----------------------------------------------------------------------------------
 *
 * </pre>
 */
public final class FileDownloadUtils {

	private static final String FILE_IO_ERROR = "FWIO25";
	private static final int BUFFER_SIZE = 2048;

	private FileDownloadUtils() {
	}

	/**
	 * 호출부가 상수로 정한 상대 경로를 기준 디렉터리에 붙여 돌려준다. (Sparrow 웹취약점 관련)
	 * 기준 디렉터리를 벗어나거나 서비스가 만든 파일 경로와 다르면 FWIO25 로 거부한다.
	 *
	 * @Method Name : resolveFile
	 * @param baseDirPath 기준 디렉터리
	 * @param relativePath 기준 디렉터리 아래 상대 경로 (호출부 상수)
	 * @param serverFilePath 서비스가 만든 파일 경로
	 * @param downloadFileName 오류 메시지에 쓸 파일명
	 * @return 검증된 파일 경로
	 **/
	public static Path resolveFile(String baseDirPath, String relativePath, String serverFilePath, String downloadFileName) throws AomsBizException {
		if (baseDirPath == null || serverFilePath == null) {
			throw fileError(downloadFileName);
		}

		Path baseDir = Paths.get(baseDirPath).toAbsolutePath().normalize();
		Path file = baseDir.resolve(relativePath).normalize();
		Path serverFile = Paths.get(serverFilePath).toAbsolutePath().normalize();
		if (!file.startsWith(baseDir) || !file.equals(serverFile)) {
			throw fileError(downloadFileName);
		}
		return file;
	}

	/**
	 * 파일을 첨부파일로 응답에 쓴다.
	 *
	 * @Method Name : write
	 * @param response
	 * @param file resolveFile 로 검증한 파일 경로
	 * @param downloadFileName 내려받을 파일명
	 * @param contentType
	 **/
	public static void write(HttpServletResponse response, Path file, String downloadFileName, String contentType) throws AomsBizException {
		String headerFileName = removeLineBreaks(downloadFileName);

		try (
			InputStream inputStream = Files.newInputStream(file);
			ServletOutputStream outputStream = response.getOutputStream();
		) {
			response.setContentType(contentType);
			response.setHeader(HttpHeaders.CONTENT_DISPOSITION,
				ContentDisposition.builder("attachment").filename(headerFileName, StandardCharsets.UTF_8).build().toString());

			byte[] buffer = new byte[BUFFER_SIZE];
			int bytesRead;
			while ((bytesRead = inputStream.read(buffer, 0, BUFFER_SIZE)) != -1) {
				outputStream.write(buffer, 0, bytesRead);
			}
		} catch (IOException e) {
			throw fileError(headerFileName);
		}
	}

	private static String removeLineBreaks(String value) {
		if (value == null) {
			return "";
		}
		return value.replace("\r", "").replace("\n", "");
	}

	private static AomsBizException fileError(String downloadFileName) {
		return new AomsBizException(FILE_IO_ERROR, new String[] { removeLineBreaks(downloadFileName) });
	}
}
