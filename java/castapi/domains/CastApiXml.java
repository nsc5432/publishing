package aoms.pm.castapi.domains;

import static aoms.pm.castapi.service.statics.CastApiConstants.*;

import java.io.IOException;
import java.io.StringReader;
import java.util.Optional;
import java.util.function.Consumer;

import javax.servlet.http.HttpServletRequest;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;
import org.xml.sax.SAXException;

public final class CastApiXml {
    private CastApiXml() {
        throw new UnsupportedOperationException("생성자를 제공하지 않습니다.");
    }

    static Document parseXmlSafely(String xmlStr) throws ParserConfigurationException, SAXException, IOException {
        DocumentBuilderFactory dbf = DocumentBuilderFactory.newDefaultInstance();

        dbf.setFeature(DISALLOW_DOCTYPE_DECL, true);
        dbf.setFeature(EXTERNAL_GENERAL_ENTITIES, false);
        dbf.setFeature(EXTERNAL_PARAMETER_ENTITIES, false);
        dbf.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
        dbf.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
        dbf.setXIncludeAware(false);
        dbf.setExpandEntityReferences(false);

        try (StringReader sr = new StringReader(xmlStr)) {
            DocumentBuilder db = dbf.newDocumentBuilder();
            Document document = db.parse(new InputSource(sr));
            if (document == null) {
                throw new SAXException("XML 문서를 읽지 못했습니다.");
            }
            return document;
        }
    }

    public static Element parseRootElement(String xmlStr) throws ParserConfigurationException, SAXException, IOException {
        Document document = parseXmlSafely(xmlStr);
        Element root = document.getDocumentElement();
        if (root == null) {
            throw new SAXException("XML 루트 요소가 없습니다.");
        }
        return root;
    }

    public static Optional<String> getAttributeValue(NamedNodeMap attributeMap, String attributeName) {
        if (attributeMap == null) return Optional.empty();

        Node attr = attributeMap.getNamedItem(attributeName);
        if (attr != null) {
            return Optional.ofNullable(attr.getNodeValue());
        }

        return Optional.empty();
    }

    static Optional<String> remoteAddr() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return Optional.empty();
        }
        HttpServletRequest request = attributes.getRequest();
        return Optional.ofNullable(request.getRemoteAddr());
    }

    // 요청 컨텍스트가 없으면 setter 를 부르지 않는다. 세션에서 채운 값을 null 로 덮지 않기 위해서다.
    static void applyRemoteAddr(Consumer<String> setter) {
        remoteAddr().ifPresent(setter);
    }

    static void openGetResource(StringBuilder sb) {
        sb.append(XML_VERSION)
          .append(System.lineSeparator())
          .append(SOAP_ENVELOPE_START)
          .append(System.lineSeparator())
          .append(TAB_ONE).append(SOAP_BODY_START)
          .append(System.lineSeparator())
          .append(TAB_TWO).append(RES_GET_RESOURCE_START)
          .append(System.lineSeparator());
    }

    static void closeGetResource(StringBuilder sb, boolean result) {
        sb.append(TAB_THREE).append(INVOCATION_RESULT)
          .append(result ? TRUE : FALSE).append(INVOCATION_RESULT_MESSAGE).append(result ? MESSAGE_OK : MESSAGE_NOT_OK).append("\"/>")
          .append(System.lineSeparator())
          .append(TAB_TWO).append(RES_GET_RESOURCE_END)
          .append(System.lineSeparator())
          .append(TAB_ONE).append(SOAP_BODY_END)
          .append(System.lineSeparator())
          .append(SOAP_ENVELOPE_END);
    }

    public static String setResourceResponse(boolean result) {
        StringBuilder sb = new StringBuilder();
        sb.append(XML_VERSION)
          .append(System.lineSeparator())
          .append(SOAP_ENVELOPE_START)
          .append(System.lineSeparator())
          .append(SOAP_BODY_START)
          .append(System.lineSeparator())
          .append(RES_SET_RESURCE_START)
          .append(System.lineSeparator())
          .append(INVOCATION_RESULT)
          .append(result ? TRUE : FALSE)
          .append(INVOCATION_RESULT_MESSAGE)
          .append(result ? MESSAGE_OK : MESSAGE_NOT_OK)
          .append("\"/>")
          .append(System.lineSeparator())
          .append(RES_SET_RESURCE_END)
          .append(System.lineSeparator())
          .append(SOAP_BODY_END)
          .append(System.lineSeparator())
          .append(SOAP_ENVELOPE_END);
        return sb.toString();
    }
}
