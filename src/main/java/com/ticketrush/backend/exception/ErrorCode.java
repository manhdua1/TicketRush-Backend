package com.ticketrush.backend.exception;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.experimental.FieldDefaults;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

@Getter
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    EMAIL_EXISTED(1001, "Email đã được sử dụng", HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(1002, "Email hoặc mật khẩu sai", HttpStatus.UNAUTHORIZED),
    FULLNAME_REQUIRED(1003, "Họ và tên không được để trống", HttpStatus.BAD_REQUEST),
    EMAIL_REQUIRED(1004, "Email không được để trống", HttpStatus.BAD_REQUEST),
    INVALID_EMAIL(1005, "Email không đúng định dạng", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1006, "Mật khẩu chỉ trong khoảng 6 đến 20 kí tự", HttpStatus.BAD_REQUEST),
    INVALID_KEY(1007, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_NOT_FOUND(1008, "Người dùng không tồn tại", HttpStatus.BAD_REQUEST)
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    int code;
    String message;
    HttpStatusCode statusCode;
}
