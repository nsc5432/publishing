package aoms.pm.cmmn.util;

import java.io.Serializable;
import java.lang.reflect.Field;

import aoms.framework.cmmn.dto.AomsDefaultDto;

/**
 * @Class Name : ASDefaultDto.java
 * @Description : AS 모듈의 dto에서 사용하는 모 dto
 * @Copyright (c) 인천국제공항 통합정보시스템 LG CNS 컨소시엄 All right reserved.
 * ------------------------------------------------------------------------
 * Modification Information
 * ------------------------------------------------------------------------
 * 수정일 / 수정자 / 수정내용
 * 2015. 9. 4. / 유진형 / 초기 작성
 * ------------------------------------------------------------------------
 */
public class ASDefaultDto extends AomsDefaultDto implements Serializable {

    /**
     * 입력받은 객체 필드명과 값을 문자열로 반환한다.
     *
     * @param fields 객체 필드
     * @return 필드명[필드값], ... 문자열
     */
    private StringBuilder getFieldsString(Field[] fields) throws IllegalAccessException {
    	StringBuilder stringBuffer = new StringBuilder();
        for (Field field : fields) {
            Object val = field.get(this);
            stringBuffer.append(field.getName()).append("[");
            stringBuffer.append(val).append("],");
        }
        return stringBuffer;
    }

    /**
     * 현재 객체와  super 객체의 모든 필드명과 값을 문자열로 반환한다.
     *
     * @return 필드명[필드값], ... 문자열
     */
    @Override
    public String toString() {
    	StringBuilder stringBuffer = new StringBuilder();
        Class<?> c = this.getClass();
        Field[] fields = c.getDeclaredFields();
        try {
            stringBuffer.append(getFieldsString(fields));
        } catch (IllegalAccessException e) {
            stringBuffer.append(e.getCause());
        }
        Class<?> s = c.getSuperclass();
        while (s != null) {
            fields = s.getDeclaredFields();
            try {
                stringBuffer.append(getFieldsString(fields));
            } catch (IllegalAccessException e) {
                stringBuffer.append(e.getCause());
            }
            s = s.getSuperclass();
        }
        return stringBuffer.toString();
    }
}
