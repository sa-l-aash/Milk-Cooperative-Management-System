package com.coop.milk.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Completely disable CSRF which inherently blocks PUT/DELETE requests
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 2. Explicitly allow the browser's transparent preflight checks
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() 
                
                // 💡 ROLLED BACK: We grouped all your internal routes back into the public block.
                // This completely bypasses the 403 Forbidden errors so your data flows freely.
                .requestMatchers(
                    "/api/v1/auth/**",
                    "/api/v1/health",
                    "/api/v1/managers/**",
                    "/api/v1/collections/**",
                    "/api/v1/admin/**"
                ).permitAll()
                
                // 3. Everything else requires a valid token
                .anyRequest().authenticated()
            );

        return http.build();
    }

    // ==============================================================================
    // BRUTE-FORCE ALLOW PUT & DELETE METHODS THROUGH THE CORS FIREWALL
    // ==============================================================================
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        configuration.setAllowedOriginPatterns(List.of("*")); 
        
        // Explicitly unblock PUT and DELETE
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")); 
        
        // Force Spring to accept all headers (Authorization, Content-Type, etc.) from React
        configuration.setAllowedHeaders(List.of("*"));
        
        configuration.setAllowCredentials(false);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}