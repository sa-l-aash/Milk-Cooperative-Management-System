package com.coop.milk.services;

import com.africastalking.AfricasTalking;
import com.africastalking.SmsService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class NotificationService {

    @Value("${africastalking.username}")
    private String username;

    @Value("${africastalking.apiKey}")
    private String apiKey;

    private SmsService smsService;

    // 💡 This initializes the connection to Africa's Talking the moment your server starts
    @PostConstruct
    public void init() {
        AfricasTalking.initialize(username, apiKey);
        this.smsService = AfricasTalking.getService(AfricasTalking.SERVICE_SMS);
    }

    public void sendMonthlyStatementSms(String phoneNumber, String farmerName, String month, double liters, double payout) {
        // 1. Format the message exactly how it will appear on the phone
        String message = String.format(
            "Hello %s, your %s Milk Statement is ready.\nVolume: %.2f L\nNet Payout: KES %.2f\nLog in to your Coop Dashboard to view details.",
            farmerName, month, liters, payout
        );

        try {
            // 2. Fire the message! (In Sandbox, the sender ID is usually omitted or set to a shortcode)
            System.out.println(" Dispatching SMS to " + phoneNumber + "...");
            
            // The AT SDK expects an array of phone numbers, even if we are only sending to one
            String[] recipients = new String[]{phoneNumber};
            
            // Send the SMS
            var response = smsService.send(message, recipients, true);
            System.out.println(" SMS Gateway Response: " + response.toString());
            
        } catch (IOException e) {
            System.err.println(" FAILED to send SMS to " + phoneNumber + ": " + e.getMessage());
        }
    }
}