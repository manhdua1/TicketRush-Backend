package com.ticketrush.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /topic cho broadcast (seat status, queue status...)
        // /queue cho tin nhắn cá nhân
        registry.enableSimpleBroker("/topic", "/queue");

        /**
         * Client gửi tin nhắn có tiền tố /app, tự động bỏ /app và tìm tới các controller
         * gắn @MessageMapping("/sendMessage") để xử lý
         */
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // Fallback cho browser không hỗ trợ WebSocket
    }
}
