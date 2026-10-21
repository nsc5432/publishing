package aoms.pm.cast.domains.queue;

final class QueueInputValidation {
    private QueueInputValidation() { }

    static String requiredText(String value, String name) {
        if (value == null || value.isEmpty()) {
            throw new IllegalArgumentException(name + " 값은 비어 있을 수 없습니다.");
        }
        return value;
    }

    static void nonNegative(Double value, String name) {
        if (value != null && (!Double.isFinite(value) || value < 0)) {
            throw new IllegalArgumentException(name + " 값은 0 이상의 유한한 숫자여야 합니다.");
        }
    }

    static void nonNegative(Integer value, String name) {
        if (value != null && value < 0) {
            throw new IllegalArgumentException(name + " 값은 0 이상이어야 합니다.");
        }
    }

    static void positive(double value, String name) {
        if (!Double.isFinite(value) || value <= 0) {
            throw new IllegalArgumentException(name + " 값은 0보다 큰 유한한 숫자여야 합니다.");
        }
    }
}
