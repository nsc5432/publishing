package aoms.pm.cast.domains.queue;

/**
 * 도메인 입력의 형식 검증이다. 잘못된 입력과 계산에 필요한 값의 부재를 구분한다.
 * null은 '원천에 없음'이라 허용하지만, 음수·NaN·무한대는 잘못된 값이라 생성 시 거부한다.
 * 이 검증을 통과해도 Little's Law나 M/M/s의 통계적 가정이 충족되었다는 의미는 아니다.
 */
final class QueueInputValidation {
    private QueueInputValidation() { }

    static String requiredText(String value, String name) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(name + " must not be blank");
        }
        return value;
    }

    static void nonNegative(Double value, String name) {
        if (value != null && (!Double.isFinite(value) || value < 0)) {
            throw new IllegalArgumentException(name + " must be finite and non-negative");
        }
    }

    static void nonNegative(Integer value, String name) {
        if (value != null && value < 0) {
            throw new IllegalArgumentException(name + " must be non-negative");
        }
    }

    static void positive(double value, String name) {
        if (!Double.isFinite(value) || value <= 0) {
            throw new IllegalArgumentException(name + " must be finite and positive");
        }
    }
}
