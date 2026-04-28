package com.ticketrush.backend.service;

import com.ticketrush.backend.dto.request.UserUpdateRequest;
import com.ticketrush.backend.dto.response.UserResponse;
import com.ticketrush.backend.entity.User;
import com.ticketrush.backend.exception.AppException;
import com.ticketrush.backend.exception.ErrorCode;
import com.ticketrush.backend.mapper.UserMapper;
import com.ticketrush.backend.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;
    CloudinaryService cloudinaryService;

    public UserResponse getMyInfo(UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        return userMapper.toUserResponse(user);
    }

    public UserResponse updateMyInfo(UserUpdateRequest request, UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setFullName(request.getFullName());
        user.setGender(request.getGender());
        user.setDateOfBirth(request.getDateOfBirth());

        userRepository.save(user);

        return userMapper.toUserResponse(user);
    }

    public UserResponse uploadAvatar(MultipartFile file, UserDetails userDetails) {
        if (file.isEmpty())
            throw new AppException(ErrorCode.FILE_EMPTY);

        if (!file.getContentType().startsWith("image/"))
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);

        String avatarUrl = cloudinaryService.uploadAvatar(file);

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        user.setAvatarUrl(avatarUrl);
        userRepository.save(user);

        return userMapper.toUserResponse(user);
    }
}
