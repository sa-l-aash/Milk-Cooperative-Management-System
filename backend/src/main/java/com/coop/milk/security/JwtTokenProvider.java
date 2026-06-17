package com.coop.milk.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // A secure, development security key to sign our digital token passes
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    
    // The token pass will be valid for exactly 24 hours after login
    private final long jwtExpirationInMs = 86400000;

    // 1. Generate a secure token pass when a user logs in successfully
    public String generateToken(String usernameOrFarmerNumber, String role) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(usernameOrFarmerNumber)
                .claim("role", role)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(key)
                .compact();
    }

    // 2. Extract the identifier out of a presented token pass
    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    // 3. Validate that a token pass is authentic and hasn't expired
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(authToken);
            return true;
        } catch (Exception ex) {
            // Token is invalid, forged, or expired
            return false;
        }
    }
}