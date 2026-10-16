package th.mfu.service;

import th.mfu.dto.request.UserLoginRequest;
import th.mfu.dto.request.UserRegisterRequest;
import th.mfu.dto.response.AuthResponse;
import th.mfu.dto.response.UserResponse;

public interface AuthService {

    UserResponse register(UserRegisterRequest request);

    AuthResponse login(UserLoginRequest request);
}
