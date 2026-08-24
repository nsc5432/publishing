package aoms.pm.utils;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import kr.dogfoot.hwpxlib.object.HWPXFile;
import kr.dogfoot.hwpxlib.object.common.ObjectList;
import kr.dogfoot.hwpxlib.object.content.header_xml.references.CharPr;
import kr.dogfoot.hwpxlib.object.content.section_xml.SectionXMLFile;
import kr.dogfoot.hwpxlib.object.content.section_xml.SubList;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.Para;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.Run;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.RunItem;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.T;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.TItem;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.object.Picture;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.object.Table;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.object.table.Tc;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.object.table.Tr;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.t.NormalText;
import kr.dogfoot.hwpxlib.writer.HWPXWriter;


public class HwpxUtils {
	/** 템플릿 본문 셀이 사용하는 글자모양 ID. 파란색 글자모양은 이걸 복제해서 만든다. */
	private static final int BASE_CHAR_PR_INDEX = 9;
	private static final String BLUE = "#0000FF";

	private final HWPXFile hwpxFile;
    private final Map<String, String> variables = new HashMap<>();
    /** 치환될 때 파란색으로 표시할 변수 키 (예 "0-1-2-0") */
    private final Set<String> highlightKeys = new HashSet<>();
//    private final CharPr blueText;

    public HwpxUtils(HWPXFile hwpxFile) {
    	this.hwpxFile = hwpxFile;
//    	this.blueText = createBlueCharPr(hwpxFile);
    }

    /**
     * 템플릿의 기본 글자모양을 복제해 파란색 글자모양을 새로 등록한다.
     * ID 는 목록 개수 기준으로 채번하므로 템플릿의 글자모양이 늘어나도 충돌하지 않는다.
     */
    private static CharPr createBlueCharPr(HWPXFile hwpxFile) {
    	ObjectList<CharPr> charProperties = hwpxFile.headerXMLFile().refList().charProperties();
    	int baseIndex = charProperties.count() > BASE_CHAR_PR_INDEX ? BASE_CHAR_PR_INDEX : 0;

    	CharPr blue = charProperties.get(baseIndex).clone();
    	blue.id(String.valueOf(charProperties.count()));
    	blue.textColor(BLUE);
    	charProperties.add(blue);
    	return blue;
    }

    public HwpxUtils set(String key, String value) {
        variables.put(key, value);
        return this;
    }

    public HwpxUtils setAll(Map<String, String> vars) {
        variables.putAll(vars);
        return this;
    }

    /**
     * 파란색으로 표시할 변수 키 목록. {@link #process()} 이전에 지정해야 한다.
     * 지정하지 않으면 글자색은 템플릿 그대로 유지된다.
     */
    public HwpxUtils setHighlightKeys(Set<String> keys) {
    	if (keys != null) {
    		highlightKeys.addAll(keys);
    	}
    	return this;
    }

    public HwpxUtils process() {
        if (hwpxFile == null) {
            throw new IllegalStateException("Load template file first.");
        }
        
        for (SectionXMLFile section : hwpxFile.sectionXMLFileList().items()) {
            processSection(section);
        }
        
        return this;
    }
    
    public HwpxUtils clearEmptyContentByTableCnt(int tableCnt) {
    	for (int i = 1; i <= tableCnt; i++) {
    		Table targetTable = HwpxUtils.findTable(hwpxFile, i);
    		if (targetTable != null) {
    			clearEmptyContent(HwpxUtils.findTable(hwpxFile, i));
    		}
    	}

    	return this;
    }

    private void clearEmptyContent(Table table) {
    	if (table == null) {
    		return;
    	}
    	for (Tr tr : table.trs()) {
    		processRows(tr);
    	}
    }
    
    private void processRows(Tr tr) {
    	for (Tc tc : tr.tcs()) {
    		removeEmptyParasInCell(tc);
    	}
    }
    
    private void removeEmptyParasInCell(Tc tc) {
    	int paraCount = tc.subList().countOfPara();
    	for (int i = paraCount - 1; i >= 0; i--) {
    		Para para = tc.subList().getPara(i);
    		if (isParaEmpth(para)) {
    			tc.subList().removePara(para);
    		}
    	}
    }
    
    private boolean isParaEmpth(Para para) {
    	for (Run run : para.runs()) {
    		for (RunItem item : run.runItems()) {
    			if (item instanceof T) {
    				String text = ((T) item).onlyText();
    				if (!"".equals(text)) {
    					return false;
    				}
    			}
    		}
    	}
    	return true;
    }
    
    public static Table findTable(HWPXFile hwpxFile, int index) {
    	SectionXMLFile section = hwpxFile.sectionXMLFileList().get(0);
		int n = 0;

		for (Para para : section.paras()) {
			for (Run run : para.runs()) {
				for (RunItem runItem : run.runItems()) {
					if (runItem instanceof Table) {
						if (n == index) {
							return (Table) runItem;
						}
						
						n++;
					}
				}
			}
		}
		
		return null;
	}
    
    public static void deleteLastN(Table table, int n) {
    	for (int i = 0; i < n; i++) {
    		deleteLastRow(table);
    	}
    }
    
    public static void deleteLastRow(Table table) {
    	int lastIndex = table.countOfTr() - 1;
    	deleteRow(table, lastIndex);
    }
    
    public static void deleteRow(Table table, int rowIndex) {
    	int cnt = table.countOfTr();
		
		if (cnt == 0) {
			return;
		}
		
		((List<Tr>) table.trs()).remove(rowIndex);
		
		table.rowCnt((short) (cnt - 1));
    }
    
    public void save(String outputPath) throws Exception {
        if (hwpxFile == null) {
            throw new IllegalStateException("Load template file first.");
        }
        HWPXWriter.toFilepath(hwpxFile, outputPath);
    }

    public HWPXFile getHwpxFile() {
        return hwpxFile;
    }

    private void processSection(SectionXMLFile section) {
        for (int i = 0; i < section.countOfPara(); i++) {
            processPara(section.getPara(i));
        }
    }

    private void processPara(Para para) {
        if (para == null) return;

        for (int i = 0; i < para.countOfRun(); i++) {
            processRun(para.getRun(i));
        }
    }

    private void processRun(Run run) {
        if (run == null) return;

        for (int i = 0; i < run.countOfRunItem(); i++) {
            RunItem item = run.getRunItem(i);

            if (item instanceof T) {
                processT((T) item, run);
            } else if (item instanceof Table) {
                processTable((Table) item);
            } else if (item instanceof Picture) {
                processPicture((Picture) item);
            }
        }
    }

    private void processTable(Table table) {
        if (table == null) return;

        for (Tr tr : table.trs()) {
            for (Tc tc : tr.tcs()) {
                SubList subList = tc.subList();
                if (subList != null) {
                    processSubList(subList);
                }
            }
        }
    }

    private void processPicture(Picture picture) {
        if (picture == null) return;

        // 이미지 캡션의 SubList 처리
        if (picture.caption() != null && picture.caption().subList() != null) {
            processSubList(picture.caption().subList());
        }
    }

    private void processSubList(SubList subList) {
        if (subList == null) return;

        for (int i = 0; i < subList.countOfPara(); i++) {
            processPara(subList.getPara(i));
        }
    }

    private void processT(T t, Run run) {
    	if (t == null) return;

    	// 1. 단일 텍스트 처리 로직 분리
    	if (t.isOnlyText()) {
    		handleOnlyText(t, run);
    		return;
    	}

    	// 2. 아이템 리스트 처리 로직 분리
    	handleItemList(t, run);
    }

    private void handleOnlyText(T t, Run run) {
    	String onlyText = t.onlyText();
    	if (onlyText == null || onlyText.isEmpty()) return;

    	String replaced = replaceVariables(onlyText, run);
    	if(!replaced.equals(onlyText)) {
    		t.clear();
    		t.addText(replaced);
    	}
    }

    private void handleItemList(T t, Run run) {
    	for (int i = 0; i < t.countOfItems(); i++) {
    		TItem tItem = t.getItem(i);
    		if (tItem instanceof NormalText) {
    			updateNormalText((NormalText) tItem, run);
    		}
    	}
    }

    private void updateNormalText(NormalText normalText, Run run) {
    	String text = normalText.text();
    	if (text == null) return;

    	String replaced = replaceVariables(text, run);
    	if (!replaced.equals(text)) {
    		normalText.text(replaced);
    	}
    }

    /**
     * "{키}" 를 값으로 치환한다. 치환된 키가 highlightKeys 에 있으면 해당 Run 의 글자모양을 파란색으로 바꾼다.
     * 템플릿은 셀의 한 줄(문단)당 Run 1개 구조이므로 Run 단위 색 지정이 셀 한 줄에 정확히 대응한다.
     */
    private String replaceVariables(String text, Run run) {
        String result = text;
        for (Map.Entry<String, String> entry : variables.entrySet()) {
        	String token = "{" + entry.getKey() + "}";
        	if (!result.contains(token)) {
        		continue;
        	}

        	result = result.replace(token, entry.getValue());
//        	if (run != null && highlightKeys.contains(entry.getKey())) {
//        		run.charPrIDRef(blueText.id());
//        	}
        }
        return result;
    }
}
