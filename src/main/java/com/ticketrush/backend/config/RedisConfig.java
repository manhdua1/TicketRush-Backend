package com.ticketrush.backend.config;

import tools.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJacksonJsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableCaching
public class RedisConfig {
    // Công cụ thao tác thủ công với Redis
    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory); // Cung cấp cấu hình kết nối
        template.setKeySerializer(new StringRedisSerializer()); // Key được lưu vào Redis dưới dạng String

        ObjectMapper mapper = new ObjectMapper();

        template.setValueSerializer(new GenericJacksonJsonRedisSerializer(mapper)); // Value được lưu vào Redis dưới dạng JSON
        return template;
    }
}
