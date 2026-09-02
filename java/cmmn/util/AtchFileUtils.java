package aoms.pm.cmmn.util;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.fileupload.FileItem;
import org.apache.commons.fileupload.FileUploadException;
import org.apache.commons.fileupload.disk.DiskFileItemFactory;
import org.apache.commons.fileupload.servlet.ServletFileUpload;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import aoms.framework.cmmn.config.CoreYamlRead;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * @Classname : AtchFileUtil.java
 * @Description : 첨부파일 Util
 *
 * @Copyright (c) 인천국제공항 통합정보시스템 아시아나IDT 컨소시엄 All right reserved.
 * <pre>
 * -----------------------------------------------------------------------------------
 * Modification Information
 * -----------------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2024. 9. 30. / AA / 최초작성 
 * -----------------------------------------------------------------------------------
 * 
 * </pre> 
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class AtchFileUtils {
	
	List<FileItem> items;
	
	@Value("${airport.interface.url}")
	private String server;

	/**
	 * multipart 가 null 인지 여부 확인
	 * 해당 첨부파일을 추출하여 리턴함.
	 *
	 * @Method Name : checkItemEMpty
	 * @param request
	 * @return
	 **/
	public List<FileItem> checkItemEMpty(HttpServletRequest request) {
		boolean isMultipart = ServletFileUpload.isMultipartContent(request);
		
		if (isMultipart) {
			
			//temp 디렉토리가 없는 경우 생성 함
			try {
				makeFolder(CoreYamlRead.getTemporaryPath());
			} catch (IOException e) {
				log.error("#{} >>> FileIOException", getClass().getName(), e);
			}
			
			File temporaryPathFile = new File(CoreYamlRead.getTemporaryPath());
			DiskFileItemFactory factory = new DiskFileItemFactory();
			factory.setSizeThreshold(CoreYamlRead.getThroadholeSize());
			factory.setRepository(temporaryPathFile);
			ServletFileUpload upload = new ServletFileUpload(factory);
			
			try {
				items = upload.parseRequest(request);
			} catch (FileUploadException e) {
				log.error("#{} >>> FileUploadException", getClass().getName(), e);
			}
		}
		
		return items;
	}
	
	/**
	 * 파일경로 체크
	 * 
	 * tmp = tmp.replaceAll(&quot;/&quot;, &quot;&quot;);
	 * tmp = tmp.replaceAll(&quot;\\&quot;, &quot;&quot;);
	 * tmp = tmp.replaceAll(&quot;.&quot;, &quot;&quot;);
	 * tmp = tmp.replaceAll(&quot;&amp;&quot;, &quot;&quot;);
	 *
	 * @Method Name : restrictDir
	 * @param instr
	 * @return
	 **/
	public String restrictDir(String instr) {
		String tmp = instr;
		
		if (tmp != null) {
			tmp = tmp.replace("/", "");
			tmp = tmp.replace("\\", "");
			tmp = tmp.replace(".", "");
			tmp = tmp.replace("&", "");
		}
		
		return tmp;

	}
	
	/**
	 * 폴더 생성
	 *
	 * @Method Name : makeFolder
	 * @param path
	 * @throws IOException
	 **/
	public void makeFolder(String path) throws IOException {

		File file = new File(path);

		if (!file.isDirectory()) {
			boolean flag = file.mkdir();
			if (!flag) {
				throw new IOException("-1");
			}
		}

	}
	
	/**
	 * 파일명 패튼 체크
	 * 
	 * @Method Name : checkFilePattern
	 * @param fileNm
	 * @return
	 **/
	public boolean checkFilePattern(String fileNm) {

		Pattern p = Pattern.compile("[0-9a-zA-Zㄱ-ㅎㅏ-ㅣ가-힝.()\\-_\\[\\]\\s]*");
		Matcher m = p.matcher(fileNm);

		return m.matches();

	}
}
