package aoms.pm.utils;

import java.util.HashMap;
import java.util.HashSet;
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
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.object.shapeobject.ShapeObject;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.object.table.Tc;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.object.table.Tr;
import kr.dogfoot.hwpxlib.object.content.section_xml.paragraph.t.NormalText;
import kr.dogfoot.hwpxlib.writer.HWPXWriter;

public class HwpxUtils {
	private static final int BASE_CHAR_PR_INDEX = 9;
	private static final String BLUE = "#0000FF";

	private final HWPXFile hwpxFile;
	private final Map<String, String> variables = new HashMap<>();
	private final Set<String> highlightKeys = new HashSet<>();
	private final CharPr blueText;

	public HwpxUtils(HWPXFile hwpxFile) {
		this.hwpxFile = hwpxFile;
		this.blueText = createBlueCharPr(hwpxFile);
	}

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
				clearEmptyContent(targetTable);
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
		if (tc.subList() == null) {
			return;
		}

		int paraCount = tc.subList().countOfPara();
		for (int i = paraCount - 1; i >= 0; i--) {
			Para para = tc.subList().getPara(i);

			if (tc.subList().countOfPara() > 1 && isParaEmpty(para)) {
				tc.subList().removePara(para);
			}
		}
	}

	private boolean isParaEmpty(Para para) {
		for (Run run : para.runs()) {
			for (RunItem item : run.runItems()) {

				if (!(item instanceof T)) {
					return false;
				}

				T text = (T) item;
				if (!text.isEmpty() && (!text.isOnlyText() || !"".equals(text.onlyText())))	 {
					return false;
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
		if (table == null || n < 0 || n >= table.countOfTr()) {
			throw new IllegalArgumentException("Invalid number of table rows to delete: " + n);
		}

		for (int i = table.countOfTr() - n; i < table.countOfTr(); i++) {
			validateRowDeletion(table, i);
		}

		for (int i = 0; i < n; i++) {
			deleteLastRow(table);
		}
	}

	public static void deleteLastRow(Table table) {
		if (table == null) {
			throw new IllegalArgumentException("Table must not be null.");
		}

		int lastIndex = table.countOfTr() - 1;
		deleteRow(table, lastIndex);
	}

	public static void deleteRow(Table table, int rowIndex) {
		validateRowDeletion(table, rowIndex);
		table.removeTr(rowIndex);
		for (int i = rowIndex; i < table.countOfTr(); i++) {
			for (Tc tc : table.getTr(i).tcs()) {
				tc.cellAddr().rowAddr((short) i);
			}

			normalizeTableHeight(table);
		}
	}

	private static void validateRowDeletion(Table table, int rowIndex) {
		if (table == null || table.countOfTr() <= 1 || rowIndex < 0 || rowIndex >= table.countOfTr()) {
			throw new IllegalArgumentException("Invalid table row to delete: " + rowIndex);
		}

		for (Tr tr : table.trs()) {
			for (Tc tc : tr.tcs()) {
				int start = tc.cellAddr().rowAddr();
				int span = tc.cellSpan().rowSpan();

				if (span > 1 && start <= rowIndex && rowIndex < start + span) {
					throw new IllegalArgumentException("세로 병합을 삭제하면 구조가 깨집니다: " + rowIndex);
				}
			}
		}
	}

	private static void normalizeTableHeight(Table table) {
		int rowCount = table.countOfTr();
		long[] bottom = new long[rowCount + 1];
		int spacing = table.cellSpacing() == null ? 0 : table.cellSpacing();
		
		for (int row = 0; row < rowCount; row++) {
			long top = bottom[row] + (row == 0 ? 0 : spacing);
			bottom[row + 1] = Math.max(bottom[row + 1], top);
			for (Tc tc : table.getTr(row).tcs()) {
				int end = row + tc.cellSpan().rowSpan();
				if (tc.cellAddr().rowAddr() != row || end <= row || end > rowCount) {
					throw new IllegalArgumentException("Invalid table cell row address or span");
				}

				bottom[end] = Math.max(bottom[end], top + tc.cellSz().height());
			}
		}

		table.rowCnt((short) rowCount);
		table.sz().height(bottom[rowCount]);
	}

	public void save(String outputPath) throws Exception {
		if (hwpxFile == null) {
			throw new IllegalStateException("Load template file first.");
		}

		for (SectionXMLFile section : hwpxFile.sectionXMLFileList().items()) {
			for (Para para : section.paras()) {
				prepareParaForSave(para);
			}
		}

		HWPXWriter.toFilepath(hwpxFile, outputPath);
	}

	private void prepareParaForSave(Para para) {
		para.removeLineSegArray();

		for (Run run : para.runs()) {
			for (RunItem item : run.runItems()) {
				if (item instanceof Table) {
					Table table = (Table) item;
					
					for (Tr tr: table.trs()) {
						for (Tc tc : tr.tcs()) {
							prepareSubListForSave(tc.subList());
						}
					}

					normalizeTableHeight(table);
				}

				if (item instanceof ShapeObject<?>) {
					ShapeObject<?> shape = (ShapeObject<?>) item;
					if (shape.caption() != null) {
						prepareSubListForSave(shape.caption().subList());
					}
				}
			}
		}
	}

	private void prepareSubListForSave(SubList subList) {
		if (subList != null) {
			for (int i = 0; i < subList.countOfPara(); i++) {
				prepareParaForSave(subList.getPara(i));
			}
		}
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
		if (para == null) {
			return;
		}

		for (int i = 0; i < para.countOfRun(); i++) {
			processRun(para.getRun(i));
		}
	}

	private void processRun(Run run) {
		if (run == null) {
			return;
		}

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
		if (table == null) {
			return;
		}

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
		if (picture == null) {
			return;
		}

		if (picture.caption() != null && picture.caption().subList() != null) {
			processSubList(picture.caption().subList());
		}
	}

	private void processSubList(SubList subList) {
		if (subList == null) {
			return;
		}

		for (int i = 0; i < subList.countOfPara(); i++) {
			processPara(subList.getPara(i));
		}
	}

	private void processT(T t, Run run) {
		if (t == null) {
			return;
		}

		if (t.isOnlyText()) {
			handleOnlyText(t, run);
			return;
		}

		handleItemList(t, run);
	}

	private void handleOnlyText(T t, Run run) {
		String onlyText = t.onlyText();
		if (onlyText == null || onlyText.isEmpty()) {
			return;
		}

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
		if (text == null) {
			return;
		}

		String replaced = replaceVariables(text, run);
		if (!replaced.equals(text)) {
			normalText.text(replaced);
		}
	}

	private String replaceVariables(String text, Run run) {
		String result = text;
		for (Map.Entry<String, String> entry : variables.entrySet()) {
			String token = "{" + entry.getKey() + "}";
			if (!result.contains(token)) {
				continue;
			}

			result = result.replace(token, entry.getValue());
			if (run != null && highlightKeys.contains(entry.getKey())) {
				run.charPrIDRef(blueText.id());
			}
		}
		return result;
	}
}
