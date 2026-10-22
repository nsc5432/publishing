package aoms.pm.castapi.log;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

public class CastApiContext {
    private final List<Consumer<PrintWriter>> errors = new ArrayList<>();

    public void addException(Exception exception) {
        errors.add(exception::printStackTrace);
    }

    public void addFailure(String reason) {
        errors.add(writer -> writer.println(reason));
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }

    public String formatErrors(String apiTypeCd) {
        StringWriter output = new StringWriter();
        PrintWriter writer = new PrintWriter(output);

        writer.println("API 유형 코드=" + apiTypeCd);
        
        for (int i = 0; i < errors.size(); i++) {
            writer.println("오류[" + (i + 1) + "]");
            errors.get(i).accept(writer);
        }
        
        writer.flush();
        return output.toString();
    }
}
