package com.ticketrush.backend.mapper;

import com.ticketrush.backend.dto.response.UserResponse;
import com.ticketrush.backend.entity.User;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    UserResponse toUserResponse(User user);
}
