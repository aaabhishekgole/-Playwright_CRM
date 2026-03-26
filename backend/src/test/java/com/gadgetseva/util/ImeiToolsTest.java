package com.gadgetseva.util;

import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class ImeiToolsTest {

    @Test
    void extractsImeiFromQrPayload() {
        Optional<String> extracted = ImeiTools.extractImeiFromQr("MODEL=S23;IMEI=490154203237518;SN=ABC");
        Assertions.assertEquals(Optional.of("490154203237518"), extracted);
    }

    @Test
    void validatesImeiUsingLuhnChecksum() {
        Assertions.assertTrue(ImeiTools.isValid("490154203237518"));
        Assertions.assertFalse(ImeiTools.isValid("490154203237519"));
    }
}