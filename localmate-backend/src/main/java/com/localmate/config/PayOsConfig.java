package com.localmate.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Configuration
@Getter
public class PayOsConfig {

    @Value("${payos.client-id:YOUR_PAYOS_CLIENT_ID}")
    private String clientId;

    @Value("${payos.api-key:YOUR_PAYOS_API_KEY}")
    private String apiKey;

    @Value("${payos.checksum-key:YOUR_PAYOS_CHECKSUM_KEY}")
    private String checksumKey;

    @Value("${payos.return-url:http://localhost:5173/payment-result}")
    private String returnUrl;

    @Value("${payos.cancel-url:http://localhost:5173/payment-result}")
    private String cancelUrl;

    public static final String PAYOS_API_URL = "https://api-merchant.payos.vn/v2/payment-requests";

    /**
     * Compute HMAC-SHA256 signature for PayOS
     */
    public String hmacSHA256(String key, String data) {
        try {
            Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
            SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            sha256_HMAC.init(secret_key);
            byte[] bytes = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Error calculating HMAC-SHA256 signature: " + e.getMessage(), e);
        }
    }
}
