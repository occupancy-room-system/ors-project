package th.mfu.service.impl;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import th.mfu.dto.request.UserLoginRequest;
import th.mfu.dto.request.UserRegisterRequest;
import th.mfu.dto.response.AuthResponse;
import th.mfu.dto.response.UserResponse;
import th.mfu.entity.Role;
import th.mfu.entity.User;
import th.mfu.exception.BadRequestException;
import th.mfu.exception.ResourceNotFoundException;
import th.mfu.repository.UserRepository;
import th.mfu.security.CustomUserPrincipal;
import th.mfu.security.JwtTokenProvider;
import th.mfu.service.AuthService;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
    }

    @Override
    @Transactional
    public UserResponse register(UserRegisterRequest request) {
        String identifier = request.getStudentId();
        if (identifier == null || identifier.trim().isEmpty()) {
            identifier = request.getUsername();
        }
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new BadRequestException("Student ID is required");
        }
        identifier = identifier.trim();

        if (userRepository.existsByUsername(identifier)) {
            throw new BadRequestException("Student ID '" + identifier + "' is already registered");
        }

        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            email = identifier + "@lamduan.mfu.ac.th";
        } else {
            email = email.trim().toLowerCase();
        }

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email '" + email + "' is already registered");
        }

        User user = new User();
        user.setUsername(identifier);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName() != null && !request.getFullName().trim().isEmpty()
                ? request.getFullName().trim()
                : identifier);
        user.setRole(Role.STUDENT);

        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }

    @Override
    public AuthResponse login(UserLoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail().trim(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);

        CustomUserPrincipal principal = (CustomUserPrincipal) authentication.getPrincipal();
        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        return new AuthResponse(token, UserResponse.fromEntity(user));
    }
}
