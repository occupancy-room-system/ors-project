package th.mfu.service;

import th.mfu.dto.request.UserRegisterRequest;
import th.mfu.dto.request.UserUpdateRequest;
import th.mfu.dto.response.UserResponse;

import java.util.List;

public interface UserService {

    List<UserResponse> getAllUsers();

    UserResponse getUserById(Long id);

    UserResponse getUserByUsername(String username);

    UserResponse createUser(UserRegisterRequest request);

    UserResponse updateUser(Long id, UserUpdateRequest request);

    void deleteUser(Long id);
}
