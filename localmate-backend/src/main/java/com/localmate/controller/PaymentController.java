package com.localmate.controller;

import com.localmate.model.PaymentTransaction;
import com.localmate.repository.PaymentRepository;
import com.localmate.service.PayOsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PaymentController {

    private final PayOsService payOsService;
    private final PaymentRepository paymentRepository;

    /**
     * Create PayOS VietQR payment link
     */
    @PostMapping("/payos/create-payment")
    public ResponseEntity<?> createPayOsPayment(@RequestBody Map<String, Object> payload) {
        try {
            String bookingId = (String) payload.get("bookingId");
            Number amountNum = (Number) payload.get("amount");
            if (amountNum == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Payment amount is required"));
            }
            long amount = amountNum.longValue();
            String description = (String) payload.get("description");
            String buyerName = (String) payload.get("buyerName");
            String buyerEmail = (String) payload.get("buyerEmail");

            Map<String, Object> result = payOsService.createPaymentLink(bookingId, amount, description, buyerName, buyerEmail);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Error initializing PayOS payment: " + e.getMessage()));
        }
    }

    /**
     * Verify PayOS payment status by orderCode
     */
    @GetMapping("/payos/verify/{orderCode}")
    public ResponseEntity<?> verifyPayOsPayment(@PathVariable long orderCode) {
        try {
            Map<String, Object> result = payOsService.verifyPaymentStatus(orderCode);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("status", "FAILED", "message", e.getMessage()));
        }
    }

    /**
     * PayOS Webhook receiver
     */
    @PostMapping("/payos/webhook")
    public ResponseEntity<?> handlePayOsWebhook(@RequestBody Map<String, Object> webhookData) {
        return ResponseEntity.ok(payOsService.handleWebhook(webhookData));
    }

    /**
     * Get transaction by booking ID
     */
    @GetMapping("/transactions/{bookingId}")
    public ResponseEntity<?> getTransactionByBooking(@PathVariable String bookingId) {
        return paymentRepository.findByBookingId(bookingId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * List all transactions
     */
    @GetMapping("/transactions")
    public ResponseEntity<List<PaymentTransaction>> getAllTransactions() {
        return ResponseEntity.ok(paymentRepository.findAll());
    }
}
