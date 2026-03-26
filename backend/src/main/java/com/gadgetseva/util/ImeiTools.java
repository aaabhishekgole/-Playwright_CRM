package com.gadgetseva.util;

import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class ImeiTools {

    private static final Pattern IMEI_PATTERN = Pattern.compile("(?<!\\d)(\\d{15})(?!\\d)");

    private ImeiTools() {
    }

    public static Optional<String> extractImeiFromQr(String payload) {
        if (payload == null || payload.isBlank()) {
            return Optional.empty();
        }
        Matcher matcher = IMEI_PATTERN.matcher(payload);
        if (matcher.find()) {
            return Optional.of(matcher.group(1));
        }
        return Optional.empty();
    }

    public static boolean isValid(String imei) {
        if (imei == null || !imei.matches("\\d{15}")) {
            return false;
        }
        int sum = 0;
        for (int index = 0; index < imei.length(); index++) {
            int digit = imei.charAt(imei.length() - 1 - index) - '0';
            if (index % 2 == 1) {
                digit *= 2;
                if (digit > 9) {
                    digit -= 9;
                }
            }
            sum += digit;
        }
        return sum % 10 == 0;
    }
}