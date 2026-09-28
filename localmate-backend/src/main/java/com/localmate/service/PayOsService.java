package com.localmate.service;

import com.localmate.config.PayOsConfig;
import com.localmate.model.Booking;
import com.localmate.model.PaymentTransaction;
import com.localmate.repository.BookingRepository;
import com.localmate.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings({"unchecked", "rawtypes", "null"})
public class PayOsService {

    private final PayOsConfig payOsConfig;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Create payment link with PayOS VietQR
     */
    public Map<String, Object> createPaymentLink(
            String bookingId,
            long amountVnd,
            String customDescription,
            String buyerName,
            String buyerEmail
    ) {
        // PayOS orderCode must be a positive integer <= 9007199254740991
        long orderCode = (System.currentTimeMillis() % 1000000000L) + (long) (Math.random() * 1000);

        // PayOS description: max 25 characters, alphanumeric (no Vietnamese accents)
        String description = "Pay " + orderCode;
        if (customDescription != null && !customDescription.isBlank()) {
            String sanitized = customDescription.replaceAll("[^a-zA-Z0-9 ]", "").trim();
            if (sanitized.length() > 25) {
                sanitized = sanitized.substring(0, 25);
            }
            if (!sanitized.isBlank()) {
                description = sanitized;
            }
        }

        String returnUrl = payOsConfig.getReturnUrl();
        String cancelUrl = payOsConfig.getCancelUrl();

        // PayOS signature data rule: amount, cancelUrl, description, orderCode, returnUrl (alphabetical)
        String signData = "amount=" + amountVnd +
                "&cancelUrl=" + cancelUrl +
                "&description=" + description +
                "&orderCode=" + orderCode +
                "&returnUrl=" + returnUrl;

        String signature = payOsConfig.hmacSHA256(payOsConfig.getChecksumKey(), signData);

        // Build Request Body
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("orderCode", orderCode);
        requestBody.put("amount", amountVnd);
        requestBody.put("description", description);
        requestBody.put("cancelUrl", cancelUrl);
        requestBody.put("returnUrl", returnUrl);
        requestBody.put("signature", signature);

        if (buyerName != null && !buyerName.isBlank()) requestBody.put("buyerName", buyerName);
        if (buyerEmail != null && !buyerEmail.isBlank()) requestBody.put("buyerEmail", buyerEmail);

        // Item details
        List<Map<String, Object>> items = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("name", "Guided Tour Booking " + bookingId);
        item.put("quantity", 1);
        item.put("price", amountVnd);
        items.add(item);
        requestBody.put("items", items);

        // Set Headers
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-client-id", payOsConfig.getClientId());
        headers.set("x-api-key", payOsConfig.getApiKey());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            log.info("Sending create payment request to PayOS for orderCode: {}", orderCode);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    PayOsConfig.PAYOS_API_URL,
                    entity,
                    Map.class
            );

            Map<String, Object> body = response.getBody();
            if (body != null && "00".equals(body.get("code"))) {
                Map<String, Object> data = (Map<String, Object>) body.get("data");
                String checkoutUrl = (String) data.get("checkoutUrl");
                String qrCode = (String) data.get("qrCode");

                // Save pending transaction to MongoDB
                try {
                    PaymentTransaction transaction = PaymentTransaction.builder()
                            .bookingId(bookingId)
                            .amount((double) amountVnd)
                            .currency("VND")
                            .paymentMethod("PAYOS")
                            .transactionRef(String.valueOf(orderCode))
                            .status("PENDING")
                            .createdAt(Instant.now())
                            .build();
                    paymentRepository.save(transaction);
                } catch (Exception e) {
                    log.warn("Could not save initial transaction for PayOS: {}", e.getMessage());
                }

                Map<String, Object> res = new HashMap<>();
                res.put("status", "SUCCESS");
                res.put("checkoutUrl", checkoutUrl);
                res.put("qrCode", qrCode);
                res.put("orderCode", orderCode);
                res.put("bookingId", bookingId);
                res.put("amount", amountVnd);
                return res;
            } else {
                String desc = body != null ? (String) body.get("desc") : "Unknown PayOS error";
                throw new RuntimeException("PayOS error: " + desc);
            }
        } catch (Exception e) {
            log.error("PayOS API call failed: {}", e.getMessage());
            throw new RuntimeException("Failed to create PayOS payment link: " + e.getMessage(), e);
        }
    }

    /**
     * Query PayOS order status and update Booking + PaymentTransaction
     */
    public Map<String, Object> verifyPaymentStatus(long orderCode) {
        String url = PayOsConfig.PAYOS_API_URL + "/" + orderCode;

        HttpHeaders headers = new HttpHeaders();
        headers.set("x-client-id", payOsConfig.getClientId());
        headers.set("x-api-key", payOsConfig.getApiKey());

        HttpEntity<?> entity = new HttpEntity<>(headers);

        Map<String, Object> result = new HashMap<>();
        result.put("orderCode", orderCode);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
            Map<String, Object> body = response.getBody();

            if (body != null && "00".equals(body.get("code"))) {
                Map<String, Object> data = (Map<String, Object>) body.get("data");
                String status = (String) data.get("status");
                Number amount = (Number) data.get("amount");

                result.put("status", status);
                result.put("amount", amount);
                result.put("data", data);

                // Find associated transaction and booking
                Optional<PaymentTransaction> transOpt = paymentRepository.findByTransactionRef(String.valueOf(orderCode));
                if (transOpt.isEmpty()) {
                    transOpt = paymentRepository.findAll().stream()
                            .filter(t -> String.valueOf(orderCode).equals(t.getTransactionRef()))
                            .findFirst();
                }

                if (transOpt.isPresent()) {
                    PaymentTransaction trans = transOpt.get();
                    String bookingId = trans.getBookingId();
                    result.put("bookingId", bookingId);

                    if ("PAID".equalsIgnoreCase(status)) {
                        trans.setStatus("SUCCESS");
                        paymentRepository.save(trans);

                        if (bookingId != null) {
                            Optional<Booking> bookingOpt = bookingRepository.findById(bookingId);
                            if (bookingOpt.isPresent()) {
                                Booking b = bookingOpt.get();
                                b.setPaymentStatus("PAID");
                                b.setUpdatedAt(Instant.now());
                                bookingRepository.save(b);
                                result.put("tourName", b.getTourName());
                                result.put("bookingDate", b.getBookingDate());
                            }
                        }
                    } else if ("CANCELLED".equalsIgnoreCase(status)) {
                        trans.setStatus("CANCELLED");
                        paymentRepository.save(trans);
                    }
                }

                return result;
            } else {
                result.put("status", "FAILED");
                result.put("message", body != null ? body.get("desc") : "Could not verify order");
                return result;
            }
        } catch (Exception e) {
            log.warn("Could not query PayOS order {}: {}", orderCode, e.getMessage());
            result.put("status", "PENDING");
            result.put("message", "Payment status check: " + e.getMessage());
            return result;
        }
    }

    /**
     * Handle incoming PayOS Webhook
     */
    public Map<String, Object> handleWebhook(Map<String, Object> webhookPayload) {
        log.info("Received PayOS webhook: {}", webhookPayload);
        Map<String, Object> res = new HashMap<>();

        try {
            Map<String, Object> data = (Map<String, Object>) webhookPayload.get("data");
            if (data != null) {
                Number orderCodeNum = (Number) data.get("orderCode");
                String code = (String) data.get("code");

                if (orderCodeNum != null && "00".equals(code)) {
                    long orderCode = orderCodeNum.longValue();
                    verifyPaymentStatus(orderCode);
                }
            }
            res.put("success", true);
        } catch (Exception e) {
            log.error("Error processing PayOS webhook: {}", e.getMessage());
            res.put("success", false);
            res.put("error", e.getMessage());
        }
        return res;
    }
}
