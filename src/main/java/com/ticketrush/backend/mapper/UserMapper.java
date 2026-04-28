package com.ticketrush.backend.mapper;

import com.ticketrush.backend.dto.response.UserResponse;
import com.ticketrush.backend.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "avatarUrl", source = "avatarUrl")
    UserResponse toUserResponse(User user);
}
